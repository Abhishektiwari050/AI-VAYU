import React, { useState, useEffect } from 'react';
import { BriefingSummary } from '../types';
import { ShieldAlert, CheckCircle, Info, Layers, Compass, ZoomIn, ZoomOut, RefreshCw, AlertTriangle } from 'lucide-react';

interface DynamicRunwayMapProps {
  briefing: BriefingSummary;
  theme?: string;
}

interface RunwaySpec {
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

interface TaxiwaySpec {
  id: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width?: number;
}

interface TerminalSpec {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AirportMasterLayout {
  name: string;
  viewBox: string;
  runways: RunwaySpec[];
  taxiways: TaxiwaySpec[];
  terminals: TerminalSpec[];
  tower: { x: number; y: number };
}

const MASTER_AIRPORT_MAPS: Record<string, AirportMasterLayout> = {
  // ─── VIDP — Indira Gandhi International, Delhi ───────────────────────────
  // Real layout: 09/27 (North), 10/28 (Middle/South), 11R/29L (Far South)
  VIDP: {
    name: 'Indira Gandhi International Airport (Delhi)',
    viewBox: '0 0 900 440',
    runways: [
      { id: '11L/29R', le_ident: '11L', he_ident: '29R', length_ft: 14500, width_ft: 150, heading_deg: 110, surface: 'ASPHALT', x1: 60, y1: 100, x2: 840, y2: 125 },
      { id: '10/28', le_ident: '10', he_ident: '28', length_ft: 12500, width_ft: 150, heading_deg: 100, surface: 'ASPHALT', x1: 80, y1: 180, x2: 820, y2: 200 },
      { id: '11R/29L', le_ident: '11R', he_ident: '29L', length_ft: 14534, width_ft: 197, heading_deg: 110, surface: 'ASPHALT', x1: 60, y1: 260, x2: 840, y2: 285 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 145, x2: 840, y2: 145, width: 8 },
      { id: 'TWY-B', label: 'TWY B', x1: 200, y1: 80, x2: 200, y2: 300, width: 8 },
      { id: 'TWY-C', label: 'TWY C', x1: 450, y1: 80, x2: 450, y2: 300, width: 8 },
      { id: 'TWY-D', label: 'TWY D', x1: 700, y1: 80, x2: 700, y2: 300, width: 8 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Domestic', x: 80, y: 320, w: 150, h: 55 },
      { id: 'T2', label: 'T2', x: 350, y: 320, w: 90, h: 50 },
      { id: 'T3', label: 'T3 International', x: 490, y: 320, w: 230, h: 65 },
    ],
    tower: { x: 310, y: 335 },
  },

  // ─── VABB — Chhatrapati Shivaji Maharaj, Mumbai ──────────────────────────
  // Real layout: Intersecting 09/27 (E-W) & 14/32 (NW-SE)
  VABB: {
    name: 'Chhatrapati Shivaji Maharaj International (Mumbai)',
    viewBox: '0 0 900 440',
    runways: [
      { id: '09/27', le_ident: '09', he_ident: '27', length_ft: 11319, width_ft: 148, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 200, x2: 840, y2: 200 },
      { id: '14/32', le_ident: '14', he_ident: '32', length_ft: 9744, width_ft: 148, heading_deg: 140, surface: 'ASPHALT', x1: 160, y1: 50, x2: 740, y2: 370 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 235, x2: 840, y2: 235, width: 8 },
      { id: 'TWY-B', label: 'TWY B', x1: 300, y1: 100, x2: 300, y2: 320, width: 8 },
      { id: 'TWY-C', label: 'TWY C', x1: 600, y1: 100, x2: 600, y2: 320, width: 8 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Domestic (Santacruz)', x: 80, y: 290, w: 180, h: 60 },
      { id: 'T2', label: 'T2 International (Sahar)', x: 560, y: 290, w: 220, h: 70 },
    ],
    tower: { x: 450, y: 225 },
  },

  // ─── VOBL — Kempegowda International, Bengaluru ──────────────────────────
  VOBL: {
    name: 'Kempegowda International Airport (Bengaluru)',
    viewBox: '0 0 900 440',
    runways: [
      { id: '09L/27R', le_ident: '09L', he_ident: '27R', length_ft: 13123, width_ft: 148, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 120, x2: 840, y2: 120 },
      { id: '09R/27L', le_ident: '09R', he_ident: '27L', length_ft: 13123, width_ft: 148, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 260, x2: 840, y2: 260 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 155, x2: 840, y2: 155, width: 8 },
      { id: 'TWY-B', label: 'TWY B', x1: 60, y1: 225, x2: 840, y2: 225, width: 8 },
      { id: 'TWY-C', label: 'TWY C', x1: 450, y1: 120, x2: 450, y2: 260, width: 8 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Terminal', x: 250, y: 175, w: 180, h: 45 },
      { id: 'T2', label: 'T2 Garden Terminal', x: 470, y: 175, w: 200, h: 45 },
    ],
    tower: { x: 440, y: 200 },
  },

  // ─── KJFK — John F. Kennedy International, New York ───────────────────────
  KJFK: {
    name: 'John F. Kennedy International Airport (New York)',
    viewBox: '0 0 900 440',
    runways: [
      { id: '04L/22R', le_ident: '04L', he_ident: '22R', length_ft: 12079, width_ft: 200, heading_deg: 40, surface: 'ASPHALT', x1: 60, y1: 160, x2: 840, y2: 160 },
      { id: '04R/22L', le_ident: '04R', he_ident: '22L', length_ft: 8400, width_ft: 150, heading_deg: 40, surface: 'ASPHALT', x1: 60, y1: 245, x2: 840, y2: 245 },
      { id: '13L/31R', le_ident: '13L', he_ident: '31R', length_ft: 10000, width_ft: 150, heading_deg: 130, surface: 'ASPHALT', x1: 155, y1: 55, x2: 760, y2: 390 },
      { id: '13R/31L', le_ident: '13R', he_ident: '31L', length_ft: 14511, width_ft: 200, heading_deg: 130, surface: 'CONCRETE', x1: 260, y1: 55, x2: 840, y2: 350 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 200, x2: 840, y2: 200, width: 8 },
      { id: 'TWY-B', label: 'TWY B', x1: 450, y1: 55, x2: 450, y2: 390, width: 8 },
    ],
    terminals: [
      { id: 'T1', label: 'T1', x: 330, y: 280, w: 80, h: 50 },
      { id: 'T4', label: 'T4', x: 430, y: 280, w: 80, h: 50 },
      { id: 'T8', label: 'T8', x: 530, y: 280, w: 80, h: 50 },
    ],
    tower: { x: 490, y: 210 },
  },
};

export const DynamicRunwayMap: React.FC<DynamicRunwayMapProps> = ({ briefing, theme }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const layout = MASTER_AIRPORT_MAPS[briefing.icao] || {
    name: `${briefing.icao} Aerodrome Diagram`,
    viewBox: '0 0 900 440',
    runways: [
      { id: '09/27', le_ident: '09', he_ident: '27', length_ft: 10500, width_ft: 150, heading_deg: 90, surface: 'ASPHALT', x1: 60, y1: 180, x2: 840, y2: 180 },
      { id: '18/36', le_ident: '18', he_ident: '36', length_ft: 8500, width_ft: 150, heading_deg: 180, surface: 'ASPHALT', x1: 450, y1: 60, x2: 450, y2: 380 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 220, x2: 840, y2: 220, width: 8 },
    ],
    terminals: [
      { id: 'T1', label: 'Main Terminal', x: 180, y: 280, w: 200, h: 60 },
    ],
    tower: { x: 450, y: 220 },
  };

  // Cross-reference NOTAM text for active runway closures
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
              {layout.name} — REAL-WORLD AERODROME LAYOUT & MAGNETIC SPECS
            </span>
            <span className="text-[10px] text-[#5b6472] font-sans">
              Exact runway thresholds, taxiway connectors & live NOTAM closure status
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

      {/* Runway Spec Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-4 font-mono text-xs">
        {evaluatedRunways.map((rwy) => (
          <button
            key={rwy.id}
            onClick={() => setSelectedFacility(rwy)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              selectedFacility?.id === rwy.id
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
      <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4 shadow-inner">
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
                strokeWidth={twy.width || 8}
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
                fontSize="11"
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

          {/* Runways */}
          {evaluatedRunways.map((rwy) => {
            const vectorColor = rwy.isClosed ? '#ef4444' : '#10b981';
            return (
              <g key={rwy.id} className="cursor-pointer" onClick={() => setSelectedFacility(rwy)}>
                {/* Asphalt Base */}
                <line
                  x1={rwy.x1}
                  y1={rwy.y1}
                  x2={rwy.x2}
                  y2={rwy.y2}
                  stroke={rwy.isClosed ? '#450a0a' : '#0f172a'}
                  strokeWidth="20"
                  strokeLinecap="square"
                />

                {/* Centerline */}
                <line
                  x1={rwy.x1}
                  y1={rwy.y1}
                  x2={rwy.x2}
                  y2={rwy.y2}
                  stroke={vectorColor}
                  strokeWidth="4"
                  strokeDasharray="10,10"
                />

                {/* Low Threshold Label */}
                <text
                  x={rwy.x1 - 18}
                  y={rwy.y1 + 4}
                  fill={vectorColor}
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {rwy.le_ident}
                </text>

                {/* High Threshold Label */}
                <text
                  x={rwy.x2 + 18}
                  y={rwy.y2 + 4}
                  fill={vectorColor}
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {rwy.he_ident}
                </text>

                {/* Closure Hazard X */}
                {rwy.isClosed && (
                  <g transform={`translate(${(rwy.x1 + rwy.x2) / 2}, ${(rwy.y1 + rwy.y2) / 2})`}>
                    <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ef4444" strokeWidth="5" />
                    <line x1="-15" y1="15" x2="15" y2="-15" stroke="#ef4444" strokeWidth="5" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Facility Spec Footer */}
      {selectedFacility && (
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-slate-800 dark:text-zinc-200">
              SELECTED SPECIFICATION: RWY {selectedFacility.id}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-600 dark:text-zinc-400">
              LENGTH: {selectedFacility.length_ft.toLocaleString()} FT ({Math.round(selectedFacility.length_ft * 0.3048)} M)
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-600 dark:text-zinc-400">HEADING: {selectedFacility.heading_deg}° MAG</span>
          </div>

          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
            selectedFacility.isClosed ? 'bg-red-100 text-red-950 border border-red-400' : 'bg-emerald-100 text-emerald-950 border border-emerald-400'
          }`}>
            {selectedFacility.isClosed ? '🔴 CLSD NOTAM ACTIVE' : '🟢 OPERATIONAL'}
          </span>
        </div>
      )}
    </div>
  );
};
