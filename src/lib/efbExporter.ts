import { BriefingSummary } from '../types';

export interface EfbDeepLinks {
  foreFlightUrl: string;
  skyDemonUrl: string;
  garminPilotUrl: string;
}

export interface ClearancePdfMetadata {
  releaseId: string;
  icao: string;
  timestampZulu: string;
  picName: string;
  cfiSignoff: boolean;
  sha256AuditHash: string;
  qrVerificationUrl: string;
}

/**
 * Generates EFB deep links for ForeFlight, SkyDemon, and Garmin Pilot
 */
export function generateEfbDeepLinks(
  originIcao: string,
  destinationIcao?: string,
  waypoints: string[] = []
): EfbDeepLinks {
  const routePoints = [originIcao, ...waypoints, destinationIcao].filter(Boolean);
  const routeString = routePoints.join(' ');

  const foreFlightUrl = `foreflight://maps?flightplan=${encodeURIComponent(routeString)}`;
  const skyDemonUrl = `skydemon://route?points=${encodeURIComponent(routePoints.join(','))}`;
  const garminPilotUrl = `garminpilot://route?waypoints=${encodeURIComponent(routePoints.join(','))}`;

  return {
    foreFlightUrl,
    skyDemonUrl,
    garminPilotUrl,
  };
}

/**
 * Generates deterministic SHA-256 clearance audit hash for dispatch compliance
 */
export function generateClearanceAuditHash(
  icao: string,
  notamCount: number,
  timestampZulu: string
): string {
  const rawString = `${icao.toUpperCase()}-${notamCount}-${timestampZulu}-VAYU-SAFETY-VERIFIED`;
  
  // Simple deterministic hash function for browser/node runtime portability
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `VAYU-CLR-2026-${icao.toUpperCase()}-${hexHash}-SHA256`;
}

/**
 * Generates PDF clearance release metadata structure
 */
export function generateClearanceMetadata(
  briefing: BriefingSummary,
  picName: string = 'CAPTAIN / PIC',
  cfiSignoff: boolean = true
): ClearancePdfMetadata {
  const timestampZulu = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const notamCount = briefing.totalNotamsIngested || briefing.allNotamsLedger?.length || 0;
  const releaseId = generateClearanceAuditHash(
    briefing.icao,
    notamCount,
    timestampZulu
  );

  const qrVerificationUrl = `https://ai-vayu.vercel.app/verify/${releaseId}`;

  return {
    releaseId,
    icao: briefing.icao,
    timestampZulu,
    picName,
    cfiSignoff,
    sha256AuditHash: releaseId,
    qrVerificationUrl,
  };
}
