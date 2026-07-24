import { runDeterministicSafetyEngine } from '../../../../src/lib/deterministicEngine';
import { generateSyntheticNotams } from '../../../../src/lib/mockAviationData';

export interface MonitoredFlightRoute {
  flightId: string;
  tailNumber: string;
  picEmail: string;
  origin: string;
  destination: string;
  waypoints: string[];
  lastCheckedNotamIds: string[];
}

export interface HazardAlertNotification {
  alertId: string;
  flightId: string;
  tailNumber: string;
  picEmail: string;
  airportIcao: string;
  hazardTitle: string;
  rawSnippet: string;
  severity: 'CRITICAL' | 'WARNING';
  timestampUtc: string;
}

// In-memory active flight monitoring registry
export const activeMonitoredFlights: MonitoredFlightRoute[] = [
  {
    flightId: 'FLT-VAYU-101',
    tailNumber: 'VT-VAYU',
    picEmail: 'chief.pilot@vayu.aero',
    origin: 'VIDP',
    destination: 'VABB',
    waypoints: [],
    lastCheckedNotamIds: [],
  },
  {
    flightId: 'FLT-VAYU-202',
    tailNumber: 'N172SP',
    picEmail: 'dispatch@vayu.aero',
    origin: 'KJFK',
    destination: 'KDFW',
    waypoints: [],
    lastCheckedNotamIds: [],
  },
];

/**
 * Background Hazard Monitoring Cron Worker Route
 * Periodic automated scanner for active routes & aerodromes to detect new critical NOTAMs.
 */
export async function executeHazardMonitoringScan(): Promise<{
  scannedFlightsCount: number;
  newHazardsDetected: HazardAlertNotification[];
  timestampUtc: string;
}> {
  const timestampUtc = new Date().toISOString();
  const newHazardsDetected: HazardAlertNotification[] = [];

  for (const flight of activeMonitoredFlights) {
    const aerodromes = [flight.origin, ...flight.waypoints, flight.destination];

    for (const icao of aerodromes) {
      // Fetch live NOTAMs or backup stream
      let notams: any[] = [];
      try {
        const res = await fetch(`https://aviationweather.gov/api/data/notam?ids=${icao}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            notams = data.map((item: any, idx: number) => ({
              id: item.notamId || `${icao}-${idx}`,
              icao: item.icao || icao,
              rawText: item.icaoMessage || item.raw || JSON.stringify(item),
            }));
          }
        }
      } catch (err) {}

      if (notams.length === 0) {
        notams = generateSyntheticNotams(icao);
      }

      // Run deterministic safety scanner
      const flagged = runDeterministicSafetyEngine(notams);
      const criticals = flagged.filter((n) => n.severity === 'CRITICAL');

      for (const crit of criticals) {
        if (!flight.lastCheckedNotamIds.includes(crit.id)) {
          flight.lastCheckedNotamIds.push(crit.id);

          newHazardsDetected.push({
            alertId: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            flightId: flight.flightId,
            tailNumber: flight.tailNumber,
            picEmail: flight.picEmail,
            airportIcao: icao,
            hazardTitle: `CRITICAL HAZARD DETECTED AT ${icao}: ${crit.category.replace('_', ' ')}`,
            rawSnippet: crit.rawText,
            severity: 'CRITICAL',
            timestampUtc,
          });
        }
      }
    }
  }

  return {
    scannedFlightsCount: activeMonitoredFlights.length,
    newHazardsDetected,
    timestampUtc,
  };
}

export async function GET() {
  try {
    const result = await executeHazardMonitoringScan();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Monitoring scan failed', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
