export interface WindComponents {
  runwayHeading: number; // 0 to 360 degrees
  windDirection: number; // 0 to 360 degrees
  windSpeedKts: number;
  windGustKts?: number;
  headwindKts: number;
  crosswindKts: number;
  tailwindKts: number;
  crosswindDirection: 'LEFT' | 'RIGHT' | 'NONE';
}

export interface AircraftEnvelopeLimit {
  aircraftType: string; // e.g. "C172", "B737", "A320"
  maxCrosswindKts: number;
  maxTailwindKts: number;
}

export interface EnvelopeWarning {
  isExceeded: boolean;
  limitType: 'CROSSWIND' | 'TAILWIND' | 'NONE';
  currentValueKts: number;
  maxAllowedKts: number;
  warningMessage: string;
}

export interface ApproachWindowWarning {
  timeBlock: string;
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  ceilingFt?: number;
  visibilitySm?: number;
  warningMessage?: string;
}

export const STANDARD_AIRCRAFT_LIMITS: Record<string, AircraftEnvelopeLimit> = {
  C172: { aircraftType: 'Cessna 172 Skyhawk', maxCrosswindKts: 15, maxTailwindKts: 5 },
  PA28: { aircraftType: 'Piper PA-28 Archer', maxCrosswindKts: 17, maxTailwindKts: 5 },
  B737: { aircraftType: 'Boeing 737-800', maxCrosswindKts: 33, maxTailwindKts: 10 },
  A320: { aircraftType: 'Airbus A320neo', maxCrosswindKts: 33, maxTailwindKts: 10 },
};

/**
 * Calculates dynamic crosswind, headwind, and tailwind components using vector trigonometry
 */
export function calculateWindComponents(
  runwayHeadingDeg: number,
  windDirDeg: number,
  windSpeedKts: number,
  windGustKts?: number
): WindComponents {
  // Convert angle difference to radians
  const angleDiffRad = ((windDirDeg - runwayHeadingDeg) * Math.PI) / 180;
  const effectiveSpeed = windGustKts ? Math.max(windSpeedKts, windGustKts) : windSpeedKts;

  // Trigonometric components
  const rawHeadwind = effectiveSpeed * Math.cos(angleDiffRad);
  const rawCrosswind = effectiveSpeed * Math.sin(angleDiffRad);

  const headwindKts = Math.max(0, Math.round(rawHeadwind));
  const tailwindKts = Math.max(0, Math.round(-rawHeadwind));
  const crosswindKts = Math.round(Math.abs(rawCrosswind));

  let crosswindDirection: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
  if (rawCrosswind > 1) crosswindDirection = 'RIGHT';
  if (rawCrosswind < -1) crosswindDirection = 'LEFT';

  return {
    runwayHeading: runwayHeadingDeg,
    windDirection: windDirDeg,
    windSpeedKts,
    windGustKts,
    headwindKts,
    crosswindKts,
    tailwindKts,
    crosswindDirection,
  };
}

/**
 * Compares wind components against specific aircraft operating envelope limits
 */
export function checkAircraftEnvelope(
  components: WindComponents,
  aircraftKey: string = 'C172'
): EnvelopeWarning {
  const limit = STANDARD_AIRCRAFT_LIMITS[aircraftKey] || STANDARD_AIRCRAFT_LIMITS.C172;

  if (components.crosswindKts > limit.maxCrosswindKts) {
    return {
      isExceeded: true,
      limitType: 'CROSSWIND',
      currentValueKts: components.crosswindKts,
      maxAllowedKts: limit.maxCrosswindKts,
      warningMessage: `⚠️ CROSSWIND EXCEEDANCE: ${components.crosswindKts} kts exceeds ${limit.aircraftType} limit of ${limit.maxCrosswindKts} kts!`,
    };
  }

  if (components.tailwindKts > limit.maxTailwindKts) {
    return {
      isExceeded: true,
      limitType: 'TAILWIND',
      currentValueKts: components.tailwindKts,
      maxAllowedKts: limit.maxTailwindKts,
      warningMessage: `⚠️ TAILWIND EXCEEDANCE: ${components.tailwindKts} kts exceeds ${limit.aircraftType} limit of ${limit.maxTailwindKts} kts!`,
    };
  }

  return {
    isExceeded: false,
    limitType: 'NONE',
    currentValueKts: components.crosswindKts,
    maxAllowedKts: limit.maxCrosswindKts,
    warningMessage: `✅ Wind parameters within ${limit.aircraftType} operating envelope.`,
  };
}

/**
 * Evaluates TAF weather blocks for marginal VFR/IFR ceiling & visibility drops
 */
export function analyzeTafApproachWindows(tafText: string): ApproachWindowWarning[] {
  const warnings: ApproachWindowWarning[] = [];
  const lines = tafText.split('\n');

  lines.forEach((line) => {
    const lineUpper = line.toUpperCase();
    let category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' = 'VFR';
    let ceilingFt: number | undefined;
    let visibilitySm: number | undefined;

    // Parse Ceiling (BKN/OVC e.g. BKN008 -> 800ft)
    const cloudMatch = lineUpper.match(/\b(BKN|OVC)(\d{3})\b/);
    if (cloudMatch) {
      ceilingFt = parseInt(cloudMatch[2], 10) * 100;
    }

    // Parse Visibility (e.g. 2SM, 1/2SM)
    const visMatch = lineUpper.match(/\b(\d+)(\/\d+)?SM\b/);
    if (visMatch) {
      visibilitySm = parseInt(visMatch[1], 10);
    }

    // Determine Flight Category
    if ((ceilingFt && ceilingFt < 500) || (visibilitySm && visibilitySm < 1)) {
      category = 'LIFR';
    } else if ((ceilingFt && ceilingFt < 1000) || (visibilitySm && visibilitySm < 3)) {
      category = 'IFR';
    } else if ((ceilingFt && ceilingFt <= 3000) || (visibilitySm && visibilitySm <= 5)) {
      category = 'MVFR';
    }

    if (category !== 'VFR') {
      warnings.push({
        timeBlock: line.slice(0, 20).trim() || 'TAF Block',
        category,
        ceilingFt,
        visibilitySm,
        warningMessage: `⚠️ ${category} Conditions Expected: Ceiling ${ceilingFt ?? 'N/A'}ft, Vis ${visibilitySm ?? 'N/A'}SM`,
      });
    }
  });

  return warnings;
}
