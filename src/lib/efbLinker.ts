// VAYU EFB Deep-Link Exporter
// Direct integration for ForeFlight & SkyDemon URL Schemes

export interface EfbRouteParams {
  origin: string;
  destination?: string;
  waypoints?: string[];
}

/**
 * Formats route array into ForeFlight mobile app deep-link scheme:
 * foreflight://redflt?route=KJFK%20KORD
 */
export function generateForeFlightUrl(params: EfbRouteParams): string {
  const routeParts: string[] = [params.origin.toUpperCase()];
  if (params.waypoints && params.waypoints.length > 0) {
    routeParts.push(...params.waypoints.map(w => w.toUpperCase()));
  }
  if (params.destination) {
    routeParts.push(params.destination.toUpperCase());
  }

  const routeString = routeParts.join(' ');
  return `foreflight://redflt?route=${encodeURIComponent(routeString)}`;
}

/**
 * Formats route array into SkyDemon mobile app deep-link scheme:
 * skydemon://flightplan?route=EGLL%20EGCC
 */
export function generateSkyDemonUrl(params: EfbRouteParams): string {
  const routeParts: string[] = [params.origin.toUpperCase()];
  if (params.waypoints && params.waypoints.length > 0) {
    routeParts.push(...params.waypoints.map(w => w.toUpperCase()));
  }
  if (params.destination) {
    routeParts.push(params.destination.toUpperCase());
  }

  const routeString = routeParts.join('-');
  return `skydemon://flightplan?route=${encodeURIComponent(routeString)}`;
}

/**
 * Triggers native app deep-link with fallback grace
 */
export function openInForeFlight(params: EfbRouteParams): void {
  const url = generateForeFlightUrl(params);
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}

export function openInSkyDemon(params: EfbRouteParams): void {
  const url = generateSkyDemonUrl(params);
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}
