import { FlaggedNotam, RawNotam, SeverityLevel } from '../types';

/**
 * Deterministic Safety Rule Engine (Non-LLM)
 * Hardcoded regex scanner to guarantee critical aviation safety items are
 * NEVER missed or hallucinated away.
 */

// Expanded Critical Regex Patterns (Level 1 - RED / Safety-Critical)
const CRITICAL_PATTERNS = [
  /\b(CLSD|CLOSED|CLS)\b/i,
  /\b(TFR|TEMPORARY\s+FLIGHT\s+RESTRICTION)\b/i,
  /\bPROHIBITED\b/i,
  /\bRESTRICTED\s+AREA\b/i,
  /\bTEMPORARY\s+RESTRICTED\s+AREA\b/i,
  /\bVIP\s+MOVEMENT\b/i,
  /\bVIP\s+AIRSPACE\b/i,
  /\bMONSOON\b/i,
  /\bWATER\s+LOGGING\b/i,
  /\bSKIDDING\s+HAZARD\b/i,
  /\bPOOR\s+BRAKING\b|\bNIL\s+BRAKING\b/i,
  /\bUNSERVICEABLE\b/i,
  /\bU\/S\b/i,
  /\bHAZARD\b/i,
  /\bNIL\b/i,
  /\bAUTOBRAKE\b/i,
  /\bOTS\b/i,
  /\bOUT\s+OF\s+SERVICE\b/i,
  /\bOUT\s+OF\s+SVC\b/i,
  /\b(RWY|RUNWAY)\b.*\b(CLOSED|CLSD|CLS)\b/i,
  /\b(CLOSED|CLSD|CLS)\b.*\b(RWY|RUNWAY)\b/i,
  /\bRUNWAY\s+INCURSION\b/i,
  /\bEMERGENCY\s+ONLY\b/i,
  /\bAIRSPACE\s+CLOSED\b/i,
  /\bAD\s+CLSD\b/i, // Aerodrome closed
  /\bAIRPORT\s+CLOSED\b/i,
  // Expanded FAR/Safety Critical Patterns
  /\b(BRAKING\s+ACTION|BA)\b.*\b(NIL|POOR)\b/i, // Braking Action NIL/POOR
  /\bAUTOBRAKE\s+UNAVAIL\b/i,
  /\b(IAP|INSTRUMENT\s+APPROACH)\b.*\b(CANCELLED|CNL|DELETED|UNAVAIL)\b/i, // Approach Cancellations
  /\bFDC\s+NOTAM\b/i, // Flight Data Center procedure updates
  /\bSURFACE\s+HAZARD\b/i,
  /\bACTIVE\s+SHOOTING\b|\bMILITARY\s+EXERCISE\b/i,
];

// Expanded Warning Regex Patterns (Level 2 - YELLOW)
const WARNING_PATTERNS = [
  /\bWIP\b/i, // Work in progress
  /\bWORK\s+IN\s+PROGRESS\b/i,
  /\bGRASS\s+CUTTING\b/i,
  /\bBIRD\s+ACTIVITY\b|\bMIGRATORY\s+BIRDS\b/i,
  /\bDOG\s+MENACE\b|\bSTRAY\s+ANIMALS\b/i,
  /\bLASER\s+BEAM\b|\bLASER\s+HAZARD\b/i,
  /\bCRANE\s+ERECTED\b|\bCRANE\b/i,
  /\bAERODROME\s+BEACON\s+OTS\b/i,
  /\bTWY\b.*\b(CLOSED|CLSD|RESTRICTED)\b/i,
  /\bTAXIWAY\b.*\b(CLOSED|CLSD|RESTRICTED)\b/i,
  /\bILS\b.*\b(U\/S|OTS|UNSERVICEABLE|DEGRADED)\b/i,
  /\bGLIDE\s+PATH\b.*\b(U\/S|OTS|UNSERVICEABLE)\b/i,
  /\bLOC\b.*\b(U\/S|OTS|UNSERVICEABLE)\b/i,
  /\bPAPI\b.*\b(U\/S|OTS|UNSERVICEABLE)\b/i,
  /\bVASI\b.*\b(U\/S|OTS|UNSERVICEABLE)\b/i,
  /\bVOR\b.*\b(U\/S|OTS|UNSERVICEABLE)\b/i,
  /\bNDB\b.*\b(U\/S|OTS|UNSERVICEABLE)\b/i,
  /\bOBST\b/i, // Obstacles / Tower lights
  /\bOBSTACLE\b/i,
  /\bTOWER\s+LIGHT\b|\bLGT\s+OUT\b/i,
  /\bLIGHTING\b.*\b(U\/S|OTS|OUT)\b/i,
  /\bLGT\b.*\b(U\/S|OTS|OUT)\b/i,
  /\bFUEL\s+UNAVAIL\b/i,
  /\bAPCH\b/i, // Approach procedure modifications
  /\bACT\b|\bACTIVE\b/i,
];

export function runDeterministicSafetyEngine(rawNotams: RawNotam[]): FlaggedNotam[] {
  return rawNotams.map((notam) => {
    const text = notam.rawText;
    const criticalMatches: string[] = [];
    const warningMatches: string[] = [];

    // Check critical regexes
    for (const pattern of CRITICAL_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        criticalMatches.push(match[0]);
      }
    }

    // Check warning regexes
    for (const pattern of WARNING_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        warningMatches.push(match[0]);
      }
    }

    let severity: SeverityLevel = 'INFO';
    let matchedKeywords: string[] = [];

    if (criticalMatches.length > 0) {
      severity = 'CRITICAL';
      matchedKeywords = Array.from(new Set(criticalMatches));
    } else if (warningMatches.length > 0) {
      severity = 'WARNING';
      matchedKeywords = Array.from(new Set(warningMatches));
    }

    // Categorization helper
    let category: FlaggedNotam['category'] = 'GENERAL';
    if (/\b(RWY|RUNWAY|BA|BRAKING)\b/i.test(text)) category = 'RUNWAY';
    else if (/\b(TFR|PROHIBITED|AIRSPACE)\b/i.test(text)) category = 'TFR';
    else if (/\b(TWY|TAXIWAY|APRON|RAMP)\b/i.test(text)) category = 'TAXIWAY';
    else if (/\b(ILS|VOR|NDB|NAV|PAPI|VASI|GLIDE|LOC|GPS|IAP|APCH)\b/i.test(text)) category = 'NAVAID';
    else if (/\b(CRANE|OBST|OBSTACLE|TOWER|RIG|MAST|LGT)\b/i.test(text)) category = 'OBSTACLE';

    return {
      id: notam.id,
      rawText: notam.rawText,
      severity,
      matchedKeywords,
      category,
      effectiveWindow: notam.effectiveStart && notam.effectiveEnd 
        ? `${notam.effectiveStart} to ${notam.effectiveEnd}` 
        : undefined,
    };
  });
}
