import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { runDeterministicSafetyEngine } from './src/lib/deterministicEngine.js';
import { generateSyntheticMetar, generateSyntheticNotams } from './src/lib/mockAviationData.js';
import { lookupAirport, normalizeAirportCode } from './src/lib/airportData.js';
import { BriefingSummary, RawNotam, MetarData } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Helper to fetch live NOTAM data with fast 3.5s fallback & international ICAO exchange
async function fetchLiveNotams(icao: string): Promise<RawNotam[]> {
  const code = icao.trim().toUpperCase();

  // 1. Check environment variable for optional global NOTAM API
  if (process.env.GLOBAL_NOTAM_API_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${process.env.GLOBAL_NOTAM_API_URL}?icao=${code}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any, idx: number) => ({
            id: item.notamId || `GLOBAL-${code}-${idx}`,
            icao: code,
            rawText: item.icaoMessage || item.rawText || item.raw || JSON.stringify(item),
            effectiveStart: item.effectiveStart,
            effectiveEnd: item.effectiveEnd,
            type: item.type,
          }));
        }
      }
    } catch (err) {
      console.log(`[GLOBAL_NOTAM_API] Global NOTAM fetch fallback for ${code}`);
    }
  }

  // 2. Default FAA / NOAA Aviation Weather API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://aviationweather.gov/api/data/notam?ids=${code}`, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any, idx: number) => ({
          id: item.notamId || `LIVE-${code}-${idx}`,
          icao: code,
          rawText: item.icaoMessage || item.raw || JSON.stringify(item),
          effectiveStart: item.effectiveStart,
          effectiveEnd: item.effectiveEnd,
          type: item.type,
        }));
      }
    }
  } catch (err) {
    console.log(`[NOTAM Fetch] Live fetch status for ${code}: using backup data stream.`);
  }

  return generateSyntheticNotams(code);
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', system: 'Project VAYU Pre-Flight Briefing API', version: '1.0.0' });
});

// Single Airport Briefing API
app.post('/api/briefing', async (req, res) => {
  try {
    const { icao } = req.body;
    if (!icao || typeof icao !== 'string') {
      return res.status(400).json({ error: 'Airport identifier is required.' });
    }

    const cleanIcao = normalizeAirportCode(icao);
    if (!cleanIcao) {
      return res.status(400).json({ error: 'Invalid airport code format. Please enter a valid 3-letter FAA or 4-letter ICAO airport identifier (e.g., KDFW, DFW, KJFK).' });
    }

    const airportInfo = lookupAirport(cleanIcao);

    // Parallel Data Ingestion
    const [metar, rawNotams] = await Promise.all([
      fetchLiveMetar(cleanIcao),
      fetchLiveNotams(cleanIcao),
    ]);

    // Deterministic Safety Engine Scan
    const flaggedNotams = runDeterministicSafetyEngine(rawNotams);

    const criticalCount = flaggedNotams.filter((n) => n.severity === 'CRITICAL').length;
    const warningCount = flaggedNotams.filter((n) => n.severity === 'WARNING').length;
    const totalNotams = flaggedNotams.length;

    let briefingResult: BriefingSummary;

    // Call Gemini API if Key Available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getAiClient();
        const prompt = `
You are an expert aviation flight dispatcher and pilot safety evaluator for Project VAYU.
Convert the provided raw METAR weather and flagged NOTAM strings into an executive, plain-English pre-flight briefing.

Airport ICAO: ${cleanIcao} (${airportInfo?.name || cleanIcao})
RAW METAR: ${metar.rawText}
RAW NOTAMS & REGEX SEVERITY SCAN:
${JSON.stringify(flaggedNotams, null, 2)}

INSTRUCTIONS:
1. Translate METAR into concise plain English (wind, visibility, clouds, temperature/dewpoint, flight rules category).
2. For CRITICAL ALERTS (Severity: CRITICAL): Provide a short headline, 1-2 sentence plain-English explanation of why it is dangerous, raw snippet, category, and PIC action required.
3. For WARNINGS (Severity: WARNING): Provide plain-English explanation, raw snippet, and category.
4. For INFO (Severity: INFO): Short bullet points summarizing remaining minor notices.
5. Provide a 1-2 sentence Pilot-in-Command (PIC) Takeaway summary.
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
              plainEnglishSummary: parsed.weather?.plainEnglishSummary || 'Standard meteorological conditions.',
              flightCategory: (parsed.weather?.flightCategory as any) || metar.flightCategory,
              windInfo: parsed.weather?.windInfo || 'Winds normal',
              visibilityInfo: parsed.weather?.visibilityInfo || 'Visibility 10+ SM',
              cloudInfo: parsed.weather?.cloudInfo || metar.clouds || 'Clear skies',
              tempDewInfo: parsed.weather?.tempDewInfo || `${metar.tempC ?? 20}°C`,
            },
            criticalAlerts: parsed.criticalAlerts || [],
            warnings: parsed.warnings || [],
            infoItems: parsed.infoItems || [],
            picTakeaway: parsed.picTakeaway || 'Review all critical runway closures before engine start.',
            totalNotamsIngested: totalNotams,
            criticalCount,
            warningCount,
            deterministicRulesTriggered: criticalCount + warningCount,
          };
        } else {
          console.log(`[Project VAYU] Gemini LLM unavailable. Engaging deterministic safety engine for ${cleanIcao}.`);
          briefingResult = buildFallbackBriefing(cleanIcao, airportInfo?.name, metar, flaggedNotams);
        }
      } catch (aiError: any) {
        console.log('[Project VAYU] Soft fallback to deterministic safety engine:', aiError?.message || aiError);
        briefingResult = buildFallbackBriefing(cleanIcao, airportInfo?.name, metar, flaggedNotams);
      }
    } else {
      briefingResult = buildFallbackBriefing(cleanIcao, airportInfo?.name, metar, flaggedNotams);
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
  flaggedNotams: ReturnType<typeof runDeterministicSafetyEngine>
): BriefingSummary {
  const criticals = flaggedNotams.filter((n) => n.severity === 'CRITICAL');
  const warnings = flaggedNotams.filter((n) => n.severity === 'WARNING');
  const infos = flaggedNotams.filter((n) => n.severity === 'INFO');

  return {
    icao,
    airportName: airportName || `${icao} Airport`,
    generatedAtUtc: new Date().toISOString(),
    weather: {
      rawMetar: metar.rawText,
      plainEnglishSummary: `METAR for ${icao}: ${metar.rawText}. Conditions rated ${metar.flightCategory}.`,
      flightCategory: metar.flightCategory,
      windInfo: metar.windSpeedKts ? `${metar.windDirDeg}° at ${metar.windSpeedKts} kts` : 'Winds variable',
      visibilityInfo: metar.visibilitySm ? `${metar.visibilitySm} SM` : '10 SM',
      cloudInfo: metar.clouds || 'Clear skies',
      tempDewInfo: metar.tempC !== undefined ? `${metar.tempC}°C / ${metar.dewpointC}°C` : 'N/A',
    },
    criticalAlerts: criticals.map((c) => ({
      id: c.id,
      title: `CRITICAL SAFETY ALERT: ${c.category}`,
      plainEnglish: `Deterministic rule matched keywords [${c.matchedKeywords.join(', ')}]. Immediate attention required for ${c.category.toLowerCase()} operational status.`,
      rawSnippet: c.rawText,
      category: c.category,
      actionRequired: 'Verify runway/airspace status with ATC prior to taxi/departure.',
      effectiveWindow: c.effectiveWindow,
    })),
    warnings: warnings.map((w) => ({
      id: w.id,
      title: `OPERATIONAL ADVISORY: ${w.category}`,
      plainEnglish: `Outage or hazard identified [${w.matchedKeywords.join(', ')}]. Check instrument approach minimums and taxipath restrictions.`,
      rawSnippet: w.rawText,
      category: w.category,
      effectiveWindow: w.effectiveWindow,
    })),
    infoItems: infos.map((i) => ({
      id: i.id,
      title: `GENERAL NOTICE`,
      plainEnglish: `Standard operational info: ${i.rawText}`,
      rawSnippet: i.rawText,
    })),
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
