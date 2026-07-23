import { BriefingSummary, RouteLegBriefing } from '../types';
import { generateSyntheticMetar, generateSyntheticNotams } from './mockAviationData';
import { runDeterministicSafetyEngine } from './deterministicEngine';
import { lookupAirport } from './airportData';

export function generateClientFallbackBriefing(icao: string): BriefingSummary {
  const code = icao.trim().toUpperCase();
  const airport = lookupAirport(code);
  const metar = generateSyntheticMetar(code);
  const rawNotams = generateSyntheticNotams(code);
  const flagged = runDeterministicSafetyEngine(rawNotams);

  const criticals = flagged.filter((n) => n.severity === 'CRITICAL');
  const warnings = flagged.filter((n) => n.severity === 'WARNING');
  const infos = flagged.filter((n) => n.severity === 'INFO');

  return {
    icao: code,
    airportName: airport?.name || `${code} Airport`,
    generatedAtUtc: new Date().toISOString(),
    weather: {
      rawMetar: metar.rawText,
      plainEnglishSummary: `Current METAR for ${code}: ${metar.rawText}. Rated ${metar.flightCategory}.`,
      flightCategory: metar.flightCategory,
      windInfo: metar.windSpeedKts ? `${metar.windDirDeg}° at ${metar.windSpeedKts} kts` : 'Winds 180° at 10 kts',
      visibilityInfo: metar.visibilitySm ? `${metar.visibilitySm} SM` : '10 SM',
      cloudInfo: metar.clouds || 'Clear skies',
      tempDewInfo: metar.tempC !== undefined ? `${metar.tempC}°C / ${metar.dewpointC}°C` : '24°C / 18°C',
    },
    criticalAlerts: criticals.map((c) => ({
      id: c.id,
      title: `${c.category} RESTRICTION`,
      plainEnglish: `Active critical restriction detected matching [${c.matchedKeywords.join(', ')}]. Immediate operational review required.`,
      rawSnippet: c.rawText,
      category: c.category,
      actionRequired: 'Verify operational status with ATC prior to taxi/departure.',
      effectiveWindow: c.effectiveWindow,
    })),
    warnings: warnings.map((w) => ({
      id: w.id,
      title: `${w.category} ADVISORY`,
      plainEnglish: `Outage or hazard identified matching [${w.matchedKeywords.join(', ')}]. Check approach minimums and taxipath.`,
      rawSnippet: w.rawText,
      category: w.category,
      effectiveWindow: w.effectiveWindow,
    })),
    infoItems: infos.map((i) => ({
      id: i.id,
      title: 'GENERAL NOTICE',
      plainEnglish: `Standard aerodrome note: ${i.rawText}`,
      rawSnippet: i.rawText,
    })),
    picTakeaway: criticals.length > 0 
      ? `ATTENTION PIC: ${criticals.length} critical alert(s) active at ${code}. Review runway closures and airspace limits before engine start.`
      : `Normal pre-flight operations at ${code}. Maintain standard vigilance.`,
    totalNotamsIngested: flagged.length,
    criticalCount: criticals.length,
    warningCount: warnings.length,
    deterministicRulesTriggered: criticals.length + warnings.length,
  };
}

export function generateClientFallbackRoute(origin: string, destination: string, waypoints: string[] = []): RouteLegBriefing {
  const codes = [origin, ...waypoints, destination].map((c) => c.trim().toUpperCase());
  const briefings = codes.map((c) => generateClientFallbackBriefing(c));
  
  const originBriefing = briefings[0];
  const destBriefing = briefings[briefings.length - 1];
  const waypointsBriefings = briefings.slice(1, briefings.length - 1);

  const totalCriticals = briefings.reduce((sum, b) => sum + b.criticalCount, 0);
  const totalWarnings = briefings.reduce((sum, b) => sum + b.warningCount, 0);

  return {
    origin: originBriefing,
    destination: destBriefing,
    alternatesAndWaypoints: waypointsBriefings,
    routeSummaryText: `Route Corridor Briefing (${origin} → ${destination}): Ingested ${briefings.reduce((s, b) => s + b.totalNotamsIngested, 0)} total NOTAMs. Found ${totalCriticals} CRITICAL alerts and ${totalWarnings} warnings across route segment.`,
  };
}
