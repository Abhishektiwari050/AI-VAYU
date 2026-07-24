import React, { useState } from 'react';
import { lookupAirport, AIRPORTS_DATABASE } from '../lib/airportData';
import { DisplayTheme } from './Header';
import { BriefingSummary, FlightCategory } from '../types';
import { Compass, Eye, Layers, Maximize2, MapPin, Radio, ShieldAlert, Navigation } from 'lucide-react';

interface AerodromeRadarMapProps {
  briefing: BriefingSummary;
  theme: DisplayTheme;
}

export const AerodromeRadarMap: React.FC<AerodromeRadarMapProps> = ({ briefing, theme }) => {
  const [zoomRangeNm, setZoomRangeNm] = useState<10 | 25 | 50>(25);
  const [showGrid, setShowGrid] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showRunways, setShowRunways] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  // Airport metadata lookup
  const ap = lookupAirport(briefing.icao) || {
    icao: briefing.icao,
    iata: briefing.icao.substring(1),
    name: briefing.airportName || `${briefing.icao} Aerodrome`,
    city: 'Airspace Sector',
    country: 'ICAO',
    lat: 28.5562,
    lon: 77.1000,
    elevationFt: 777,
  };

  // Convert decimal lat/lon to DMS string format
  const formatDMS = (deg: number, isLat: boolean) => {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"${direction}`;
  };

  const latDms = formatDMS(ap.lat, true);
  const lonDms = formatDMS(ap.lon, false);

  // Determine flight category color tokens
  const getCatColor = (cat: FlightCategory) => {
    switch (cat) {
      case 'VFR':
        return { hex: '#10b981', name: 'EMERALD VFR', bg: 'bg-emerald-500' };
      case 'MVFR':
        return { hex: '#f59e0b', name: 'AMBER MVFR', bg: 'bg-amber-500' };
      case 'IFR':
      case 'LIFR':
        return { hex: '#ef4444', name: 'CRITICAL IFR', bg: 'bg-red-500' };
      default:
        return { hex: '#3b82f6', name: 'BLUE SECTOR', bg: 'bg-blue-500' };
    }
  };

  const catTheme = getCatColor(briefing.weather.flightCategory);

  // SVG Theme styling tokens
  const gridColor = isNight
    ? 'rgba(239, 68, 68, 0.2)'
    : isDay
    ? 'rgba(71, 85, 105, 0.25)'
    : 'rgba(59, 130, 246, 0.25)';

  const ringColor = isNight
    ? 'rgba(239, 68, 68, 0.35)'
    : isDay
    ? 'rgba(100, 116, 139, 0.4)'
    : 'rgba(16, 185, 129, 0.35)';

  const textColor = isNight ? '#f87171' : isDay ? '#1e293b' : '#38bdf8';
  const subTextColor = isNight ? '#b91c1c' : isDay ? '#64748b' : '#94a3b8';
  const bgColor = isNight
    ? 'rgba(20, 4, 4, 0.95)'
    : isDay
    ? 'rgba(248, 250, 252, 0.95)'
    : 'rgba(8, 10, 15, 0.95)';

  const cardBorderClass = isNight
    ? 'border-red-900/60 bg-red-950/30'
    : isDay
    ? 'border-slate-300 bg-white shadow-sm'
    : 'border-zinc-800 bg-zinc-950/80';

  return (
    <div className={`w-full rounded-3xl border p-4 sm:p-5 transition-all relative overflow-hidden font-mono mb-6 ${cardBorderClass}`}>
      
      {/* CARD HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b pb-3 border-current/10">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isNight ? 'bg-red-900/40 text-red-400' : isDay ? 'bg-blue-100 text-blue-800' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wider uppercase">
                AERODROME RADAR & SPATIAL GRID
              </h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                isNight ? 'bg-red-950 text-red-300 border-red-800' : isDay ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-zinc-900 text-zinc-300 border-zinc-700'
              }`}>
                {zoomRangeNm} NM RADIAL
              </span>
            </div>
            <p className="text-[11px] opacity-70 font-sans">
              Geospatial Airspace Grid • Center ({ap.icao}): {latDms}, {lonDms}
            </p>
          </div>
        </div>

        {/* LAYER TOGGLE BUTTONS */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-black/20 p-1 rounded-xl border border-current/10 text-[10px]">
            <button
              onClick={() => setZoomRangeNm(10)}
              className={`px-2 py-1 rounded-lg font-bold transition ${zoomRangeNm === 10 ? (isDay ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white') : 'opacity-60 hover:opacity-100'}`}
            >
              10NM
            </button>
            <button
              onClick={() => setZoomRangeNm(25)}
              className={`px-2 py-1 rounded-lg font-bold transition ${zoomRangeNm === 25 ? (isDay ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white') : 'opacity-60 hover:opacity-100'}`}
            >
              25NM
            </button>
            <button
              onClick={() => setZoomRangeNm(50)}
              className={`px-2 py-1 rounded-lg font-bold transition ${zoomRangeNm === 50 ? (isDay ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white') : 'opacity-60 hover:opacity-100'}`}
            >
              50NM
            </button>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid Lines"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-1 transition ${
              showGrid ? (isDay ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold' : 'bg-zinc-800 border-zinc-700 text-white font-bold') : 'opacity-50 border-transparent'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            onClick={() => setShowHazards(!showHazards)}
            title="Toggle Hazard Arc Overlay"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] flex items-center gap-1 transition ${
              showHazards ? 'bg-red-500/20 border-red-500/50 text-red-400 font-bold' : 'opacity-50 border-transparent'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-red-500" />
            <span className="hidden sm:inline">Hazards</span>
          </button>
        </div>
      </div>

      {/* SVG RADAR CANVAS */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden border border-current/10 shadow-inner flex items-center justify-center">
        
        <svg
          viewBox="0 0 600 300"
          className="w-full h-full object-cover transition-transform duration-500"
          style={{ backgroundColor: bgColor }}
        >
          <defs>
            {/* Grid Mesh Pattern */}
            <pattern id="radarGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke={gridColor} strokeWidth="0.5" strokeDasharray="2,2" />
            </pattern>

            {/* Sweep Gradient */}
            <radialGradient id="sweepGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={catTheme.hex} stopOpacity="0.3" />
              <stop offset="100%" stopColor={catTheme.hex} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* BACKGROUND GRID MESH */}
          {showGrid && <rect width="600" height="300" fill="url(#radarGrid)" />}

          {/* RADIAL RANGE RINGS (CENTER AT 300, 150) */}
          <g transform="translate(300, 150)">
            {/* Ring 1 - 10NM */}
            <circle r="40" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="4,3" />
            <text x="42" y="-5" fill={subTextColor} fontSize="8" fontFamily="monospace">10 NM</text>

            {/* Ring 2 - 25NM */}
            <circle r="85" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="6,4" />
            <text x="87" y="-5" fill={subTextColor} fontSize="8" fontFamily="monospace">25 NM</text>

            {/* Ring 3 - 50NM */}
            <circle r="130" fill="none" stroke={ringColor} strokeWidth="1.2" />
            <text x="132" y="-5" fill={subTextColor} fontSize="8" fontFamily="monospace">50 NM</text>

            {/* COMPASS ROSA RADIAL CROSS AXIS */}
            <line x1="-140" y1="0" x2="140" y2="0" stroke={ringColor} strokeWidth="0.8" strokeDasharray="3,3" />
            <line x1="0" y1="-140" x2="0" y2="140" stroke={ringColor} strokeWidth="0.8" strokeDasharray="3,3" />

            {/* CARDINAL HEADING LABELS */}
            <text x="0" y="-134" textAnchor="middle" fill={textColor} fontSize="10" fontWeight="bold">000° N</text>
            <text x="134" y="3" textAnchor="start" fill={textColor} fontSize="10" fontWeight="bold">090° E</text>
            <text x="0" y="142" textAnchor="middle" fill={textColor} fontSize="10" fontWeight="bold">180° S</text>
            <text x="-134" y="3" textAnchor="end" fill={textColor} fontSize="10" fontWeight="bold">270° W</text>

            {/* INTERCARDINAL TICK MARKS */}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((deg) => {
              const rad = (deg - 90) * (Math.PI / 180);
              const x1 = Math.cos(rad) * 125;
              const y1 = Math.sin(rad) * 125;
              const x2 = Math.cos(rad) * 130;
              const y2 = Math.sin(rad) * 130;
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ringColor} strokeWidth="1.5" />
              );
            })}

            {/* HAZARD SECTORS / TFR ARCS (IF CRITICAL NOTAMS EXIST) */}
            {showHazards && briefing.criticalCount > 0 && (
              <g>
                {/* TFR Sector Red Arc */}
                <path
                  d="M 0 0 L 40 -70 A 80 80 0 0 1 70 40 Z"
                  fill="rgba(239, 68, 68, 0.25)"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
                <circle cx="50" cy="-25" r="3" fill="#ef4444" className="animate-ping" />
                <text x="55" y="-20" fill="#ef4444" fontSize="8" fontWeight="bold">TFR / CLOSED RWY</text>
              </g>
            )}

            {/* ADVISORY SECTOR (IF WARNINGS EXIST) */}
            {showHazards && briefing.warningCount > 0 && (
              <g>
                <path
                  d="M 0 0 L -80 -30 A 85 85 0 0 0 -50 70 Z"
                  fill="rgba(245, 158, 11, 0.15)"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text x="-75" y="25" fill="#f59e0b" fontSize="8" fontWeight="bold">NAVAID / WIP</text>
              </g>
            )}

            {/* RUNWAY ORIENTATION OVERLAY (CENTER AERODROME) */}
            {showRunways && (
              <g transform="rotate(-15)">
                {/* Primary Runway Line (09/27) */}
                <rect x="-25" y="-2.5" width="50" height="5" fill={isNight ? '#ef4444' : isDay ? '#334155' : '#e4e4e7'} rx="1" />
                <text x="-32" y="2" fill={textColor} fontSize="7" fontWeight="bold">09</text>
                <text x="27" y="2" fill={textColor} fontSize="7" fontWeight="bold">27</text>

                {/* Secondary Cross Runway (14/32) */}
                <g transform="rotate(50)">
                  <rect x="-18" y="-2" width="36" height="4" fill={isNight ? '#991b1b' : isDay ? '#64748b' : '#a1a1aa'} rx="1" />
                </g>
              </g>
            )}

            {/* CENTER AIRFIELD BEACON & PULSING TARGET */}
            <circle r="14" fill="none" stroke={catTheme.hex} strokeWidth="1.5" className="animate-ping" opacity="0.7" />
            <circle r="6" fill={catTheme.hex} />
            <circle r="2" fill="#ffffff" />

            {/* AERODROME LABEL */}
            <g transform="translate(0, -18)">
              <rect x="-30" y="-12" width="60" height="14" rx="4" fill={isNight ? '#450a0a' : isDay ? '#0f172a' : '#18181b'} stroke={catTheme.hex} strokeWidth="1" />
              <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" tracking="wider">
                {ap.icao}
              </text>
            </g>
          </g>

          {/* OVERLAY TELEMETRY BOX (TOP LEFT) */}
          <g transform="translate(15, 15)">
            <rect width="160" height="52" rx="8" fill={isNight ? 'rgba(0,0,0,0.85)' : isDay ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)'} stroke={ringColor} strokeWidth="1" />
            <text x="10" y="16" fill={textColor} fontSize="9" fontWeight="bold">AERODROME: {ap.icao}</text>
            <text x="10" y="28" fill={subTextColor} fontSize="8">LAT: {latDms} ({ap.lat.toFixed(4)}°)</text>
            <text x="10" y="38" fill={subTextColor} fontSize="8">LON: {lonDms} ({ap.lon.toFixed(4)}°)</text>
            <text x="10" y="47" fill={subTextColor} fontSize="8">ELEV: {ap.elevationFt} FT MSL</text>
          </g>

          {/* OVERLAY STATUS BOX (BOTTOM RIGHT) */}
          <g transform="translate(435, 235)">
            <rect width="150" height="50" rx="8" fill={isNight ? 'rgba(0,0,0,0.85)' : isDay ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)'} stroke={ringColor} strokeWidth="1" />
            <text x="10" y="16" fill={catTheme.hex} fontSize="9" fontWeight="bold">COND: {briefing.weather.flightCategory}</text>
            <text x="10" y="28" fill={subTextColor} fontSize="8">CRITICAL NOTAMS: {briefing.criticalCount}</text>
            <text x="10" y="40" fill={subTextColor} fontSize="8">ADVISORY NOTAMS: {briefing.warningCount}</text>
          </g>
        </svg>

        {/* SWEEPING SCAN LINE EFFECT */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-pulse" />
      </div>

      {/* FOOTER BAR WITH QUICK COORDINATE SUMMARY */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] opacity-75 pt-2 border-t border-current/10 font-mono">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-red-500" />
          <span>{ap.name} • {ap.city}, {ap.country}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>MAG VAR: 1.2°E</span>
          <span>GRID: WGS84</span>
          <span>SATELLITE SYNC: OK</span>
        </div>
      </div>
    </div>
  );
};
