export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | 'UNKNOWN';

export interface RawNotam {
  id: string;
  icao: string;
  rawText: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  type?: string; // RWY, TWY, NAV, TFR, OBST, AIRSPACE, OTHER
}

export interface FlaggedNotam {
  id: string;
  rawText: string;
  severity: SeverityLevel;
  matchedKeywords: string[];
  category: 'RUNWAY' | 'TFR' | 'NAVAID' | 'TAXIWAY' | 'OBSTACLE' | 'GENERAL';
  effectiveWindow?: string;
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
  weather: {
    rawMetar: string;
    rawTaf?: string;
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
    category: string;
    actionRequired?: string;
    effectiveWindow?: string;
  }>;
  warnings: Array<{
    id: string;
    title: string;
    plainEnglish: string;
    rawSnippet: string;
    category: string;
    effectiveWindow?: string;
  }>;
  infoItems: Array<{
    id: string;
    title: string;
    plainEnglish: string;
    rawSnippet: string;
  }>;
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
