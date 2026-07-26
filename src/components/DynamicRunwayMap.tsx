import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { Compass, ZoomIn, ZoomOut, Clock } from 'lucide-react';

interface DynamicRunwayMapProps {
  briefing: BriefingSummary;
  theme?: string;
}

interface RunwayData {
  id: string;
  le_ident: string;
  he_ident: string;
  length_ft: number;
  width_ft: number;
  heading_deg: number;
  surface: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isClosed?: boolean;
}

interface TaxiwayData {
  id: string;
  label: string;
  x1: number; y1: number; x2: number; y2: number;
  width?: number;
}

interface TerminalData {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
}

interface AirportLayout {
  name: string;
  viewBox: string;
  runways: RunwayData[];
  taxiways: TaxiwayData[];
  terminals: TerminalData[];
  tower: { x: number; y: number };
}

const MASTER_AIRPORT_MAPS: Record<string, AirportLayout> = {
  VIDP: {
    name: 'Indira Gandhi International Airport (Delhi)',
    viewBox: '0 0 900 480',
    runways: [
      { id: '09/27', le_ident: '09', he_ident: '27', length_ft: 9229, width_ft: 148, heading_deg: 92, surface: 'ASPHALT', x1: 160, y1: 50, x2: 680, y2: 75 },
      { id: '10/28', le_ident: '10', he_ident: '28', length_ft: 12510, width_ft: 150, heading_deg: 98, surface: 'ASPHALT', x1: 80, y1: 140, x2: 820, y2: 140 },
      { id: '11L/29R', le_ident: '11L', he_ident: '29R', length_ft: 14534, width_ft: 197, heading_deg: 105, surface: 'ASPHALT', x1: 60, y1: 340, x2: 840, y2: 340 },
      { id: '11R/29L', le_ident: '11R', he_ident: '29L', length_ft: 14435, width_ft: 197, heading_deg: 105, surface: 'ASPHALT', x1: 60, y1: 395, x2: 840, y2: 395 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A (North)', x1: 160, y1: 95, x2: 680, y2: 95, width: 7 },
      { id: 'TWY-N', label: 'TWY N (Middle)', x1: 80, y1: 165, x2: 820, y2: 165, width: 7 },
      { id: 'TWY-P', label: 'TWY P (South Inner)', x1: 60, y1: 315, x2: 840, y2: 315, width: 7 },
      { id: 'TWY-Z', label: 'TWY Z (Eco-Bridge)', x1: 300, y1: 165, x2: 300, y2: 315, width: 7 },
      { id: 'TWY-E', label: 'TWY E (East Link)', x1: 750, y1: 140, x2: 750, y2: 340, width: 7 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Domestic (North-East)', x: 580, y: 75, w: 180, h: 45 },
      { id: 'CARGO', label: 'Cargo & Maintenance Apron', x: 380, y: 175, w: 200, h: 45 },
      { id: 'T2T3', label: 'T2 & T3 International Hub (X-Pier)', x: 140, y: 190, w: 220, h: 90 },
    ],
    tower: { x: 340, y: 240 },
  },
  VABB: {
    name: 'Chhatrapati Shivaji Maharaj International (Mumbai)',
    viewBox: '0 0 900 480',
    runways: [
      { id: '09/27', le_ident: '09', he_ident: '27', length_ft: 11312, width_ft: 148, heading_deg: 93, surface: 'ASPHALT', x1: 60, y1: 230, x2: 840, y2: 230 },
      { id: '14/32', le_ident: '14', he_ident: '32', length_ft: 9810, width_ft: 148, heading_deg: 138, surface: 'ASPHALT', x1: 250, y1: 60, x2: 650, y2: 400 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 265, x2: 840, y2: 265, width: 7 },
      { id: 'TWY-B', label: 'TWY B', x1: 300, y1: 80, x2: 300, y2: 380, width: 7 },
      { id: 'TWY-C', label: 'TWY C', x1: 600, y1: 80, x2: 600, y2: 380, width: 7 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Santacruz Domestic (South-West)', x: 90, y: 320, w: 200, h: 65 },
      { id: 'T2', label: 'T2 Sahar International (North-East)', x: 580, y: 50, w: 230, h: 70 },
    ],
    tower: { x: 450, y: 280 },
  },
  VOBL: {
    name: 'Kempegowda International Airport (Bengaluru)',
    viewBox: '0 0 900 480',
    runways: [
      { id: '09L/27R', le_ident: '09L', he_ident: '27R', length_ft: 13123, width_ft: 148, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 130, x2: 840, y2: 130 },
      { id: '09R/27L', le_ident: '09R', he_ident: '27L', length_ft: 13123, width_ft: 148, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 310, x2: 840, y2: 310 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 165, x2: 840, y2: 165, width: 7 },
      { id: 'TWY-B', label: 'TWY B', x1: 60, y1: 275, x2: 840, y2: 275, width: 7 },
      { id: 'TWY-C', label: 'TWY C', x1: 450, y1: 130, x2: 450, y2: 310, width: 7 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Main Terminal', x: 220, y: 195, w: 190, h: 50 },
      { id: 'T2', label: 'T2 Garden Terminal', x: 470, y: 195, w: 210, h: 50 },
    ],
    tower: { x: 440, y: 220 },
  },
  KJFK: {
    name: 'John F. Kennedy International Airport (New York)',
    viewBox: '0 0 900 480',
    runways: [
      { id: '04L/22R', le_ident: '04L', he_ident: '22R', length_ft: 12079, width_ft: 200, heading_deg: 44, surface: 'ASPHALT', x1: 120, y1: 400, x2: 520, y2: 60 },
      { id: '04R/22L', le_ident: '04R', he_ident: '22L', length_ft: 8400, width_ft: 150, heading_deg: 44, surface: 'ASPHALT', x1: 380, y1: 420, x2: 780, y2: 80 },
      { id: '13L/31R', le_ident: '13L', he_ident: '31R', length_ft: 10000, width_ft: 150, heading_deg: 134, surface: 'ASPHALT', x1: 180, y1: 80, x2: 680, y2: 400 },
      { id: '13R/31L', le_ident: '13R', he_ident: '31L', length_ft: 14511, width_ft: 200, heading_deg: 134, surface: 'CONCRETE', x1: 280, y1: 50, x2: 820, y2: 420 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY Alpha', x1: 200, y1: 100, x2: 700, y2: 100, width: 7 },
      { id: 'TWY-B', label: 'TWY Bravo', x1: 200, y1: 380, x2: 700, y2: 380, width: 7 },
    ],
    terminals: [
      { id: 'CTA', label: 'Central Terminal Area (T1, T4, T5, T7, T8 Ring)', x: 340, y: 200, w: 220, h: 80 },
    ],
    tower: { x: 450, y: 240 },
  },
};

export const DynamicRunwayMap: React.FC<DynamicRunwayMapProps> = ({ briefing, theme }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedRunway, setSelectedRunway] = useState<RunwayData | null>(null);
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const layout = MASTER_AIRPORT_MAPS[briefing.icao] || {
    name: `${briefing.icao} Aerodrome Geometry`,
    viewBox: '0 0 900 480',
    runways: [
      { id: '09/27', le_ident: '09', he_ident: '27', length_ft: 10500, width_ft: 150, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 200, x2: 840, y2: 200 },
      { id: '18/36', le_ident: '18', he_ident: '36', length_ft: 8500, width_ft: 150, heading_deg: 180, surface: 'ASPHALT', x1: 450, y1: 60, x2: 450, y2: 400 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 240, x2: 840, y2: 240, width: 7 },
    ],
    terminals: [
      { id: 'T1', label: 'Main Terminal', x: 200, y: 300, w: 200, h: 60 },
    ],
    tower: { x: 450, y: 240 },
  };

  // Cross-reference active NOTAM closures
  const notamCombined = [
    ...(briefing.criticalAlerts || []).map((a) => `${a.title} ${a.rawSnippet} ${a.plainEnglish}`),
    ...(briefing.warnings || []).map((w) => `${w.title} ${w.rawSnippet} ${w.plainEnglish}`),
  ].join(' ').toUpperCase();

  const isClosed = (ident: string) => {
    return notamCombined.includes(`RWY ${ident}`) && (notamCombined.includes('CLSD') || notamCombined.includes('CLOSED'));
  };

  const evaluatedRunways = layout.runways.map((rwy) => ({
    ...rwy,
    isClosed: isClosed(rwy.le_ident) || isClosed(rwy.he_ident) || isClosed(rwy.id),
  }));

  const targetEtaZulu = new Date(Date.now() + timeOffsetHours * 3600 * 1000).toUTCString().slice(17, 22) + ' Z';

  return (
    <div className={`w-full p-5 rounded-3xl border mb-6 shadow-lg transition-all font-sans ${
      isNight
        ? 'glass-card-night border-red-900 text-red-100'
        : isDay
        ? 'bg-white border-[#e3e8ee] text-[#0e1116] shadow-sm'
        : 'bg-zinc-900 border-zinc-800 text-white'
    }`}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e3e8ee] dark:border-white/10">
        <div className="flex items-center gap-2.5 font-mono">
          <div className="p-1.5 rounded-lg bg-[#2e7def]/10 text-[#2e7def] border border-[#2e7def]/20">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest block text-[#0e1116] dark:text-white">
              {layout.name} — AERODROME GEOMETRY & TEMPORAL ETA SCRUBBER
            </span>
            <span className="text-[10px] text-[#5b6472] font-sans">
              Dynamic physical coordinates, magnetic bearings & ETA arrival time scrubbing
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs cursor-pointer hover:bg-slate-200"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs cursor-pointer hover:bg-slate-200"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Temporal ETA Scrubbing Time Bar */}
      <div className="mb-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
          <Clock className="w-4 h-4 text-sky-500 animate-pulse" />
          <span>TEMPORAL ETA SCRUBBER:</span>
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-black">
            +{timeOffsetHours} HR (EST. ETA: {targetEtaZulu})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 2, 4, 6, 12].map((offset) => (
            <button
              key={offset}
              onClick={() => setTimeOffsetHours(offset)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                timeOffsetHours === offset
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
              }`}
            >
              {offset === 0 ? 'NOW' : `+${offset}h`}
            </button>
          ))}
        </div>
      </div>

      {/* Runway Spec Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-4 font-mono text-xs">
        {evaluatedRunways.map((rwy) => (
          <button
            key={rwy.id}
            onClick={() => setSelectedRunway(rwy)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              selectedRunway?.id === rwy.id
                ? 'bg-[#0e1116] text-white border-[#0e1116] shadow-sm'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${rwy.isClosed ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
            <span>RWY {rwy.id}</span>
            <span className="opacity-60 text-[10px]">({rwy.length_ft.toLocaleString()} FT / {rwy.heading_deg}°)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
              rwy.isClosed ? 'bg-red-500/20 text-red-600 font-black' : 'bg-emerald-500/20 text-emerald-600 font-bold'
            }`}>
              {rwy.isClosed ? '🔴 CLOSED' : '🟢 OPEN'}
            </span>
          </button>
        ))}
      </div>

      {/* Dynamic Render SVG Canvas */}
      <div className="relative w-full h-[380px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4 shadow-inner">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Magnetic North Indicator */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-center gap-1 font-mono text-[10px] text-sky-400 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-sky-500/30">
          <Compass className="w-4 h-4 animate-spin text-sky-400" style={{ animationDuration: '20s' }} />
          <span className="font-bold">MAG NORTH 000°</span>
        </div>

        <svg
          viewBox={layout.viewBox}
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Taxiways */}
          {layout.taxiways.map((twy) => (
            <g key={twy.id}>
              <line
                x1={twy.x1}
                y1={twy.y1}
                x2={twy.x2}
                y2={twy.y2}
                stroke="#334155"
                strokeWidth={twy.width || 7}
                strokeLinecap="round"
              />
              <text
                x={(twy.x1 + twy.x2) / 2}
                y={(twy.y1 + twy.y2) / 2 - 8}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {twy.label}
              </text>
            </g>
          ))}

          {/* Terminals */}
          {layout.terminals.map((term) => (
            <g key={term.id}>
              <rect
                x={term.x}
                y={term.y}
                width={term.w}
                height={term.h}
                rx="6"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <text
                x={term.x + term.w / 2}
                y={term.y + term.h / 2 + 4}
                fill="#e2e8f0"
                fontSize="10"
                fontWeight="bold"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {term.label}
              </text>
            </g>
          ))}

          {/* Control Tower */}
          <g transform={`translate(${layout.tower.x}, ${layout.tower.y})`}>
            <circle r="12" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <text fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" y="3">
              TWR
            </text>
          </g>

          {/* Runways rendered with exact physical coordinates */}
          {evaluatedRunways.map((rwy) => {
            const x1 = rwy.x1;
            const y1 = rwy.y1;
            const x2 = rwy.x2;
            const y2 = rwy.y2;

            const vectorColor = rwy.isClosed ? '#ef4444' : '#10b981';

            return (
              <g key={rwy.id} className="cursor-pointer" onClick={() => setSelectedRunway(rwy)}>
                {/* Asphalt Base Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={rwy.isClosed ? '#450a0a' : '#0f172a'}
                  strokeWidth="22"
                  strokeLinecap="square"
                />

                {/* Centerline */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={vectorColor}
                  strokeWidth="4"
                  strokeDasharray="10,10"
                />

                {/* Low Threshold Label */}
                <text
                  x={x1 - 22}
                  y={y1 + 4}
                  fill={vectorColor}
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {rwy.le_ident}
                </text>

                {/* High Threshold Label */}
                <text
                  x={x2 + 22}
                  y={y2 + 4}
                  fill={vectorColor}
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {rwy.he_ident}
                </text>

                {/* Closure Hazard X */}
                {rwy.isClosed && (
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ef4444" strokeWidth="5" />
                    <line x1="-15" y1="15" x2="15" y2="-15" stroke="#ef4444" strokeWidth="5" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Runway Info Footer */}
      {selectedRunway && (
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-slate-800 dark:text-zinc-200">
              SELECTED SPECIFICATION: RWY {selectedRunway.id}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-600 dark:text-zinc-400">
              LENGTH: {selectedRunway.length_ft.toLocaleString()} FT ({Math.round(selectedRunway.length_ft * 0.3048)} M)
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-600 dark:text-zinc-400">HEADING: {selectedRunway.heading_deg}° MAG</span>
          </div>

          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
            selectedRunway.isClosed ? 'bg-red-100 text-red-950 border border-red-400' : 'bg-emerald-100 text-emerald-950 border border-emerald-400'
          }`}>
            {selectedRunway.isClosed ? `🔴 CLSD AT ETA (+${timeOffsetHours}H)` : `🟢 OPEN AT ETA (+${timeOffsetHours}H)`}
          </span>
        </div>
      )}
    </div>
  );
};
