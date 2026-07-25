export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | 'UNKNOWN';

export type NotamBucket =
  | 'RUNWAYS_TFRS'
  | 'PROCEDURES_NAVAIDS'
  | 'TAXIWAYS_APRON'
  | 'OBSTACLES_LIGHTING'
  | 'FIR_ENROUTE'
  | 'GENERAL';

export interface RawNotam {
  id: string;
  icao: string;
  rawText: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  type?: string; // RWY, TWY, NAV, TFR, OBST, AIRSPACE, FIR, OTHER
  isFir?: boolean;
  firIcao?: string;
}

export interface FlaggedNotam {
  id: string;
  rawText: string;
  severity: SeverityLevel;
  matchedKeywords: string[];
  category: NotamBucket;
  effectiveStart?: string;
  effectiveEnd?: string;
  effectiveWindow?: string;
  effectiveStatus?: 'ACTIVE_NOW' | 'SCHEDULED_FUTURE' | 'EXPIRED' | 'PERMANENT';
  isFir?: boolean;
  firIcao?: string;
}

export interface MetarData {
  icao: string;
  rawText: string;
  timestamp: string;
  flightCategory: FlightCategory;
  windSpeedKts?: number;
  windDirDeg?: number;
  visibilitySm?: number;
  tempC?: number;
  dewpointC?: number;
  altimeterInHg?: number;
  clouds?: string;
}

export interface BriefingSummary {
  icao: string;
  airportName?: string;
  generatedAtUtc: string;
  // Honest data provenance — set by the server, consumed by the frontend
  dataSource?: {
    metar: 'LIVE (NOAA)' | 'SYNTHETIC';
    taf: 'LIVE (NOAA)' | 'SYNTHETIC';
    notams: 'LIVE (FAA)' | 'SYNTHETIC';
    aiSummary: 'GEMINI AI' | 'DETERMINISTIC ENGINE';
  };
  weather: {
    rawMetar: string;
    rawTaf?: string;
    tafDecodedSummary?: string;
    plainEnglishSummary: string;
    flightCategory: FlightCategory;
    windInfo: string;
    visibilityInfo: string;
    cloudInfo: string;
    tempDewInfo: string;
  };
  criticalAlerts: Array<{
    id: string;
    title: string;
    plainEnglish: string;
    rawSnippet: string;
    category: NotamBucket | string;
    actionRequired?: string;
    effectiveWindow?: string;
    isFir?: boolean;
  }>;
  warnings: Array<{
    id: string;
    title: string;
    plainEnglish: string;
    rawSnippet: string;
    category: NotamBucket | string;
    effectiveWindow?: string;
    isFir?: boolean;
  }>;
  infoItems: Array<{
    id: string;
    title: string;
    plainEnglish: string;
    rawSnippet: string;
    isFir?: boolean;
  }>;
  allNotamsLedger: FlaggedNotam[];
  bucketCounts: {
    RUNWAYS_TFRS: number;
    PROCEDURES_NAVAIDS: number;
    TAXIWAYS_APRON: number;
    OBSTACLES_LIGHTING: number;
    FIR_ENROUTE: number;
    GENERAL: number;
  };
  picTakeaway: string;
  totalNotamsIngested: number;
  criticalCount: number;
  warningCount: number;
  deterministicRulesTriggered: number;
}

export interface RouteLegBriefing {
  origin: BriefingSummary;
  destination: BriefingSummary;
  alternatesAndWaypoints: BriefingSummary[];
  routeSummaryText: string;
}

export interface AuditLogEntry {
  id: string;
  timestampUtc: string;
  icao: string;
  criticalCount: number;
  warningCount: number;
  flightCategory: FlightCategory;
  briefingJson: BriefingSummary;
}
