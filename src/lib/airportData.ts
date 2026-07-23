export interface AirportInfo {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  elevationFt: number;
  popular?: boolean;
}

export const AIRPORTS_DATABASE: AirportInfo[] = [
  // US & Global Major Hubs
  { icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'US', lat: 40.6398, lon: -73.7789, elevationFt: 13, popular: true },
  { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.9425, lon: -118.4081, elevationFt: 128, popular: true },
  { icao: 'KORD', iata: 'ORD', name: 'Chicago O\'Hare Intl', city: 'Chicago', country: 'US', lat: 41.9742, lon: -87.9073, elevationFt: 668, popular: true },
  { icao: 'KSFO', iata: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', lat: 37.6189, lon: -122.3750, elevationFt: 13, popular: true },
  { icao: 'KBOS', iata: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'US', lat: 42.3643, lon: -71.0052, elevationFt: 19, popular: true },
  { icao: 'KDEN', iata: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'US', lat: 39.8561, lon: -104.6737, elevationFt: 5431, popular: true },
  { icao: 'KDFW', iata: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', country: 'US', lat: 32.8998, lon: -97.0403, elevationFt: 607, popular: true },
  { icao: 'KMIA', iata: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'US', lat: 25.7959, lon: -80.2870, elevationFt: 8, popular: true },
  { icao: 'KSEA', iata: 'SEA', name: 'Seattle-Tacoma Intl', city: 'Seattle', country: 'US', lat: 47.4502, lon: -122.3088, elevationFt: 433, popular: true },
  { icao: 'EGLL', iata: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lon: -0.4543, elevationFt: 83, popular: true },
  { icao: 'LFPG', iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lon: 2.5479, elevationFt: 392, popular: true },
  { icao: 'EHAM', iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lon: 4.7683, elevationFt: -11, popular: true },
  { icao: 'RJTT', iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lon: 139.7798, elevationFt: 35, popular: true },
  { icao: 'OMDB', iata: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.2532, lon: 55.3657, elevationFt: 62, popular: true },

  // Indian Airspace Hubs
  { icao: 'VIDP', iata: 'DEL', name: 'Indira Gandhi Intl', city: 'New Delhi', country: 'IN', lat: 28.5562, lon: 77.1000, elevationFt: 777, popular: true },
  { icao: 'VABB', iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'IN', lat: 19.0896, lon: 72.8656, elevationFt: 37, popular: true },
  { icao: 'VOBL', iata: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', country: 'IN', lat: 13.1986, lon: 77.7066, elevationFt: 3000, popular: true },
  { icao: 'VOHS', iata: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', country: 'IN', lat: 17.2403, lon: 78.4294, elevationFt: 2021, popular: true },
  { icao: 'VOMM', iata: 'MAA', name: 'Chennai Intl', city: 'Chennai', country: 'IN', lat: 12.9941, lon: 80.1709, elevationFt: 52, popular: true },
  { icao: 'VECC', iata: 'CCU', name: 'Netaji Subhash Chandra Bose Intl', city: 'Kolkata', country: 'IN', lat: 22.6547, lon: 88.4467, elevationFt: 16, popular: true },
  { icao: 'VOGO', iata: 'GOI', name: 'Dabolim Airport', city: 'Goa', country: 'IN', lat: 15.3808, lon: 73.8314, elevationFt: 184, popular: false },
  { icao: 'VDGO', iata: 'GOX', name: 'Manohar Intl Airport', city: 'Mopa Goa', country: 'IN', lat: 15.7686, lon: 73.8643, elevationFt: 550, popular: true },
  { icao: 'VAAH', iata: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad', country: 'IN', lat: 23.0772, lon: 72.6347, elevationFt: 189, popular: false },
  { icao: 'VOCI', iata: 'COK', name: 'Cochin Intl', city: 'Kochi', country: 'IN', lat: 10.1520, lon: 76.4019, elevationFt: 30, popular: false },
  { icao: 'VAPO', iata: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'IN', lat: 18.5822, lon: 73.9197, elevationFt: 1942, popular: false },
  { icao: 'VOTV', iata: 'TRV', name: 'Thiruvananthapuram Intl', city: 'Trivandrum', country: 'IN', lat: 8.4821, lon: 76.9200, elevationFt: 15, popular: false },
];

export function normalizeAirportCode(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const code = input.trim().toUpperCase();
  if (!code) return null;

  // Major Indian Hub Mappings (IATA -> ICAO)
  const indianAirports: Record<string, string> = {
    DEL: "VIDP", // Indira Gandhi Intl (Delhi)
    BOM: "VABB", // Chhatrapati Shivaji Maharaj Intl (Mumbai)
    BLR: "VOBL", // Kempegowda Intl (Bengaluru)
    HYD: "VOHS", // Rajiv Gandhi Intl (Hyderabad)
    MAA: "VOMM", // Chennai Intl
    CCU: "VECC", // Netaji Subhash Chandra Bose Intl (Kolkata)
    GOI: "VOGO", // Dabolim (Goa)
    GOX: "VDGO", // Manohar Intl (Mopa Goa)
    AMD: "VAAH", // Sardar Vallabhbhai Patel (Ahmedabad)
    COK: "VOCI", // Cochin Intl
    PNQ: "VAPO", // Pune Airport
    TRV: "VOTV", // Thiruvananthapuram Intl
  };

  if (indianAirports[code]) return indianAirports[code];

  // Direct match in database
  const found = AIRPORTS_DATABASE.find(a => a.icao === code || a.iata === code);
  if (found) {
    return found.icao;
  }

  // 4-letter standard ICAO code (e.g., VIDP, VABB, KJFK, EGLL, LFPG)
  if (code.length === 4 && /^[A-Z0-9]{4}$/.test(code)) {
    return code;
  }

  // 3-letter North American / FAA fallback
  if (code.length === 3 && /^[A-Z]{3}$/.test(code)) {
    return `K${code}`;
  }

  return null;
}

export function lookupAirport(code: string): AirportInfo | undefined {
  if (!code) return undefined;
  const normalized = normalizeAirportCode(code) || code.trim().toUpperCase();
  return AIRPORTS_DATABASE.find(a => a.icao === normalized || a.iata === normalized || a.icao === code.trim().toUpperCase());
}

export const PRESET_ROUTES = [
  { name: 'India Metro Trunk Route', origin: 'VIDP', destination: 'VOBL', waypoints: ['VABB'] },
  { name: 'US East Coast Commute', origin: 'KJFK', destination: 'KBOS', waypoints: ['KPVD'] },
  { name: 'California Corridor', origin: 'KLAX', destination: 'KSFO', waypoints: ['KSJC'] },
  { name: 'European Short-Haul', origin: 'EGLL', destination: 'EHAM', waypoints: [] },
];
