// Vercel Serverless Function — /api/briefing
// Replaces the Express server.ts route so this actually runs on Vercel (free tier)
// Data sources: NOAA aviationweather.gov (100% free, no key needed) + Gemini AI (optional)

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Types ──────────────────────────────────────────────────────────────────────
type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | 'UNKNOWN';
type NotamBucket = 'RUNWAYS_TFRS' | 'PROCEDURES_NAVAIDS' | 'TAXIWAYS_APRON' | 'OBSTACLES_LIGHTING' | 'FIR_ENROUTE' | 'GENERAL';
type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO';

interface RawNotam { id: string; icao: string; rawText: string; effectiveStart?: string; effectiveEnd?: string; type?: string; isFir?: boolean; }
interface FlaggedNotam { id: string; rawText: string; severity: SeverityLevel; matchedKeywords: string[]; category: NotamBucket; effectiveWindow?: string; effectiveStatus?: string; isFir?: boolean; }
interface MetarData { icao: string; rawText: string; flightCategory: FlightCategory; windSpeedKts?: number; windDirDeg?: number; visibilitySm?: number; tempC?: number; dewpointC?: number; altimeterInHg?: number; clouds?: string; }

// ── CORS headers for Vercel ────────────────────────────────────────────────────
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-vayu-tier');
}

// ── Airport lookup (key airports) ─────────────────────────────────────────────
const AIRPORTS: Record<string, string> = {
  VIDP: 'Indira Gandhi International', VABB: 'Chhatrapati Shivaji International',
  VOBL: 'Kempegowda International', VOMM: 'Chennai International',
  VOHS: 'Rajiv Gandhi International', VECC: 'Netaji Subhash Chandra Bose',
  VDGO: 'Manohar International (Goa)', VAID: 'Devi Ahilya Bai Holkar',
  KJFK: 'John F. Kennedy International', KLAX: 'Los Angeles International',
  KORD: "Chicago O'Hare International", KDFW: 'Dallas/Fort Worth International',
  EGLL: 'London Heathrow', OMDB: 'Dubai International', WSSS: 'Singapore Changi',
};

function lookupAirportName(icao: string): string {
  return AIRPORTS[icao.toUpperCase()] || `${icao.toUpperCase()} Airport`;
}

function normalizeIcao(raw: string): string | null {
  const s = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length < 3 || s.length > 5) return null;
  return s;
}

// ── Free NOAA METAR fetch ──────────────────────────────────────────────────────
async function fetchLiveMetar(icao: string): Promise<{ metar: MetarData; isLive: boolean }> {
  const code = icao.toUpperCase();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://aviationweather.gov/api/data/metar?ids=${code}&format=raw`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VAYU-EFB/1.0 (aviation-briefing; contact@vayu.aero)', Accept: 'text/plain,*/*' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text.length > 5) {
        let fc: FlightCategory = 'VFR';
        if (/\bOVC00[0-4]\b|\b1\/[248]SM\b/i.test(text)) fc = 'LIFR';
        else if (/\b(OVC|BKN)0[0-9]\b|\b[12]SM\b/i.test(text)) fc = 'IFR';
        else if (/\b(OVC|BKN)0[1-3][0-9]\b|\b[3-5]SM\b/i.test(text)) fc = 'MVFR';

        // Parse winds
        const windMatch = text.match(/(\d{3})(\d{2,3})(?:G(\d{2,3}))?KT/);
        const visMatch = text.match(/\b(\d+(?:\/\d+)?)\s*SM\b/);
        const tempMatch = text.match(/\b(M?\d{2})\/(M?\d{2})\b/);
        const altMatch = text.match(/A(\d{4})\b/);
        const cloudMatch = text.match(/(FEW|SCT|BKN|OVC)\d{3}/g);

        return {
          metar: {
            icao: code,
            rawText: text,
            flightCategory: fc,
            windDirDeg: windMatch ? parseInt(windMatch[1]) : undefined,
            windSpeedKts: windMatch ? parseInt(windMatch[2]) : undefined,
            visibilitySm: visMatch ? parseFloat(visMatch[1]) : undefined,
            tempC: tempMatch ? parseInt(tempMatch[1].replace('M', '-')) : undefined,
            dewpointC: tempMatch ? parseInt(tempMatch[2].replace('M', '-')) : undefined,
            altimeterInHg: altMatch ? parseInt(altMatch[1]) / 100 : undefined,
            clouds: cloudMatch ? cloudMatch.join(', ') : undefined,
          },
          isLive: true,
        };
      }
    }
  } catch {}
  // Synthetic fallback (clearly marked)
  return {
    metar: {
      icao: code,
      rawText: `[SYNTHETIC] ${code} METAR unavailable — no live data returned from aviationweather.gov`,
      flightCategory: 'UNKNOWN',
    },
    isLive: false,
  };
}

// ── Free NOAA TAF fetch ────────────────────────────────────────────────────────
async function fetchLiveTaf(icao: string): Promise<{ taf: string; isLive: boolean }> {
  const code = icao.toUpperCase();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://aviationweather.gov/api/data/taf?ids=${code}&format=raw`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VAYU-EFB/1.0', Accept: 'text/plain,*/*' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text.length > 5) return { taf: text, isLive: true };
    }
  } catch {}
  return { taf: `[SYNTHETIC] TAF not available for ${icao} from free data sources.`, isLive: false };
}

// ── Free NOAA NOTAM fetch (best for US; partial international) ────────────────
async function fetchLiveNotams(icao: string): Promise<{ notams: RawNotam[]; isLive: boolean }> {
  const code = icao.toUpperCase();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://aviationweather.gov/api/data/notam?ids=${code}&format=json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VAYU-EFB/1.0', Accept: 'application/json,*/*' },
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          notams: data.map((item: any, idx: number) => ({
            id: item.notamId || `LIVE-${code}-${idx}`,
            icao: item.icao || code,
            rawText: item.icaoMessage || item.raw || JSON.stringify(item),
            effectiveStart: item.effectiveStart,
            effectiveEnd: item.effectiveEnd,
            type: item.type,
            isFir: false,
          })),
          isLive: true,
        };
      }
    }
  } catch {}
  // Return clearly synthetic NOTAMs for non-US airports
  const synthNotams: RawNotam[] = [
    { id: `SYNTH-${code}-1`, icao: code, rawText: `[SYNTHETIC] A) ${code} B) SYNTHETIC NOTAM — Live NOTAM feed unavailable for this airport. Consult official sources.`, type: 'GENERAL' },
  ];
  return { notams: synthNotams, isLive: false };
}

// ── Deterministic Safety Engine (regex keyword scanner) ───────────────────────
const CRITICAL_PATTERNS: { keywords: string[]; category: NotamBucket }[] = [
  { keywords: ['RWY', 'CLSD', 'CLOSED'], category: 'RUNWAYS_TFRS' },
  { keywords: ['RWY', 'RESTRICTED'], category: 'RUNWAYS_TFRS' },
  { keywords: ['TFR', 'PROHIBITED'], category: 'RUNWAYS_TFRS' },
  { keywords: ['ILS', 'U/S', 'UNSERVICEABLE'], category: 'PROCEDURES_NAVAIDS' },
  { keywords: ['ATIS', 'U/S', 'UNSERVICEABLE'], category: 'PROCEDURES_NAVAIDS' },
  { keywords: ['VOR', 'U/S', 'UNSERVICEABLE'], category: 'PROCEDURES_NAVAIDS' },
  { keywords: ['PAPI', 'U/S', 'INOP'], category: 'OBSTACLES_LIGHTING' },
  { keywords: ['HAZARD', 'CRANE', 'OBSTACLE', 'OBST'], category: 'OBSTACLES_LIGHTING' },
];
const WARNING_PATTERNS: { keywords: string[]; category: NotamBucket }[] = [
  { keywords: ['TWY', 'CLSD'], category: 'TAXIWAYS_APRON' },
  { keywords: ['APRON', 'CLSD', 'CLOSED'], category: 'TAXIWAYS_APRON' },
  { keywords: ['DME', 'U/S'], category: 'PROCEDURES_NAVAIDS' },
  { keywords: ['LIGHTING', 'U/S', 'INOP'], category: 'OBSTACLES_LIGHTING' },
  { keywords: ['SIGMET', 'AIRMET'], category: 'FIR_ENROUTE' },
];

function runSafetyEngine(notams: RawNotam[]): FlaggedNotam[] {
  return notams.map((n, idx) => {
    const upper = n.rawText.toUpperCase();
    for (const pat of CRITICAL_PATTERNS) {
      if (pat.keywords.every((kw) => upper.includes(kw))) {
        return { id: n.id || `F-${idx}`, rawText: n.rawText, severity: 'CRITICAL', matchedKeywords: pat.keywords, category: pat.category, isFir: n.isFir };
      }
    }
    for (const pat of WARNING_PATTERNS) {
      if (pat.keywords.every((kw) => upper.includes(kw))) {
        return { id: n.id || `F-${idx}`, rawText: n.rawText, severity: 'WARNING', matchedKeywords: pat.keywords, category: pat.category, isFir: n.isFir };
      }
    }
    const cat: NotamBucket =
      upper.includes('RWY') ? 'RUNWAYS_TFRS' :
      upper.includes('TWY') ? 'TAXIWAYS_APRON' :
      upper.includes('ILS') || upper.includes('VOR') || upper.includes('NDB') ? 'PROCEDURES_NAVAIDS' :
      upper.includes('OBST') || upper.includes('CRANE') || upper.includes('LIGHT') ? 'OBSTACLES_LIGHTING' :
      upper.includes('FIR') || upper.includes('SIGMET') ? 'FIR_ENROUTE' : 'GENERAL';
    return { id: n.id || `F-${idx}`, rawText: n.rawText, severity: 'INFO', matchedKeywords: [], category: cat, isFir: n.isFir };
  });
}

// ── Build briefing response ───────────────────────────────────────────────────
function buildBriefingResponse(
  icao: string,
  metar: MetarData,
  tafRaw: string,
  flagged: FlaggedNotam[],
  metarLive: boolean,
  tafLive: boolean,
  notamLive: boolean,
  geminiSummary?: any
) {
  const criticals = flagged.filter((n) => n.severity === 'CRITICAL');
  const warnings = flagged.filter((n) => n.severity === 'WARNING');
  const infos = flagged.filter((n) => n.severity === 'INFO');

  const bucketCounts = {
    RUNWAYS_TFRS: flagged.filter((n) => n.category === 'RUNWAYS_TFRS').length,
    PROCEDURES_NAVAIDS: flagged.filter((n) => n.category === 'PROCEDURES_NAVAIDS').length,
    TAXIWAYS_APRON: flagged.filter((n) => n.category === 'TAXIWAYS_APRON').length,
    OBSTACLES_LIGHTING: flagged.filter((n) => n.category === 'OBSTACLES_LIGHTING').length,
    FIR_ENROUTE: flagged.filter((n) => n.category === 'FIR_ENROUTE').length,
    GENERAL: flagged.filter((n) => n.category === 'GENERAL').length,
  };

  // Data quality flags — passed to frontend to show honest banners
  const dataSource = {
    metar: metarLive ? 'LIVE (NOAA)' : 'SYNTHETIC',
    taf: tafLive ? 'LIVE (NOAA)' : 'SYNTHETIC',
    notams: notamLive ? 'LIVE (FAA)' : 'SYNTHETIC',
    aiSummary: geminiSummary ? 'GEMINI AI' : 'DETERMINISTIC ENGINE',
  };

  const weather = geminiSummary?.weather || {};

  return {
    icao,
    airportName: lookupAirportName(icao),
    generatedAtUtc: new Date().toISOString(),
    dataSource, // NEW: honest data provenance flag
    weather: {
      rawMetar: metar.rawText,
      rawTaf: tafRaw,
      tafDecodedSummary: weather.tafDecodedSummary || tafRaw.split(/\b(?=FM|TEMPO|BECMG|PROB)/).slice(0, 3).join('\n• '),
      plainEnglishSummary: weather.plainEnglishSummary || `${icao} METAR: ${metar.rawText}. Flight category: ${metar.flightCategory}.`,
      flightCategory: (weather.flightCategory as any) || metar.flightCategory,
      windInfo: weather.windInfo || (metar.windSpeedKts ? `${metar.windDirDeg}° at ${metar.windSpeedKts} kts` : 'Wind data unavailable'),
      visibilityInfo: weather.visibilityInfo || (metar.visibilitySm ? `${metar.visibilitySm} SM` : 'Visibility data unavailable'),
      cloudInfo: weather.cloudInfo || metar.clouds || 'Cloud data unavailable',
      tempDewInfo: weather.tempDewInfo || (metar.tempC !== undefined ? `${metar.tempC}°C / ${metar.dewpointC}°C` : 'Temp data unavailable'),
    },
    criticalAlerts: (geminiSummary?.criticalAlerts?.length ? geminiSummary.criticalAlerts : criticals.map((c) => ({
      id: c.id,
      title: `CRITICAL: ${c.category.replace(/_/g, ' ')}`,
      plainEnglish: `Keyword match [${c.matchedKeywords.join(', ')}] detected. Verify with ATC.`,
      rawSnippet: c.rawText,
      category: c.category,
      actionRequired: 'Confirm operational status with ATC before taxi.',
      effectiveWindow: c.effectiveWindow,
      isFir: c.isFir,
    }))),
    warnings: (geminiSummary?.warnings?.length ? geminiSummary.warnings : warnings.map((w) => ({
      id: w.id,
      title: `ADVISORY: ${w.category.replace(/_/g, ' ')}`,
      plainEnglish: `Keyword match [${w.matchedKeywords.join(', ')}]. Review before departure.`,
      rawSnippet: w.rawText,
      category: w.category,
      effectiveWindow: w.effectiveWindow,
      isFir: w.isFir,
    }))),
    infoItems: (geminiSummary?.infoItems?.length ? geminiSummary.infoItems : infos.map((i) => ({
      id: i.id,
      title: 'NOTICE',
      plainEnglish: i.rawText.slice(0, 120),
      rawSnippet: i.rawText,
      isFir: i.isFir,
    }))),
    allNotamsLedger: flagged,
    bucketCounts,
    picTakeaway: geminiSummary?.picTakeaway || (criticals.length > 0
      ? `ATTENTION PIC: ${criticals.length} critical restriction(s) detected at ${icao}. Verify all runway/airspace status with ATC.`
      : `Standard pre-flight conditions at ${icao}. Maintain vigilance and cross-check official sources.`),
    totalNotamsIngested: flagged.length,
    criticalCount: criticals.length,
    warningCount: warnings.length,
    deterministicRulesTriggered: criticals.length + warnings.length,
  };
}

// ── Gemini AI summary (optional — graceful skip if no key) ────────────────────
async function tryGeminiSummary(icao: string, metar: string, taf: string, flagged: FlaggedNotam[]): Promise<any | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `You are an aviation dispatcher for Project VAYU. Convert this raw aviation data into a plain-English pre-flight briefing JSON.
Airport: ${icao}
METAR: ${metar}
TAF: ${taf}
NOTAMs (${flagged.length} flagged): ${JSON.stringify(flagged.slice(0, 15), null, 0)}

Return ONLY valid JSON with this exact schema:
{"weather":{"plainEnglishSummary":"string","tafDecodedSummary":"string","flightCategory":"VFR|MVFR|IFR|LIFR|UNKNOWN","windInfo":"string","visibilityInfo":"string","cloudInfo":"string","tempDewInfo":"string"},"criticalAlerts":[{"id":"string","title":"string","plainEnglish":"string","rawSnippet":"string","category":"string","actionRequired":"string","effectiveWindow":"string"}],"warnings":[{"id":"string","title":"string","plainEnglish":"string","rawSnippet":"string","category":"string","effectiveWindow":"string"}],"infoItems":[{"id":"string","title":"string","plainEnglish":"string","rawSnippet":"string"}],"picTakeaway":"string"}`;

    const models = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
        }
      } catch {}
    }
  } catch {}
  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { icao } = req.body || {};
  if (!icao || typeof icao !== 'string') {
    return res.status(400).json({ error: 'Airport ICAO code is required.' });
  }

  const clean = normalizeIcao(icao);
  if (!clean) {
    return res.status(400).json({ error: 'Invalid airport code. Use a valid 3-5 character ICAO/IATA code.' });
  }

  try {
    // Fetch all data sources in parallel (all free, no key needed)
    const [metarResult, tafResult, notamResult] = await Promise.all([
      fetchLiveMetar(clean),
      fetchLiveTaf(clean),
      fetchLiveNotams(clean),
    ]);

    const flagged = runSafetyEngine(notamResult.notams);

    // Try Gemini AI summary (optional — works only if GEMINI_API_KEY env var is set)
    const geminiSummary = await tryGeminiSummary(clean, metarResult.metar.rawText, tafResult.taf, flagged);

    const briefing = buildBriefingResponse(
      clean,
      metarResult.metar,
      tafResult.taf,
      flagged,
      metarResult.isLive,
      tafResult.isLive,
      notamResult.isLive,
      geminiSummary,
    );

    return res.status(200).json(briefing);
  } catch (err: any) {
    console.error('[VAYU /api/briefing] Error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing. Please try again.' });
  }
}
