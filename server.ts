import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import Stripe from 'stripe';
import { runDeterministicSafetyEngine } from './src/lib/deterministicEngine.js';
import { generateSyntheticMetar, generateSyntheticNotams } from './src/lib/mockAviationData.js';
import { lookupAirport, normalizeAirportCode } from './src/lib/airportData.js';
import { checkBriefingUsageMiddleware } from './src/middleware.js';
import { updateUserSubscriptionTier } from './src/lib/supabase.js';
import { generateDispatchHtml } from './app/api/export/pdf/route.js';
import { executeHazardMonitoringScan } from './app/api/cron/monitor/route.js';
import { processMessagingBotRequest } from './app/api/bot/webhook/route.js';
import { BriefingSummary, RawNotam, MetarData } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Stripe Client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_vayu_stripe_key';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

// Initialize server-side Gemini API client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is missing in environment variables');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper to fetch live NOAA METAR data with fast 3s fallback
async function fetchLiveMetar(icao: string): Promise<MetarData> {
  const code = icao.trim().toUpperCase();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${code}&format=raw`, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain, */*'
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 5) {
        const rawMetar = text.trim();
        // Parse flight category roughly
        let flightCategory: MetarData['flightCategory'] = 'VFR';
        if (/\bOVC00[0-4]\b|\b1\/[24]SM\b|\b1\/8SM\b/i.test(rawMetar)) flightCategory = 'LIFR';
        else if (/\b(OVC|BKN)0[0-9]\b|\b[1-2]SM\b/i.test(rawMetar)) flightCategory = 'IFR';
        else if (/\b(OVC|BKN)0(1|2|3)[0-9]\b|\b[3-5]SM\b/i.test(rawMetar)) flightCategory = 'MVFR';

        return {
          icao: code,
          rawText: rawMetar,
          timestamp: new Date().toISOString(),
          flightCategory,
        };
      }
    }
  } catch (err) {
    console.log(`[METAR Fetch] Live fetch status for ${code}: using backup data stream.`);
  }

  return generateSyntheticMetar(code);
}

function lookupFirCode(icao: string): string {
  const code = icao.trim().toUpperCase();
  if (code === 'VIDP' || code === 'VIAR' || code === 'VICG') return 'VIDF'; // Delhi FIR
  if (code === 'VABB' || code === 'VDGO' || code === 'VANP') return 'VABF'; // Mumbai FIR
  if (code === 'VOBL' || code === 'VOMM' || code === 'VOCI') return 'VOMF'; // Chennai FIR
  if (code === 'VECC' || code === 'VVEI' || code === 'VEPT') return 'VECF'; // Kolkata FIR
  if (code.startsWith('KJFK') || code.startsWith('KLGA') || code.startsWith('KEWR')) return 'KZNY'; // New York FIR
  if (code.startsWith('KLAX') || code.startsWith('KSAN') || code.startsWith('KSNA')) return 'KZLA'; // LA FIR
  if (code.startsWith('KDFW') || code.startsWith('KDAL')) return 'KZFW'; // Fort Worth FIR
  if (code.startsWith('KORD') || code.startsWith('KMDW')) return 'KZAU'; // Chicago FIR
  if (code.startsWith('EG')) return 'EGTT'; // London FIR
  return `${code.slice(0, 1)}FIR`;
}

// Helper to fetch live TAF forecast data
async function fetchLiveTaf(icao: string): Promise<string> {
  const code = icao.trim().toUpperCase();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://aviationweather.gov/api/data/taf?ids=${code}&format=raw`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain, */*',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 5) {
        return text.trim();
      }
    }
  } catch (err) {
    console.log(`[TAF Fetch] Live TAF fetch status for ${code}: using backup data stream.`);
  }

  return generateSyntheticTaf(code);
}

function decodeTafSummary(tafRaw: string): string {
  if (!tafRaw) return 'No terminal forecast available.';
  const lines = tafRaw.split(/\b(?=FM|TEMPO|BECMG|PROB)/);
  const formattedLines = lines.map((l) => l.trim()).filter(Boolean);
  return formattedLines.slice(0, 4).join('\n• ');
}

// Helper to fetch live NOTAM data with fast 3.5s fallback & international ICAO exchange
async function fetchLiveNotams(icao: string): Promise<RawNotam[]> {
  const code = icao.trim().toUpperCase();
  const firCode = lookupFirCode(code);

  // 1. Check environment variable for optional global NOTAM API
  if (process.env.GLOBAL_NOTAM_API_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${process.env.GLOBAL_NOTAM_API_URL}?icao=${code},${firCode}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any, idx: number) => ({
            id: item.notamId || `GLOBAL-${code}-${idx}`,
            icao: item.icao || code,
            rawText: item.icaoMessage || item.rawText || item.raw || JSON.stringify(item),
            effectiveStart: item.effectiveStart,
            effectiveEnd: item.effectiveEnd,
            type: item.type,
            isFir: item.icao === firCode || (item.rawText && item.rawText.includes('FIR')),
            firIcao: firCode,
          }));
        }
      }
    } catch (err) {
      console.log(`[GLOBAL_NOTAM_API] Global NOTAM fetch fallback for ${code}`);
    }
  }

  // 2. Default FAA / NOAA Aviation Weather API (Aerodrome + FIR)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://aviationweather.gov/api/data/notam?ids=${code},${firCode}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any, idx: number) => {
          const raw = item.icaoMessage || item.raw || JSON.stringify(item);
          const isFirItem = item.icao === firCode || (item.icao !== code && !raw.includes(`A) ${code}`));
          return {
            id: item.notamId || `LIVE-${code}-${idx}`,
            icao: item.icao || code,
            rawText: raw,
            effectiveStart: item.effectiveStart,
            effectiveEnd: item.effectiveEnd,
            type: item.type,
            isFir: isFirItem,
            firIcao: firCode,
          };
        });
      }
    }
  } catch (err) {
    console.log(`[NOTAM Fetch] Live fetch status for ${code}/${firCode}: using backup data stream.`);
  }

  return generateSyntheticNotams(code);
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'Project VAYU Pre-Flight Briefing API', version: '1.0.0' });
});

// Stripe Checkout Session Handler
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { planTier, userEmail, currency = 'USD' } = req.body;

    const unitAmount = planTier === 'FLEET'
      ? (currency === 'INR' ? 399900 : 4900)
      : (currency === 'INR' ? 79900 : 999);

    const priceName = planTier === 'FLEET' ? 'VAYU Fleet / Flight School Tier' : 'VAYU Pro Pilot Tier';

    // In local/preview environment without live Stripe keys, return simulated checkout URL or session
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        id: `cs_test_mock_${Date.now()}`,
        url: null,
        message: 'Mock Stripe Session initialized. Upgrading user directly.',
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail || 'pic.pilot@vayu.aero',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: priceName,
              description: 'FAR Part 91/121/135 Compliant Pre-Flight Intelligence Engine',
            },
            unit_amount: unitAmount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:3000'}?payment=success&tier=${planTier}`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}?payment=cancel`,
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Session error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create Stripe Checkout session.' });
  }
});

// Stripe Webhook Endpoint
app.post('/api/webhooks/stripe', async (req, res) => {
  try {
    const event = req.body;
    console.log(`[Stripe Express Webhook] Event received: ${event.type || 'generic_event'}`);

    const data = event.data?.object || {};

    if (event.type === 'checkout.session.completed') {
      const clientRefId = data.client_reference_id || data.metadata?.userId;
      const customerEmail = data.customer_email || data.customer_details?.email;
      const customerId = data.customer;
      const subscriptionId = data.subscription;

      await updateUserSubscriptionTier(
        { userId: clientRefId, email: customerEmail, customerId },
        'pro',
        subscriptionId
      );
    } else if (event.type === 'customer.subscription.updated') {
      const customerId = data.customer;
      const status = data.status;
      const newTier = (status === 'active' || status === 'trialing') ? 'pro' : 'free';

      await updateUserSubscriptionTier(
        { customerId, userId: data.metadata?.userId, email: data.metadata?.email },
        newTier,
        data.id
      );
    } else if (event.type === 'customer.subscription.deleted') {
      const customerId = data.customer;

      await updateUserSubscriptionTier(
        { customerId, userId: data.metadata?.userId, email: data.metadata?.email },
        'free',
        data.id
      );
    }

    return res.json({ received: true, status: 'processed', eventType: event.type });
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Enterprise Dispatch PDF Generator Endpoint
app.post('/api/export/pdf', async (req, res) => {
  try {
    const { briefing, operatorName, picName, tailNumber, dispatchNotes } = req.body;
    if (!briefing || !briefing.icao) {
      return res.status(400).json({ error: 'Briefing payload required for PDF export.' });
    }

    const { html, hash } = await generateDispatchHtml({
      briefing,
      operatorName,
      picName,
      tailNumber,
      dispatchNotes,
    });

    return res.json({ html, hash, generatedAtUtc: new Date().toISOString() });
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    return res.status(500).json({ error: 'Failed to generate dispatch PDF log.' });
  }
});

// Real-Time Hazard Monitoring Cron Endpoint
app.get('/api/cron/monitor', async (req, res) => {
  try {
    const result = await executeHazardMonitoringScan();
    return res.json(result);
  } catch (err: any) {
    console.error('Hazard Monitoring Error:', err);
    return res.status(500).json({ error: 'Hazard monitoring scan failed.' });
  }
});

// WhatsApp / Telegram Automated Briefing Bot Webhook Endpoint
app.post('/api/bot/webhook', async (req, res) => {
  try {
    const { from, sender, text, message, body, channel } = req.body;
    const result = await processMessagingBotRequest({
      fromNumberOrId: from || sender || 'unknown_pilot',
      messageText: text || message || body || '',
      channel: channel || 'WHATSAPP',
    });
    return res.json(result);
  } catch (err: any) {
    console.error('Bot Webhook Error:', err);
    return res.status(500).json({ error: 'Failed to process bot briefing request.' });
  }
});

// Single Airport Briefing API
app.post('/api/briefing', async (req, res) => {
  try {
    // Paywall Middleware Check
    const usageCheck = await checkBriefingUsageMiddleware(req);
    if (!usageCheck.allowed && usageCheck.errorPayload) {
      return res.status(402).json(usageCheck.errorPayload);
    }

    const { icao } = req.body;
    if (!icao || typeof icao !== 'string') {
      return res.status(400).json({ error: 'Airport identifier is required.' });
    }

    const cleanIcao = normalizeAirportCode(icao);
    if (!cleanIcao) {
      return res.status(400).json({ error: 'Invalid airport code format. Please enter a valid 3-letter FAA or 4-letter ICAO airport identifier (e.g., KDFW, DFW, KJFK).' });
    }

    const airportInfo = lookupAirport(cleanIcao);

    // Parallel Data Ingestion (METAR + TAF + NOTAMs)
    const [metar, tafRaw, rawNotams] = await Promise.all([
      fetchLiveMetar(cleanIcao),
      fetchLiveTaf(cleanIcao),
      fetchLiveNotams(cleanIcao),
    ]);

    // Deterministic Safety Engine Scan
    const flaggedNotams = runDeterministicSafetyEngine(rawNotams);

    const criticalCount = flaggedNotams.filter((n) => n.severity === 'CRITICAL').length;
    const warningCount = flaggedNotams.filter((n) => n.severity === 'WARNING').length;
    const totalNotams = flaggedNotams.length;

    const bucketCounts = {
      RUNWAYS_TFRS: flaggedNotams.filter((n) => n.category === 'RUNWAYS_TFRS').length,
      PROCEDURES_NAVAIDS: flaggedNotams.filter((n) => n.category === 'PROCEDURES_NAVAIDS').length,
      TAXIWAYS_APRON: flaggedNotams.filter((n) => n.category === 'TAXIWAYS_APRON').length,
      OBSTACLES_LIGHTING: flaggedNotams.filter((n) => n.category === 'OBSTACLES_LIGHTING').length,
      FIR_ENROUTE: flaggedNotams.filter((n) => n.category === 'FIR_ENROUTE').length,
      GENERAL: flaggedNotams.filter((n) => n.category === 'GENERAL').length,
    };

    let briefingResult: BriefingSummary;

    // Call Gemini API if Key Available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getAiClient();
        const prompt = `
You are an expert aviation flight dispatcher and pilot safety evaluator for Project VAYU.
Convert the provided raw METAR weather, raw TAF forecast, and flagged NOTAM strings into an executive, plain-English pre-flight briefing.

Airport ICAO: ${cleanIcao} (${airportInfo?.name || cleanIcao})
RAW METAR: ${metar.rawText}
RAW TAF FORECAST: ${tafRaw}
RAW NOTAMS & 5-BUCKET REGEX SEVERITY SCAN:
${JSON.stringify(flaggedNotams, null, 2)}

INSTRUCTIONS:
1. Translate METAR into concise plain English (wind, visibility, clouds, temperature/dewpoint, flight rules category).
2. Summarize TAF forecast trends in 2-3 concise bullets.
3. For CRITICAL ALERTS (Severity: CRITICAL): Provide a short headline, 1-2 sentence plain-English explanation of why it is dangerous, raw snippet, category, effective window, and PIC action required.
4. For WARNINGS (Severity: WARNING): Provide plain-English explanation, raw snippet, category, and effective window.
5. For INFO (Severity: INFO): Short bullet points summarizing remaining minor notices.
6. Provide a 1-2 sentence Pilot-in-Command (PIC) Takeaway summary.
`;

        let responseText: string | null = null;
        const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                temperature: 0.1,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    weather: {
                      type: Type.OBJECT,
                      properties: {
                        plainEnglishSummary: { type: Type.STRING },
                        tafDecodedSummary: { type: Type.STRING },
                        flightCategory: { type: Type.STRING },
                        windInfo: { type: Type.STRING },
                        visibilityInfo: { type: Type.STRING },
                        cloudInfo: { type: Type.STRING },
                        tempDewInfo: { type: Type.STRING },
                      },
                      required: ['plainEnglishSummary', 'flightCategory'],
                    },
                    criticalAlerts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          plainEnglish: { type: Type.STRING },
                          rawSnippet: { type: Type.STRING },
                          category: { type: Type.STRING },
                          actionRequired: { type: Type.STRING },
                          effectiveWindow: { type: Type.STRING },
                        },
                        required: ['title', 'plainEnglish', 'rawSnippet'],
                      },
                    },
                    warnings: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          plainEnglish: { type: Type.STRING },
                          rawSnippet: { type: Type.STRING },
                          category: { type: Type.STRING },
                          effectiveWindow: { type: Type.STRING },
                        },
                        required: ['title', 'plainEnglish', 'rawSnippet'],
                      },
                    },
                    infoItems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          plainEnglish: { type: Type.STRING },
                          rawSnippet: { type: Type.STRING },
                        },
                        required: ['title', 'plainEnglish', 'rawSnippet'],
                      },
                    },
                    picTakeaway: { type: Type.STRING },
                  },
                  required: ['weather', 'criticalAlerts', 'warnings', 'infoItems', 'picTakeaway'],
                },
              },
            });

            if (response.text) {
              responseText = response.text;
              break;
            }
          } catch (modelErr: any) {
            console.log(`[Gemini Model ${modelName}] Temporary unavailability. Proceeding to fallback/retry...`);
          }
        }

        if (responseText) {
          const parsed = JSON.parse(responseText || '{}');

          briefingResult = {
            icao: cleanIcao,
            airportName: airportInfo?.name || `${cleanIcao} Airport`,
            generatedAtUtc: new Date().toISOString(),
            weather: {
              rawMetar: metar.rawText,
              rawTaf: tafRaw,
              tafDecodedSummary: parsed.weather?.tafDecodedSummary || decodeTafSummary(tafRaw),
              plainEnglishSummary: parsed.weather?.plainEnglishSummary || 'Standard meteorological conditions.',
              flightCategory: (parsed.weather?.flightCategory as any) || metar.flightCategory,
              windInfo: parsed.weather?.windInfo || 'Winds normal',
              visibilityInfo: parsed.weather?.visibilityInfo || 'Visibility 10+ SM',
              cloudInfo: parsed.weather?.cloudInfo || metar.clouds || 'Clear skies',
              tempDewInfo: parsed.weather?.tempDewInfo || `${metar.tempC ?? 20}°C`,
            },
            criticalAlerts: (parsed.criticalAlerts || []).map((c: any, i: number) => ({
              ...c,
              isFir: flaggedNotams.find((fn) => fn.id === c.id)?.isFir,
            })),
            warnings: (parsed.warnings || []).map((w: any) => ({
              ...w,
              isFir: flaggedNotams.find((fn) => fn.id === w.id)?.isFir,
            })),
            infoItems: (parsed.infoItems || []).map((inf: any) => ({
              ...inf,
              isFir: flaggedNotams.find((fn) => fn.id === inf.id)?.isFir,
            })),
            allNotamsLedger: flaggedNotams,
            bucketCounts,
            picTakeaway: parsed.picTakeaway || 'Review all critical runway closures before engine start.',
            totalNotamsIngested: totalNotams,
            criticalCount,
            warningCount,
            deterministicRulesTriggered: criticalCount + warningCount,
          };
        } else {
          console.log(`[Project VAYU] Gemini LLM unavailable. Engaging deterministic safety engine for ${cleanIcao}.`);
          briefingResult = buildFallbackBriefing(cleanIcao, airportInfo?.name, metar, tafRaw, flaggedNotams);
        }
      } catch (aiError: any) {
        console.log('[Project VAYU] Soft fallback to deterministic safety engine:', aiError?.message || aiError);
        briefingResult = buildFallbackBriefing(cleanIcao, airportInfo?.name, metar, tafRaw, flaggedNotams);
      }
    } else {
      briefingResult = buildFallbackBriefing(cleanIcao, airportInfo?.name, metar, tafRaw, flaggedNotams);
    }

    return res.json(briefingResult);
  } catch (error) {
    console.error('Error generating briefing:', error);
    return res.status(500).json({ error: 'Failed to process pre-flight briefing.' });
  }
});

// Helper for deterministic fallback briefing structure
function buildFallbackBriefing(
  icao: string,
  airportName: string | undefined,
  metar: MetarData,
  tafRaw: string,
  flaggedNotams: ReturnType<typeof runDeterministicSafetyEngine>
): BriefingSummary {
  const criticals = flaggedNotams.filter((n) => n.severity === 'CRITICAL');
  const warnings = flaggedNotams.filter((n) => n.severity === 'WARNING');
  const infos = flaggedNotams.filter((n) => n.severity === 'INFO');

  const bucketCounts = {
    RUNWAYS_TFRS: flaggedNotams.filter((n) => n.category === 'RUNWAYS_TFRS').length,
    PROCEDURES_NAVAIDS: flaggedNotams.filter((n) => n.category === 'PROCEDURES_NAVAIDS').length,
    TAXIWAYS_APRON: flaggedNotams.filter((n) => n.category === 'TAXIWAYS_APRON').length,
    OBSTACLES_LIGHTING: flaggedNotams.filter((n) => n.category === 'OBSTACLES_LIGHTING').length,
    FIR_ENROUTE: flaggedNotams.filter((n) => n.category === 'FIR_ENROUTE').length,
    GENERAL: flaggedNotams.filter((n) => n.category === 'GENERAL').length,
  };

  return {
    icao,
    airportName: airportName || `${icao} Airport`,
    generatedAtUtc: new Date().toISOString(),
    weather: {
      rawMetar: metar.rawText,
      rawTaf: tafRaw,
      tafDecodedSummary: decodeTafSummary(tafRaw),
      plainEnglishSummary: `METAR for ${icao}: ${metar.rawText}. Conditions rated ${metar.flightCategory}.`,
      flightCategory: metar.flightCategory,
      windInfo: metar.windSpeedKts ? `${metar.windDirDeg}° at ${metar.windSpeedKts} kts` : 'Winds variable',
      visibilityInfo: metar.visibilitySm ? `${metar.visibilitySm} SM` : '10 SM',
      cloudInfo: metar.clouds || 'Clear skies',
      tempDewInfo: metar.tempC !== undefined ? `${metar.tempC}°C / ${metar.dewpointC}°C` : 'N/A',
    },
    criticalAlerts: criticals.map((c) => ({
      id: c.id,
      title: `CRITICAL SAFETY ALERT: ${c.category.replace('_', ' ')}`,
      plainEnglish: `Deterministic rule matched keywords [${c.matchedKeywords.join(', ')}]. Immediate attention required for ${c.category.toLowerCase().replace('_', ' ')} operational status.`,
      rawSnippet: c.rawText,
      category: c.category,
      actionRequired: 'Verify runway/airspace status with ATC prior to taxi/departure.',
      effectiveWindow: c.effectiveWindow,
      isFir: c.isFir,
    })),
    warnings: warnings.map((w) => ({
      id: w.id,
      title: `OPERATIONAL ADVISORY: ${w.category.replace('_', ' ')}`,
      plainEnglish: `Outage or hazard identified [${w.matchedKeywords.join(', ')}]. Check instrument approach minimums and taxipath restrictions.`,
      rawSnippet: w.rawText,
      category: w.category,
      effectiveWindow: w.effectiveWindow,
      isFir: w.isFir,
    })),
    infoItems: infos.map((i) => ({
      id: i.id,
      title: `GENERAL NOTICE`,
      plainEnglish: `Standard operational info: ${i.rawText}`,
      rawSnippet: i.rawText,
      isFir: i.isFir,
    })),
    allNotamsLedger: flaggedNotams,
    bucketCounts,
    picTakeaway: criticals.length > 0 
      ? `ATTENTION PIC: ${criticals.length} critical safety alert(s) active at ${icao}. Confirm runway closures and airspace limits.`
      : `Normal operations at ${icao}. Maintain standard pre-flight vigilance.`,
    totalNotamsIngested: flaggedNotams.length,
    criticalCount: criticals.length,
    warningCount: warnings.length,
    deterministicRulesTriggered: criticals.length + warnings.length,
  };
}

// Route Briefing API
app.post('/api/route-briefing', async (req, res) => {
  try {
    // Paywall Middleware Check
    const usageCheck = await checkBriefingUsageMiddleware(req);
    if (!usageCheck.allowed && usageCheck.errorPayload) {
      return res.status(402).json(usageCheck.errorPayload);
    }

    const { origin, destination, waypoints = [] } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and Destination airport identifiers are required.' });
    }

    const normOrigin = normalizeAirportCode(origin);
    const normDest = normalizeAirportCode(destination);

    if (!normOrigin || !normDest) {
      return res.status(400).json({ error: 'Invalid origin or destination airport identifier format.' });
    }

    const normWaypoints: string[] = [];
    if (Array.isArray(waypoints)) {
      for (const wp of waypoints) {
        const n = normalizeAirportCode(wp);
        if (n) normWaypoints.push(n);
      }
    }

    const routeCodes = [normOrigin, ...normWaypoints, normDest];

    // Fetch individual briefings
    const briefingPromises = routeCodes.map(async (code) => {
      const metar = await fetchLiveMetar(code);
      const notams = await fetchLiveNotams(code);
      const flagged = runDeterministicSafetyEngine(notams);
      return buildFallbackBriefing(code, lookupAirport(code)?.name, metar, flagged);
    });

    const briefings = await Promise.all(briefingPromises);
    const originBriefing = briefings[0];
    const destBriefing = briefings[briefings.length - 1];
    const waypointsBriefings = briefings.slice(1, briefings.length - 1);

    const totalCriticals = briefings.reduce((sum, b) => sum + b.criticalCount, 0);
    const totalWarnings = briefings.reduce((sum, b) => sum + b.warningCount, 0);

    return res.json({
      origin: originBriefing,
      destination: destBriefing,
      alternatesAndWaypoints: waypointsBriefings,
      routeSummaryText: `Route Corridor Briefing (${normOrigin} → ${normDest}): Ingested ${briefings.reduce((s, b) => s + b.totalNotamsIngested, 0)} total NOTAMs. Found ${totalCriticals} CRITICAL alerts and ${totalWarnings} warnings across route segment.`,
    });
  } catch (err) {
    console.error('Route briefing error:', err);
    return res.status(500).json({ error: 'Failed to process route briefing.' });
  }
});

// Audio TTS Endpoint for Pre-Flight Briefing Voice Synthesis
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text required for speech synthesis.' });
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ parts: [{ text: `Aviation pre-flight briefing: ${text.slice(0, 500)}` }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return res.json({ audioBase64: base64Audio, mimeType: 'audio/pcm;rate=24000' });
        }
      } catch (ttsErr) {
        console.warn('Gemini TTS failed, returning text for Web Speech API fallback:', ttsErr);
      }
    }

    return res.json({ fallbackText: text });
  } catch (err) {
    return res.status(500).json({ error: 'TTS processing failed.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Project VAYU] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
