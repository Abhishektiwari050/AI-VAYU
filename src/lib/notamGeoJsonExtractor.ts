import { FlaggedNotam } from '../types';
import { lookupAirport } from './airportData';

export interface GeoJsonNotamFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: any;
  };
  properties: {
    id: string;
    category: string;
    severity: string;
    rawText: string;
    title?: string;
    radiusMeters?: number;
    effectiveStatus?: string;
    effectiveWindow?: string;
    isFir?: boolean;
  };
}

export interface GeoJsonNotamCollection {
  type: 'FeatureCollection';
  features: GeoJsonNotamFeature[];
  airportCenter: [number, number];
}

/**
 * Converts ICAO coordinate format (e.g. 2834N07706E) into decimal [lat, lng]
 */
export function parseIcaoCoordinates(coordStr: string): [number, number] | null {
  const regex = /(\d{2})(\d{2})([NS])\s*(\d{3})(\d{2})([EW])/i;
  const match = coordStr.match(regex);
  if (!match) return null;

  const latDeg = parseInt(match[1], 10);
  const latMin = parseInt(match[2], 10);
  const latDir = match[3].toUpperCase();

  const lngDeg = parseInt(match[4], 10);
  const lngMin = parseInt(match[5], 10);
  const lngDir = match[6].toUpperCase();

  let lat = latDeg + latMin / 60;
  if (latDir === 'S') lat = -lat;

  let lng = lngDeg + lngMin / 60;
  if (lngDir === 'W') lng = -lng;

  return [lat, lng];
}

/**
 * Extract spatial GeoJSON features from NOTAM array for GIS mapping
 */
export function extractNotamGeoJson(
  icao: string,
  notams: FlaggedNotam[]
): GeoJsonNotamCollection {
  const airport = lookupAirport(icao);
  // Default airport center fallback (VIDP: [28.5665, 77.1031], KJFK: [40.6413, -73.7789], etc.)
  const center: [number, number] =
    airport?.lat !== undefined && airport?.lon !== undefined
      ? [airport.lat, airport.lon]
      : [28.5665, 77.1031];

  const features: GeoJsonNotamFeature[] = [];

  notams.forEach((n, idx) => {
    let pointCoords: [number, number] | null = null;
    let radiusNM = 5;

    // 1. Try parsing Item Q line: e.g. Q) VIDF/QMRLC/IV/NBO/A/000/999/2834N07706E005
    const qLineMatch = n.rawText.match(/Q\)\s*[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/(\d{4}[NS]\d{5}[EW])(\d{3})?/i);
    if (qLineMatch) {
      pointCoords = parseIcaoCoordinates(qLineMatch[1]);
      if (qLineMatch[2]) {
        radiusNM = parseInt(qLineMatch[2], 10) || 5;
      }
    }

    // 2. Try parsing body coordinates if Q line was absent
    if (!pointCoords) {
      const bodyCoordMatch = n.rawText.match(/\b(\d{4}[NS]\s*\d{5}[EW])\b/i);
      if (bodyCoordMatch) {
        pointCoords = parseIcaoCoordinates(bodyCoordMatch[1]);
      }
    }

    // 3. Fallback to slightly jittered airport center coordinates if no exact lat/lng found
    if (!pointCoords) {
      const offsetLat = (Math.random() - 0.5) * 0.015;
      const offsetLng = (Math.random() - 0.5) * 0.015;
      pointCoords = [center[0] + offsetLat, center[1] + offsetLng];
    }

    // Check for explicit radius in text e.g. "RADIUS 5NM" or "5NM RADIUS"
    const radiusTextMatch = n.rawText.match(/\b(\d+)\s*NM\b/i);
    if (radiusTextMatch) {
      radiusNM = parseInt(radiusTextMatch[1], 10);
    }

    const radiusMeters = radiusNM * 1852; // Convert NM to meters

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [pointCoords[1], pointCoords[0]], // GeoJSON format: [lng, lat]
      },
      properties: {
        id: n.id || `NOTAM-GEO-${idx}`,
        category: n.category,
        severity: n.severity,
        rawText: n.rawText,
        title: n.title || `${n.category} (${n.severity})`,
        radiusMeters,
        effectiveStatus: n.effectiveStatus,
        effectiveWindow: n.effectiveWindow,
        isFir: n.isFir,
      },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
    airportCenter: center,
  };
}
