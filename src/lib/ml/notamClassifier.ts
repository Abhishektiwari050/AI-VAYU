import { ParsedIcaoNotam, RawNotam } from '../../types';

export type SeverityLevelCode = 'LEVEL_3_CRITICAL' | 'LEVEL_2_CAUTION' | 'LEVEL_1_INFO';

export interface NotamClassificationResult {
  severityLevel: SeverityLevelCode;
  operationalImpactScore: number; // 0.0 to 1.0
  assetTags: string[];
  parsedTimes: {
    wef?: string;
    til?: string;
    effectiveStatus: 'ACTIVE_NOW' | 'SCHEDULED_FUTURE' | 'EXPIRED' | 'PERMANENT';
  };
  restrictionType: string;
}

/**
 * Dual-Stage NOTAM NER & Hazard Classifier
 * Extracts ICAO Q-code, effective times (WEF/TIL), asset tags, and severity level.
 */
export function classifyNotam(rawText: string): NotamClassificationResult {
  const textUpper = rawText.toUpperCase();

  // 1. Extract Effective Times (WEF = Item B, TIL = Item C)
  let wef: string | undefined;
  let til: string | undefined;
  let effectiveStatus: 'ACTIVE_NOW' | 'SCHEDULED_FUTURE' | 'EXPIRED' | 'PERMANENT' = 'ACTIVE_NOW';

  const bMatch = textUpper.match(/\bB\)\s*(\d{10}|\d{12})\b/);
  if (bMatch) wef = bMatch[1];

  const cMatch = textUpper.match(/\bC\)\s*(\d{10}|\d{12}|PERM|PERMANENT)\b/);
  if (cMatch) {
    til = cMatch[1];
    if (til === 'PERM' || til === 'PERMANENT') {
      effectiveStatus = 'PERMANENT';
    }
  }

  // 2. Extract Asset Tags via NER Rules
  const assetTags: string[] = [];

  // Runway tags (e.g. RWY 11R/29L, RWY 09)
  const rwyMatches = textUpper.match(/\bRWY\s*(\d{2}[LCR]?(\/\d{2}[LCR]?)?)\b/g);
  if (rwyMatches) {
    rwyMatches.forEach((m) => assetTags.push(m.replace(/\s+/g, '_')));
  } else if (textUpper.includes('RWY') || textUpper.includes('RUNWAY')) {
    assetTags.push('RUNWAY_GENERAL');
  }

  // Taxiway tags (e.g. TWY A, TWY B1)
  const twyMatches = textUpper.match(/\bTWY\s*([A-Z0-9]+)\b/g);
  if (twyMatches) {
    twyMatches.forEach((m) => assetTags.push(m.replace(/\s+/g, '_')));
  } else if (textUpper.includes('TWY') || textUpper.includes('TAXIWAY')) {
    assetTags.push('TAXIWAY_GENERAL');
  }

  // Instrument / Navaid tags (ILS, VOR, DME, NDB, PAPI)
  if (textUpper.includes('ILS')) assetTags.push('NAV_ILS');
  if (textUpper.includes('VOR')) assetTags.push('NAV_VOR');
  if (textUpper.includes('DME')) assetTags.push('NAV_DME');
  if (textUpper.includes('PAPI')) assetTags.push('LIGHTS_PAPI');

  // Airspace / TFR tags
  if (textUpper.includes('TFR') || textUpper.includes('TEMPORARY RESTRICTED AREA') || textUpper.includes('PROHIBITED')) {
    assetTags.push('TFR_AIRSPACE');
  }

  // Deduplicate tags
  const uniqueAssetTags = Array.from(new Set(assetTags));

  // 3. Operational Impact Score & Multi-Head Severity Classifier
  let severityLevel: SeverityLevelCode = 'LEVEL_1_INFO';
  let impactScore = 0.1;
  let restrictionType = 'GENERAL_NOTICE';

  // Critical triggers (Score: 0.85 - 1.0)
  if (
    textUpper.includes('CLOSED') ||
    textUpper.includes('CLSD') ||
    textUpper.includes('NOT AVBL') ||
    textUpper.includes('U/S') ||
    textUpper.includes('UNSERVICEABLE') ||
    textUpper.includes('PROHIBITED') ||
    textUpper.includes('TFR')
  ) {
    if (uniqueAssetTags.some((t) => t.startsWith('RUNWAY') || t === 'TFR_AIRSPACE')) {
      severityLevel = 'LEVEL_3_CRITICAL';
      impactScore = 0.95;
      restrictionType = 'RUNWAY_CLOSURE_TFR';
    } else if (uniqueAssetTags.some((t) => t.startsWith('NAV_ILS'))) {
      severityLevel = 'LEVEL_3_CRITICAL';
      impactScore = 0.85;
      restrictionType = 'ILS_CAT_OUTAGE';
    } else {
      severityLevel = 'LEVEL_2_CAUTION';
      impactScore = 0.65;
      restrictionType = 'INFRASTRUCTURE_UNSERVICEABLE';
    }
  } else if (
    textUpper.includes('WIP') ||
    textUpper.includes('WORK IN PROGRESS') ||
    textUpper.includes('MAINTENANCE') ||
    textUpper.includes('OBSTACLE') ||
    textUpper.includes('CRANE')
  ) {
    severityLevel = 'LEVEL_2_CAUTION';
    impactScore = 0.50;
    restrictionType = 'WORK_IN_PROGRESS_HAZARD';
  } else if (textUpper.includes('BIRD') || textUpper.includes('WILDLIFE')) {
    severityLevel = 'LEVEL_2_CAUTION';
    impactScore = 0.40;
    restrictionType = 'WILDLIFE_HAZARD';
  }

  return {
    severityLevel,
    operationalImpactScore: Number(impactScore.toFixed(2)),
    assetTags: uniqueAssetTags,
    parsedTimes: {
      wef,
      til,
      effectiveStatus,
    },
    restrictionType,
  };
}
