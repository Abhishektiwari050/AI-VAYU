import { normalizeAirportCode } from './airportData';

export interface ParsedRouteWaypoint {
  identifier: string;
  icao: string;
  name?: string;
  type?: 'AIRPORT' | 'NDB' | 'VOR' | 'WAYPOINT' | 'USER';
  lat?: number;
  lon?: number;
  altitudeFt?: number;
}

export interface ParsedFlightPlan {
  fileName: string;
  routeName: string;
  originIcao: string;
  destinationIcao: string;
  waypointIcaos: string[];
  allPoints: ParsedRouteWaypoint[];
  totalDistanceNm?: number;
  formatType: 'FPL_GARMIN' | 'GPX' | 'ICAO_STRING';
}

/**
 * Main Flight Plan Route File Parser
 * Supports ForeFlight / Garmin .fpl (XML) and standard .gpx files
 */
export function parseFlightPlanFile(fileContent: string, fileName: string): ParsedFlightPlan {
  const cleanContent = fileContent.trim();
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.fpl') || cleanContent.includes('<flight-plan') || cleanContent.includes('garmin.com/fpl')) {
    return parseFplXml(cleanContent, fileName);
  } else if (lowerName.endsWith('.gpx') || cleanContent.includes('<gpx')) {
    return parseGpxXml(cleanContent, fileName);
  } else {
    // Try plain text ICAO string fallback (e.g. "KDFW KOKC KICT KDEN")
    return parsePlainIcaoRoute(cleanContent, fileName);
  }
}

/**
 * Parser for Garmin / ForeFlight .fpl XML format
 */
function parseFplXml(xmlString: string, fileName: string): ParsedFlightPlan {
  const points: ParsedRouteWaypoint[] = [];
  let routeName = 'ForeFlight Flight Plan';

  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Extract route name
      const nameNode = xmlDoc.querySelector('route-name, name');
      if (nameNode && nameNode.textContent) {
        routeName = nameNode.textContent.trim();
      }

      // Extract waypoints from waypoint-table or route
      const waypoints = xmlDoc.querySelectorAll('waypoint, way-point, route-point');
      
      waypoints.forEach((wp) => {
        const id = wp.querySelector('identifier, id, name')?.textContent?.trim() || '';
        const typeStr = wp.querySelector('type, waypoint-type')?.textContent?.trim()?.toUpperCase() || 'WAYPOINT';
        const latStr = wp.querySelector('lat, latitude')?.textContent?.trim();
        const lonStr = wp.querySelector('lon, longitude')?.textContent?.trim();
        const altStr = wp.querySelector('elevation, altitude')?.textContent?.trim();

        if (id) {
          const normIcao = normalizeAirportCode(id) || (id.length === 4 ? id.toUpperCase() : id.toUpperCase());
          points.push({
            identifier: id.toUpperCase(),
            icao: normIcao,
            name: wp.querySelector('comment, name')?.textContent?.trim() || id,
            type: typeStr.includes('AIRPORT') ? 'AIRPORT' : 'WAYPOINT',
            lat: latStr ? parseFloat(latStr) : undefined,
            lon: lonStr ? parseFloat(lonStr) : undefined,
            altitudeFt: altStr ? parseFloat(altStr) : undefined,
          });
        }
      });
    }
  } catch (err) {
    console.warn('[RouteParser] DOMParser error on .fpl, using regex scanner fallback:', err);
  }

  // Regex fallback if DOMParser extracted zero points
  if (points.length === 0) {
    const waypointRegex = /<identifier>([^<]+)<\/identifier>/gi;
    let match;
    while ((match = waypointRegex.exec(xmlString)) !== null) {
      const id = match[1].trim().toUpperCase();
      const normIcao = normalizeAirportCode(id) || id;
      points.push({
        identifier: id,
        icao: normIcao,
      });
    }
  }

  return formatParsedFlightPlan(points, routeName, fileName, 'FPL_GARMIN');
}

/**
 * Parser for GPX (GPS Exchange Format) route files
 */
function parseGpxXml(xmlString: string, fileName: string): ParsedFlightPlan {
  const points: ParsedRouteWaypoint[] = [];
  let routeName = 'GPX Route Corridor';

  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      const nameNode = xmlDoc.querySelector('rte > name, trk > name, gpx > name');
      if (nameNode && nameNode.textContent) {
        routeName = nameNode.textContent.trim();
      }

      // Query rtept, wpt, or trkpt
      const routePoints = xmlDoc.querySelectorAll('rtept, wpt, trkpt');
      routePoints.forEach((pt) => {
        const name = pt.querySelector('name, sym, desc')?.textContent?.trim() || '';
        const lat = pt.getAttribute('lat');
        const lon = pt.getAttribute('lon');
        const ele = pt.querySelector('ele')?.textContent?.trim();

        const id = name || 'WPT';
        const normIcao = normalizeAirportCode(id) || (id.length === 4 ? id.toUpperCase() : id.toUpperCase());

        points.push({
          identifier: id.toUpperCase(),
          icao: normIcao,
          name: name || id,
          lat: lat ? parseFloat(lat) : undefined,
          lon: lon ? parseFloat(lon) : undefined,
          altitudeFt: ele ? Math.round(parseFloat(ele) * 3.28084) : undefined,
        });
      });
    }
  } catch (err) {
    console.warn('[RouteParser] GPX DOMParser error, using regex scanner fallback:', err);
  }

  if (points.length === 0) {
    const nameRegex = /<name>([^<]+)<\/name>/gi;
    let match;
    while ((match = nameRegex.exec(xmlString)) !== null) {
      const id = match[1].trim().toUpperCase();
      if (id && id.length >= 3 && id.length <= 5) {
        points.push({
          identifier: id,
          icao: normalizeAirportCode(id) || id,
        });
      }
    }
  }

  return formatParsedFlightPlan(points, routeName, fileName, 'GPX');
}

/**
 * Parser for plain text ICAO string routes (e.g. "KDFW KOKC KICT KDEN")
 */
function parsePlainIcaoRoute(text: string, fileName: string): ParsedFlightPlan {
  const tokens = text.split(/[\s,;->]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
  const points: ParsedRouteWaypoint[] = [];

  tokens.forEach((t) => {
    const clean = normalizeAirportCode(t) || t;
    points.push({
      identifier: t,
      icao: clean,
    });
  });

  return formatParsedFlightPlan(points, 'Custom Waypoint Corridor', fileName, 'ICAO_STRING');
}

/**
 * Standardize and filter extracted waypoints into departure, en-route, and arrival ICAOs
 */
function formatParsedFlightPlan(
  points: ParsedRouteWaypoint[],
  defaultRouteName: string,
  fileName: string,
  formatType: ParsedFlightPlan['formatType']
): ParsedFlightPlan {
  if (points.length === 0) {
    // Default fallback route if file was empty or unparseable
    return {
      fileName,
      routeName: 'Default Corridor (KDFW - KDEN)',
      originIcao: 'KDFW',
      destinationIcao: 'KDEN',
      waypointIcaos: ['KOKC', 'KICT'],
      allPoints: [],
      formatType,
    };
  }

  const originIcao = points[0].icao;
  const destinationIcao = points[points.length - 1].icao;

  const waypointIcaos: string[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    if (points[i].icao && !waypointIcaos.includes(points[i].icao)) {
      waypointIcaos.push(points[i].icao);
    }
  }

  return {
    fileName,
    routeName: defaultRouteName,
    originIcao,
    destinationIcao,
    waypointIcaos,
    allPoints: points,
    formatType,
  };
}
