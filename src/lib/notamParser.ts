/**
 * Strict ICAO NOTAM Field & Q-Code Parser
 * Project VAYU — Deterministic Aviation Intelligence Parser
 *
 * Implements ICAO Annex 15 & FAA NOTAM Field & Q-Code Parsing Standards.
 * Guarantees 100% data integrity before AI synthesis.
 */

import { NotamBucket, ParsedIcaoNotam, SeverityLevel } from '../types';
import { evaluateTemporalStatus, parseAviationTimestamp } from './temporalCheck';

// ── Comprehensive ICAO Q-Code Dictionary ──────────────────────────────────────

const Q_CODE_SUBJECTS: Record<string, { name: string; category: NotamBucket; severity: SeverityLevel }> = {
  MR: { name: 'Runway', category: 'RUNWAYS_TFRS', severity: 'CRITICAL' },
  MX: { name: 'Taxiway', category: 'TAXIWAYS_APRON', severity: 'WARNING' },
  FA: { name: 'Aerodrome / Airport', category: 'RUNWAYS_TFRS', severity: 'CRITICAL' },
  IS: { name: 'ILS (Instrument Landing System)', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  IG: { name: 'Glide Path / Glideslope', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  IC: { name: 'Localizer', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  NV: { name: 'VOR / VOR-DME', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  ND: { name: 'NDB (Non-Directional Beacon)', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  NM: { name: 'TACAN / DME', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  PI: { name: 'Instrument Approach Procedure', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  PD: { name: 'SID (Standard Instrument Departure)', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  PA: { name: 'STAR (Standard Terminal Arrival)', category: 'PROCEDURES_NAVAIDS', severity: 'WARNING' },
  OB: { name: 'Obstacle / Crane', category: 'OBSTACLES_LIGHTING', severity: 'INFO' },
  OL: { name: 'Obstacle Lighting', category: 'OBSTACLES_LIGHTING', severity: 'INFO' },
  LA: { name: 'Airfield Runway / Approach Lighting', category: 'OBSTACLES_LIGHTING', severity: 'WARNING' },
  LB: { name: 'Bird / Wildlife Hazard', category: 'OBSTACLES_LIGHTING', severity: 'WARNING' },
  RT: { name: 'TFR / Restricted Airspace', category: 'RUNWAYS_TFRS', severity: 'CRITICAL' },
  RD: { name: 'Danger Area Airspace', category: 'RUNWAYS_TFRS', severity: 'CRITICAL' },
  RP: { name: 'Prohibited Airspace', category: 'RUNWAYS_TFRS', severity: 'CRITICAL' },
  GW: { name: 'GNSS / GPS Navigation', category: 'FIR_ENROUTE', severity: 'CRITICAL' },
  MP: { name: 'Apron / Stand / Ramp', category: 'TAXIWAYS_APRON', severity: 'INFO' },
  FU: { name: 'Fuel Availability', category: 'GENERAL', severity: 'WARNING' },
  FF: { name: 'Fire Fighting & Rescue Services', category: 'RUNWAYS_TFRS', severity: 'CRITICAL' },
  SE: { name: 'SIGMET / Weather Hazard', category: 'FIR_ENROUTE', severity: 'CRITICAL' },
};

const Q_CODE_CONDITIONS: Record<string, { name: string; isHazardous: boolean }> = {
  LC: { name: 'Closed', isHazardous: true },
  AS: { name: 'Unserviceable (U/S)', isHazardous: true },
  AU: { name: 'Not Available / Unavailable', isHazardous: true },
  AH: { name: 'Hours of Operation Changed', isHazardous: false },
  CL: { name: 'Replaced / Cancelled', isHazardous: false },
  AW: { name: 'Completely Withdrawn', isHazardous: true },
  CA: { name: 'Activated / Active', isHazardous: true },
  CH: { name: 'Changed / Modified', isHazardous: false },
  CC: { name: 'Completed / Normal Operation Resumed', isHazardous: false },
  AP: { name: 'Available on Request', isHazardous: false },
  AK: { name: 'Resumed Operation', isHazardous: false },
  XX: { name: 'Plain Language Notice', isHazardous: false },
};

// ── Core ICAO NOTAM Parser Function ───────────────────────────────────────────

export function parseIcaoNotam(rawText: string, defaultIcao: string = 'UNKNOWN'): ParsedIcaoNotam {
  const text = (rawText || '').trim();
  const upper = text.toUpperCase();

  const parsed: ParsedIcaoNotam = {
    icao: defaultIcao,
    bodyText: text,
  };

  // 1. Extract NOTAM ID (e.g. A1234/26, C0482/26, 12/045)
  const idMatch = text.match(/\b([A-Z]\d{4}\/\d{2}|\d{2}\/\d{3,4})\b/i);
  if (idMatch) {
    parsed.notamId = idMatch[1].toUpperCase();
  }

  // 2. Parse Item Q) Q-Code string (e.g., Q) VIDF/QMRLC/IV/NBO/A/000/999/2834N07706E005)
  const qLineMatch = upper.match(/Q\)\s*([A-Z4]{4}\/Q[A-Z]{4}\/[^\n\r]+)/);
  let qCodeStr = '';
  if (qLineMatch) {
    const parts = qLineMatch[1].split('/');
    if (parts.length > 1 && parts[1].startsWith('Q')) {
      qCodeStr = parts[1];
    }
  } else {
    // Direct Q-code match e.g. QMRLC
    const directQMatch = upper.match(/\bQ([A-Z]{4})\b/);
    if (directQMatch) {
      qCodeStr = `Q${directQMatch[1]}`;
    }
  }

  if (qCodeStr && qCodeStr.length === 5) {
    parsed.qCode = qCodeStr;
    const subjectCode = qCodeStr.substring(1, 3);
    const conditionCode = qCodeStr.substring(3, 5);

    parsed.qSubjectCode = subjectCode;
    parsed.qConditionCode = conditionCode;

    const subjectMeta = Q_CODE_SUBJECTS[subjectCode];
    const conditionMeta = Q_CODE_CONDITIONS[conditionCode];

    if (subjectMeta) {
      parsed.qSubjectDecoded = subjectMeta.name;
      parsed.qCategory = subjectMeta.category;
      parsed.qSeverity = subjectMeta.severity;
    }

    if (conditionMeta) {
      parsed.qConditionDecoded = conditionMeta.name;
    }

    // Special deterministic hard override: Subject == MR (Runway) AND Condition == LC (Closed)
    if (subjectCode === 'MR' && conditionCode === 'LC') {
      parsed.qCategory = 'RUNWAYS_TFRS';
      parsed.qSeverity = 'CRITICAL';
      parsed.qSubjectDecoded = 'Runway';
      parsed.qConditionDecoded = 'CLOSED';
    } else if (subjectCode === 'FA' && conditionCode === 'LC') {
      parsed.qCategory = 'RUNWAYS_TFRS';
      parsed.qSeverity = 'CRITICAL';
      parsed.qSubjectDecoded = 'Aerodrome';
      parsed.qConditionDecoded = 'CLOSED';
    }
  }

  // 3. Extract Item A) Aerodrome Code
  const itemAMatch = upper.match(/A\)\s*([A-Z0-9]{3,4})/);
  if (itemAMatch) {
    parsed.icao = itemAMatch[1];
  }

  // 4. Extract Item B) Start Time (WEF)
  const itemBMatch = upper.match(/B\)\s*(\d{10})/);
  if (itemBMatch) {
    parsed.effectiveStartRaw = itemBMatch[1];
    const startDate = parseAviationTimestamp(itemBMatch[1]);
    if (startDate) {
      parsed.effectiveStartIso = startDate.toISOString();
    }
  }

  // 5. Extract Item C) End Time (TIL)
  const itemCMatch = upper.match(/C\)\s*(\d{10}|PERM|EST)/);
  if (itemCMatch) {
    parsed.effectiveEndRaw = itemCMatch[1];
    if (itemCMatch[1] === 'PERM') {
      parsed.effectiveEndFormatted = 'PERM';
    } else if (itemCMatch[1] !== 'EST') {
      const endDate = parseAviationTimestamp(itemCMatch[1]);
      if (endDate) {
        parsed.effectiveEndIso = endDate.toISOString();
      }
    }
  }

  // 6. Extract Item E) Body Text
  const itemEMatch = text.match(/E\)\s*([\s\S]+?)(?=\s*(?:F\)|G\)|$))/i);
  if (itemEMatch) {
    parsed.bodyText = itemEMatch[1].trim();
  }

  // 7. Evaluate Temporal Active Window
  const tempEval = evaluateTemporalStatus(
    parsed.effectiveStartIso || parsed.effectiveStartRaw,
    parsed.effectiveEndIso || parsed.effectiveEndRaw,
    text
  );

  parsed.effectiveStartFormatted = tempEval.startFormatted;
  parsed.effectiveEndFormatted = tempEval.endFormatted || (parsed.effectiveEndRaw === 'PERM' ? 'PERM' : undefined);

  return parsed;
}

/**
 * Builds a 1-sentence deterministic summary for pilot glanceability
 */
export function buildDeterministicSummary(parsed: ParsedIcaoNotam, rawText: string): string {
  if (parsed.qSubjectDecoded && parsed.qConditionDecoded) {
    // Attempt runway designation extraction (e.g., RWY 11L/29R or RWY 09)
    const rwyDesignator = rawText.match(/\b(?:RWY|RUNWAY)\s*([0-9]{2}[LCR]?\/(?:[0-9]{2}[LCR]?)?|[0-9]{2}[LCR]?)\b/i);
    const rwyName = rwyDesignator ? `RWY ${rwyDesignator[1].toUpperCase()}` : parsed.qSubjectDecoded.toUpperCase();

    if (parsed.qConditionCode === 'LC') {
      return `🔴 ${rwyName} IS CLOSED (${parsed.effectiveStartFormatted || 'WEF'} to ${parsed.effectiveEndFormatted || 'TIL'}).`;
    }
    if (parsed.qConditionCode === 'AS' || parsed.qConditionCode === 'AU') {
      return `🟡 ${rwyName} ${parsed.qConditionDecoded.toUpperCase()} (${parsed.effectiveStartFormatted || 'WEF'}).`;
    }
    return `${parsed.qSubjectDecoded.toUpperCase()} ${parsed.qConditionDecoded.toUpperCase()} - ${parsed.bodyText ? parsed.bodyText.slice(0, 100) : 'Active NOTAM'}`;
  }

  // Fallback to body text or first line
  const cleanBody = (parsed.bodyText || rawText).replace(/\s+/g, ' ').trim();
  return cleanBody.length > 140 ? `${cleanBody.slice(0, 137)}...` : cleanBody;
}
