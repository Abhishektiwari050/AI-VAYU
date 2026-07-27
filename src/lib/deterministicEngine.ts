import { FlaggedNotam, NotamBucket, RawNotam, SeverityLevel } from '../types';
import { parseIcaoNotam, buildDeterministicSummary } from './notamParser';
import { evaluateTemporalStatus } from './temporalCheck';

/**
 * Deterministic Safety Rule Engine (Non-LLM)
 * Hardcoded regex scanner to guarantee critical aviation safety items are
 * NEVER missed or hallucinated away.
 *
 * Re-architected into 5 distinct operational buckets:
 * 1. 🔴 RUNWAYS & TFRs (RUNWAYS_TFRS)
 * 2. 🔵 PROCEDURES & NAVAIDS (PROCEDURES_NAVAIDS)
 * 3. 🟡 TAXIWAYS & APRON (TAXIWAYS_APRON)
 * 4. ⚪ OBSTACLES & LIGHTING (OBSTACLES_LIGHTING)
 * 5. 🟣 FIR & EN-ROUTE AIRSPACE (FIR_ENROUTE)
 */

// 1. RUNWAYS & TFRs (Level 1 - Critical Safety / Operational Boundaries)
const RUNWAYS_TFRS_PATTERNS = [
  /\b(CLSD|CLOSED|CLS)\b/i,
  /\b(TFR|TEMPORARY\s+FLIGHT\s+RESTRICTION)\b/i,
  /\bPROHIBITED\b/i,
  /\bRESTRICTED\s+AREA\b/i,
  /\bVIP\s+MOVEMENT\b|\bVIP\s+AIRSPACE\b/i,
  /\bSKIDDING\s+HAZARD\b|\bWATER\s+LOGGING\b/i,
  /\b(POOR|NIL)\s+BRAKING\b|\bBRAKING\s+ACTION\s+(POOR|NIL)\b/i,
  /\bAUTOBRAKE\b|\bAUTOBRAKE\s+UNAVAIL\b/i,
  /\b(RWY|RUNWAY)\b.*\b(CLOSED|CLSD|CLS|MAINT|WORK)\b/i,
  /\b(CLOSED|CLSD|CLS)\b.*\b(RWY|RUNWAY)\b/i,
  /\bAD\s+CLSD\b|\bAIRPORT\s+CLOSED\b/i,
  /\bEMERGENCY\s+ONLY\b/i,
];

// 2. PROCEDURES & NAVAIDS
const PROCEDURES_NAVAIDS_PATTERNS = [
  /\bILS\b.*\b(U\/S|OTS|UNSERVICEABLE|DEGRADED)\b/i,
  /\bGLIDE\s+PATH\b|\bGLIDESLOPE\b|\bGP\b/i,
  /\bVOR\b|\bDME\b|\bNDB\b/i,
  /\bIAP\b|\bINSTRUMENT\s+APPROACH\b|\bAPPROACH\b/i,
  /\bSID\b|\bSTAR\b|\bPROCEDURE\b/i,
  /\bMISSED\s+APCH\b|\bMISSED\s+APPROACH\b/i,
  /\bLOC\b|\bLOCALIZER\b/i,
  /\bPAPI\b|\bVASI\b/i,
  /\bNAV\b/i,
];

// 3. TAXIWAYS & APRON
const TAXIWAYS_APRON_PATTERNS = [
  /\bTWY\b|\bTAXIWAY\b/i,
  /\bAPRON\b|\bRAMP\b|\bGROUND\b/i,
  /\bWIP\b|\bWORK\s+IN\s+PROGRESS\b/i,
  /\bPUSHBACK\b|\bSTAND\b/i,
];

// 4. OBSTACLES & LIGHTING
const OBSTACLES_LIGHTING_PATTERNS = [
  /\bCRANE\b|\bCRANE\s+ERECTED\b/i,
  /\bOBST\b|\bOBSTACLE\b|\bTOWER\b|\bRIG\b|\bMAST\b/i,
  /\bLGT\b|\bLIGHTING\b|\bTOWER\s+LIGHT\b|\bLGT\s+OUT\b/i,
  /\bBIRD\b|\bBIRD\s+ACTIVITY\b|\bWILDLIFE\b|\bDOG\s+MENACE\b/i,
  /\bLASER\b|\bLASER\s+BEAM\b|\bHAZARD\b|\bKITE\b/i,
];

// 5. FIR & EN-ROUTE AIRSPACE
const FIR_ENROUTE_PATTERNS = [
  /\bGPS\s+UNRELIABLE\b|\bGPS\s+JAMMING\b|\bJAMMING\b/i,
  /\bDANGER\s+AREA\b|\bVOLCANIC\b|\bSIGMET\b/i,
  /\bFIR\b|\bEN-ROUTE\b|\bENROUTE\b/i,
  /\bMILITARY\s+EXERCISE\b|\bGUNNERY\b|\bARTCC\b/i,
];

/**
 * Temporal Active Window Parser
 * Extracts WEF / TIL or B) / C) timestamp codes and evaluates status.
 */
export function parseTemporalWindow(
  rawText: string,
  startIso?: string,
  endIso?: string
): {
  status: 'ACTIVE_NOW' | 'SCHEDULED_FUTURE' | 'EXPIRED' | 'PERMANENT';
  windowText: string;
} {
  const text = rawText.toUpperCase();

  // Check for PERM / PERMANENT
  if (text.includes('PERM') || text.includes('PERMANENT')) {
    return {
      status: 'PERMANENT',
      windowText: 'PERMANENT EFFECTIVE (PERM)',
    };
  }

  // Attempt regex extraction for WEF / TIL
  // Example: WEF 2607221200-2607291800 or B) 2607231000 C) 2607231400
  let startDate: Date | null = startIso ? new Date(startIso) : null;
  let endDate: Date | null = endIso ? new Date(endIso) : null;

  if (!startDate) {
    const wefMatch = text.match(/\b(WEF|B\))\s*(\d{10})/i);
    if (wefMatch) {
      startDate = parseAviationTimestamp(wefMatch[2]);
    }
  }

  if (!endDate) {
    const tilMatch = text.match(/\b(TIL|C\))\s*(\d{10}|EST|PERM)/i);
    if (tilMatch && tilMatch[2] !== 'PERM') {
      endDate = parseAviationTimestamp(tilMatch[2]);
    } else if (text.match(/WEF\s*\d{10}-(\d{10})/i)) {
      const match = text.match(/WEF\s*\d{10}-(\d{10})/i);
      if (match) endDate = parseAviationTimestamp(match[1]);
    }
  }

  const now = new Date();

  if (startDate && endDate) {
    const formatS = formatShortUtc(startDate);
    const formatE = formatShortUtc(endDate);

    if (now >= startDate && now <= endDate) {
      return {
        status: 'ACTIVE_NOW',
        windowText: `ACTIVE NOW (WEF ${formatS} → TIL ${formatE})`,
      };
    } else if (now < startDate) {
      return {
        status: 'SCHEDULED_FUTURE',
        windowText: `SCHEDULED (WEF ${formatS} → TIL ${formatE})`,
      };
    } else {
      return {
        status: 'EXPIRED',
        windowText: `EXPIRED (${formatS} → ${formatE})`,
      };
    }
  } else if (startDate) {
    const formatS = formatShortUtc(startDate);
    if (now >= startDate) {
      return { status: 'ACTIVE_NOW', windowText: `ACTIVE NOW (WEF ${formatS})` };
    } else {
      return { status: 'SCHEDULED_FUTURE', windowText: `SCHEDULED (WEF ${formatS})` };
    }
  }

  return {
    status: 'ACTIVE_NOW',
    windowText: 'ACTIVE / EFFECTIVE IMMEDIATELY',
  };
}

function parseAviationTimestamp(code: string): Date | null {
  // Format: YYMMDDHHMM (e.g., 2607221200 -> 2026-07-22 12:00 UTC)
  if (!code || code.length < 10) return null;
  const yy = parseInt(code.substring(0, 2), 10) + 2000;
  const mm = parseInt(code.substring(2, 4), 10) - 1;
  const dd = parseInt(code.substring(4, 6), 10);
  const hh = parseInt(code.substring(6, 8), 10);
  const min = parseInt(code.substring(8, 10), 10);

  const d = new Date(Date.UTC(yy, mm, dd, hh, min));
  return isNaN(d.getTime()) ? null : d;
}

function formatShortUtc(d: Date): string {
  const yy = String(d.getUTCFullYear()).slice(-2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd} ${hh}:${min}Z`;
}

export function runDeterministicSafetyEngine(rawNotams: RawNotam[]): FlaggedNotam[] {
  return rawNotams.map((notam) => {
    const text = notam.rawText;

    // 1. Strict ICAO NOTAM & Q-Code Parser
    const parsedIcao = parseIcaoNotam(text, notam.icao);

    const matchedKeywords: string[] = [];
    let category: NotamBucket = parsedIcao.qCategory || 'GENERAL';
    let severity: SeverityLevel = parsedIcao.qSeverity || 'INFO';

    // 2. Keyword fallback scanner if Q-code is absent
    if (category === 'GENERAL') {
      let isRwyMatch = false;
      for (const pat of RUNWAYS_TFRS_PATTERNS) {
        const m = text.match(pat);
        if (m) {
          matchedKeywords.push(m[0]);
          isRwyMatch = true;
        }
      }
      if (isRwyMatch) {
        category = 'RUNWAYS_TFRS';
      }

      if (category === 'GENERAL') {
        let isProcMatch = false;
        for (const pat of PROCEDURES_NAVAIDS_PATTERNS) {
          const m = text.match(pat);
          if (m) {
            matchedKeywords.push(m[0]);
            isProcMatch = true;
          }
        }
        if (isProcMatch) {
          category = 'PROCEDURES_NAVAIDS';
        }
      }

      if (category === 'GENERAL') {
        let isTwyMatch = false;
        for (const pat of TAXIWAYS_APRON_PATTERNS) {
          const m = text.match(pat);
          if (m) {
            matchedKeywords.push(m[0]);
            isTwyMatch = true;
          }
        }
        if (isTwyMatch) {
          category = 'TAXIWAYS_APRON';
        }
      }

      if (category === 'GENERAL') {
        let isObstMatch = false;
        for (const pat of OBSTACLES_LIGHTING_PATTERNS) {
          const m = text.match(pat);
          if (m) {
            matchedKeywords.push(m[0]);
            isObstMatch = true;
          }
        }
        if (isObstMatch) {
          category = 'OBSTACLES_LIGHTING';
        }
      }
    }

    // 3. FIR / En-route check
    let isFirMatch = false;
    for (const pat of FIR_ENROUTE_PATTERNS) {
      const m = text.match(pat);
      if (m) {
        matchedKeywords.push(m[0]);
        isFirMatch = true;
      }
    }
    const isFirNotam = notam.isFir || (notam.icao && notam.icao.endsWith('FIR')) || notam.icao === notam.firIcao;
    if (category === 'GENERAL' && (isFirNotam || isFirMatch)) {
      category = 'FIR_ENROUTE';
    }

    // 4. Assign Final Severity
    if (category === 'RUNWAYS_TFRS' || category === 'FIR_ENROUTE') {
      severity = 'CRITICAL';
    } else if (category === 'PROCEDURES_NAVAIDS' || category === 'TAXIWAYS_APRON' || category === 'OBSTACLES_LIGHTING') {
      severity = 'WARNING';
    }

    // 5. Evaluate Temporal Active Window
    const tempInfo = evaluateTemporalStatus(
      notam.effectiveStart || parsedIcao.effectiveStartIso || parsedIcao.effectiveStartRaw,
      notam.effectiveEnd || parsedIcao.effectiveEndIso || parsedIcao.effectiveEndRaw,
      text
    );

    const summaryText = buildDeterministicSummary(parsedIcao, text);
    const titleText = parsedIcao.notamId
      ? `${parsedIcao.notamId} — ${parsedIcao.qSubjectDecoded || category.replace('_', ' ')} ${parsedIcao.qConditionDecoded || ''}`.trim()
      : `${notam.id} — ${category.replace('_', ' ')}`;

    return {
      id: notam.id,
      rawText: notam.rawText,
      severity,
      matchedKeywords: Array.from(new Set(matchedKeywords)),
      category,
      effectiveStart: notam.effectiveStart || parsedIcao.effectiveStartIso,
      effectiveEnd: notam.effectiveEnd || parsedIcao.effectiveEndIso,
      effectiveWindow: tempInfo.relativeTimeText,
      effectiveStatus: tempInfo.status,
      isFir: isFirNotam,
      firIcao: notam.firIcao,
      parsedIcao,
      plainEnglishSummary: summaryText,
      title: titleText,
    };
  });
}

