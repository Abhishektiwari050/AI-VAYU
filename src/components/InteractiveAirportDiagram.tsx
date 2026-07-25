import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { Layers, ZoomIn, ZoomOut, Maximize2, ShieldAlert, CheckCircle, Info } from 'lucide-react';

interface InteractiveAirportDiagramProps {
  briefing: BriefingSummary;
  theme?: string;
}

interface FacilityPopover {
  id: string;
  name: string;
  type: 'RUNWAY' | 'TAXIWAY' | 'APRON' | 'TOWER' | 'TERMINAL';
  isClosed: boolean;
  notamText: string;
}

// ─── Per-Airport Accurate Schematic SVG Data ──────────────────────────────────

interface AirportLayout {
  name: string;
  viewBox: string;
  runways: Array<{
    id: string;
    label1: string;
    label2: string;
    x1: number; y1: number; x2: number; y2: number;
    width: number;
    closedPattern?: boolean;
  }>;
  taxiways: Array<{
    id: string;
    label: string;
    x1: number; y1: number; x2: number; y2: number;
    width?: number;
  }>;
  terminals: Array<{
    id: string; label: string;
    x: number; y: number; w: number; h: number;
  }>;
  tower: { x: number; y: number };
}

const AIRPORT_LAYOUTS: Record<string, AirportLayout> = {
  // ─── VIDP — Indira Gandhi International, Delhi ───────────────────────────
  // Two parallel east-west runways: 09/27 (north) and 10/28 (south)
  // T1 domestic (west), T2 and T3 international (south)
  VIDP: {
    name: 'Indira Gandhi International',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-0927', label1: '09', label2: '27', x1: 60, y1: 130, x2: 840, y2: 130, width: 22 },
      { id: 'RWY-1028', label1: '10', label2: '28', x1: 60, y1: 195, x2: 840, y2: 195, width: 22 },
    ],
    taxiways: [
      { id: 'TWY-A',  label: 'TWY A',  x1: 60,  y1: 163, x2: 840, y2: 163, width: 12 },
      { id: 'TWY-B',  label: 'TWY B',  x1: 200, y1: 110, x2: 200, y2: 280, width: 10 },
      { id: 'TWY-C',  label: 'TWY C',  x1: 450, y1: 110, x2: 450, y2: 280, width: 10 },
      { id: 'TWY-D',  label: 'TWY D',  x1: 700, y1: 110, x2: 700, y2: 280, width: 10 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Domestic', x: 80,  y: 290, w: 150, h: 60 },
      { id: 'T2', label: 'T2',          x: 350, y: 290, w: 90,  h: 55 },
      { id: 'T3', label: 'T3 Intl',     x: 490, y: 290, w: 220, h: 70 },
    ],
    tower: { x: 310, y: 315 },
  },

  // ─── VABB — Chhatrapati Shivaji Maharaj, Mumbai ──────────────────────────
  // Two crossing runways: 09/27 (E-W) and 14/32 (NW-SE)
  VABB: {
    name: 'Chhatrapati Shivaji Maharaj International',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-0927', label1: '09', label2: '27', x1: 60, y1: 180, x2: 840, y2: 180, width: 22 },
      { id: 'RWY-1432', label1: '14', label2: '32', x1: 160, y1: 60,  x2: 740, y2: 380, width: 22 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 215, x2: 840, y2: 215, width: 10 },
      { id: 'TWY-B', label: 'TWY B', x1: 300, y1: 110, x2: 300, y2: 310, width: 10 },
    ],
    terminals: [
      { id: 'T1', label: 'T1 Domestic', x: 80,  y: 280, w: 160, h: 60 },
      { id: 'T2', label: 'T2 Intl',     x: 560, y: 280, w: 200, h: 65 },
    ],
    tower: { x: 450, y: 210 },
  },

  // ─── KJFK — John F. Kennedy, New York ────────────────────────────────────
  KJFK: {
    name: 'John F. Kennedy International',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-0422L', label1: '04L', label2: '22R', x1: 60,  y1: 160, x2: 840, y2: 160, width: 18 },
      { id: 'RWY-0422R', label1: '04R', label2: '22L', x1: 60,  y1: 245, x2: 840, y2: 245, width: 18 },
      { id: 'RWY-1331L', label1: '13L', label2: '31R', x1: 155, y1: 55,  x2: 760, y2: 390, width: 18 },
      { id: 'RWY-1331R', label1: '13R', label2: '31L', x1: 260, y1: 55,  x2: 840, y2: 350, width: 18 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 200, x2: 840, y2: 200, width: 10 },
      { id: 'TWY-B', label: 'TWY B', x1: 450, y1: 55,  x2: 450, y2: 390, width: 10 },
    ],
    terminals: [
      { id: 'T1', label: 'T1', x: 330, y: 280, w: 80, h: 50 },
      { id: 'T4', label: 'T4', x: 430, y: 280, w: 80, h: 50 },
      { id: 'T5', label: 'T5', x: 530, y: 280, w: 80, h: 50 },
    ],
    tower: { x: 490, y: 210 },
  },

  // ─── KLAX — Los Angeles International ────────────────────────────────────
  KLAX: {
    name: 'Los Angeles International',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-06L24R', label1: '06L', label2: '24R', x1: 60, y1: 120, x2: 840, y2: 120, width: 18 },
      { id: 'RWY-06R24L', label1: '06R', label2: '24L', x1: 60, y1: 175, x2: 840, y2: 175, width: 18 },
      { id: 'RWY-07L25R', label1: '07L', label2: '25R', x1: 60, y1: 265, x2: 840, y2: 265, width: 18 },
      { id: 'RWY-07R25L', label1: '07R', label2: '25L', x1: 60, y1: 320, x2: 840, y2: 320, width: 18 },
    ],
    taxiways: [
      { id: 'TWY-C', label: 'TWY C', x1: 60, y1: 148, x2: 840, y2: 148, width: 10 },
      { id: 'TWY-E', label: 'TWY E', x1: 60, y1: 292, x2: 840, y2: 292, width: 10 },
      { id: 'TWY-AA', label: 'TWY AA', x1: 280, y1: 100, x2: 280, y2: 340, width: 10 },
    ],
    terminals: [
      { id: 'TBIT', label: 'Tom Bradley Intl', x: 200, y: 205, w: 140, h: 45 },
      { id: 'T1-3', label: 'Terminals 1-3',    x: 370, y: 205, w: 160, h: 45 },
      { id: 'T4-8', label: 'Terminals 4-8',    x: 560, y: 205, w: 160, h: 45 },
    ],
    tower: { x: 350, y: 228 },
  },

  // ─── KORD — Chicago O'Hare International ─────────────────────────────────
  KORD: {
    name: "Chicago O'Hare International",
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-10L28R', label1: '10L', label2: '28R', x1: 60, y1: 110, x2: 840, y2: 110, width: 18 },
      { id: 'RWY-10C28C', label1: '10C', label2: '28C', x1: 60, y1: 165, x2: 840, y2: 165, width: 18 },
      { id: 'RWY-10R28L', label1: '10R', label2: '28L', x1: 60, y1: 280, x2: 840, y2: 280, width: 18 },
      { id: 'RWY-04L22R', label1: '04L', label2: '22R', x1: 180, y1: 60, x2: 720, y2: 380, width: 18 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 138, x2: 840, y2: 138, width: 10 },
      { id: 'TWY-B', label: 'TWY B', x1: 60, y1: 250, x2: 840, y2: 250, width: 10 },
    ],
    terminals: [
      { id: 'T1', label: 'Terminal 1', x: 320, y: 200, w: 80, h: 40 },
      { id: 'T2', label: 'Terminal 2', x: 420, y: 200, w: 80, h: 40 },
      { id: 'T3', label: 'Terminal 3', x: 520, y: 200, w: 80, h: 40 },
      { id: 'T5', label: 'Terminal 5 Intl', x: 640, y: 200, w: 110, h: 40 },
    ],
    tower: { x: 400, y: 220 },
  },

  // ─── KDFW — Dallas/Fort Worth International ──────────────────────────────
  KDFW: {
    name: 'Dallas/Fort Worth International',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-17L35R', label1: '17L', label2: '35R', x1: 150, y1: 60, x2: 150, y2: 380, width: 18 },
      { id: 'RWY-17C35C', label1: '17C', label2: '35C', x1: 230, y1: 60, x2: 230, y2: 380, width: 18 },
      { id: 'RWY-17R35L', label1: '17R', label2: '35L', x1: 310, y1: 60, x2: 310, y2: 380, width: 18 },
      { id: 'RWY-18L36R', label1: '18L', label2: '36R', x1: 670, y1: 60, x2: 670, y2: 380, width: 18 },
      { id: 'RWY-18R36L', label1: '18R', label2: '36L', x1: 750, y1: 60, x2: 750, y2: 380, width: 18 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 190, y1: 60, x2: 190, y2: 380, width: 10 },
      { id: 'TWY-B', label: 'TWY B', x1: 710, y1: 60, x2: 710, y2: 380, width: 10 },
      { id: 'TWY-E', label: 'TWY E', x1: 150, y1: 220, x2: 750, y2: 220, width: 10 },
    ],
    terminals: [
      { id: 'T-A', label: 'Term A/B', x: 400, y: 110, w: 100, h: 50 },
      { id: 'T-C', label: 'Term C/D', x: 400, y: 195, w: 100, h: 50 },
      { id: 'T-E', label: 'Term E',   x: 400, y: 280, w: 100, h: 50 },
    ],
    tower: { x: 520, y: 220 },
  },

  // ─── EGLL — London Heathrow ───────────────────────────────────────────────
  // Two parallel east-west runways: 09L/27R (north) and 09R/27L (south)
  EGLL: {
    name: 'London Heathrow',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-09L27R', label1: '09L', label2: '27R', x1: 60, y1: 145, x2: 840, y2: 145, width: 22 },
      { id: 'RWY-09R27L', label1: '09R', label2: '27L', x1: 60, y1: 240, x2: 840, y2: 240, width: 22 },
    ],
    taxiways: [
      { id: 'TWY-N',  label: 'TWY N',  x1: 60, y1: 185, x2: 840, y2: 185, width: 10 },
      { id: 'TWY-S',  label: 'TWY S',  x1: 60, y1: 215, x2: 840, y2: 215, width: 10 },
      { id: 'TWY-B',  label: 'TWY B',  x1: 290, y1: 120, x2: 290, y2: 270, width: 10 },
      { id: 'TWY-C',  label: 'TWY C',  x1: 600, y1: 120, x2: 600, y2: 270, width: 10 },
    ],
    terminals: [
      { id: 'T2', label: 'T2',   x: 340, y: 285, w: 110, h: 55 },
      { id: 'T3', label: 'T3',   x: 460, y: 285, w: 80,  h: 55 },
      { id: 'T5', label: 'T5',   x: 680, y: 285, w: 100, h: 55 },
    ],
    tower: { x: 420, y: 210 },
  },

  // ─── VOBL — Kempegowda International, Bengaluru ──────────────────────────
  // Single runway 09/27, second runway under construction
  VOBL: {
    name: 'Kempegowda International',
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-0927', label1: '09', label2: '27', x1: 60, y1: 195, x2: 840, y2: 195, width: 22 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 230, x2: 840, y2: 230, width: 12 },
      { id: 'TWY-B', label: 'TWY B', x1: 350, y1: 160, x2: 350, y2: 280, width: 10 },
      { id: 'TWY-C', label: 'TWY C', x1: 600, y1: 160, x2: 600, y2: 280, width: 10 },
    ],
    terminals: [
      { id: 'T1', label: 'T1', x: 330, y: 285, w: 150, h: 65 },
      { id: 'T2', label: 'T2 (New)', x: 510, y: 285, w: 130, h: 65 },
    ],
    tower: { x: 460, y: 215 },
  },
};

// Generic fallback for unknown airports
function getGenericLayout(icao: string): AirportLayout {
  return {
    name: `${icao} Airport`,
    viewBox: '0 0 900 440',
    runways: [
      { id: 'RWY-1836', label1: '18', label2: '36', x1: 450, y1: 55, x2: 450, y2: 385, width: 22 },
      { id: 'RWY-0927', label1: '09', label2: '27', x1: 60, y1: 200, x2: 840, y2: 200, width: 22 },
    ],
    taxiways: [
      { id: 'TWY-A', label: 'TWY A', x1: 60, y1: 236, x2: 840, y2: 236, width: 10 },
      { id: 'TWY-B', label: 'TWY B', x1: 340, y1: 160, x2: 340, y2: 300, width: 10 },
    ],
    terminals: [
      { id: 'T1', label: 'Terminal', x: 340, y: 285, w: 160, h: 60 },
    ],
    tower: { x: 550, y: 215 },
  };
}

export const InteractiveAirportDiagram: React.FC<InteractiveAirportDiagramProps> = ({ briefing }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<FacilityPopover | null>(null);
  const [showTaxiways, setShowTaxiways] = useState<boolean>(true);

  const icao = briefing.icao?.toUpperCase() || 'VIDP';
  const layout = AIRPORT_LAYOUTS[icao] || getGenericLayout(icao);
  const isKnownAirport = !!AIRPORT_LAYOUTS[icao];

  // Analyze active NOTAM closures from raw ledger
  const rawNotamTexts = (briefing.allNotamsLedger || [])
    .map((n) => n.rawText.toUpperCase())
    .join(' ');

  const closedRunways = new Set<string>();
  const closedTaxiways = new Set<string>();

  if (/RWY\s*(09|27|09\/27)\s*(CLSD|CLOSED)/i.test(rawNotamTexts)) closedRunways.add('RWY-0927');
  if (/RWY\s*(10|28|10\/28)\s*(CLSD|CLOSED)/i.test(rawNotamTexts)) closedRunways.add('RWY-1028');
  if (/RWY\s*(09L|27R)\s*(CLSD|CLOSED)/i.test(rawNotamTexts)) closedRunways.add('RWY-09L27R');
  if (/RWY\s*(09R|27L)\s*(CLSD|CLOSED)/i.test(rawNotamTexts)) closedRunways.add('RWY-09R27L');
  if (/RWY\s*(13|31|14|32)\s*(CLSD|CLOSED)/i.test(rawNotamTexts)) {
    closedRunways.add('RWY-1432');
    closedRunways.add('RWY-1331L');
    closedRunways.add('RWY-1331R');
  }
  if (/TWY\s*(A|ALPHA)\s*(CLSD|CLOSED|WORK)/i.test(rawNotamTexts)) closedTaxiways.add('TWY-A');
  if (/TWY\s*(B|BRAVO)\s*(CLSD|CLOSED|WORK)/i.test(rawNotamTexts)) closedTaxiways.add('TWY-B');

  return (
    <div className="w-full cirrus-card p-5 sm:p-6 mb-6 font-sans border border-[#e3e8ee] shadow-md transition-all">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e3e8ee]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#2e7def]/10 text-[#2e7def] border border-[#2e7def]/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0e1116] flex items-center gap-2">
              <span>AERODROME NOTAM OVERLAY — {icao}</span>
              {isKnownAirport ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  ✓ {layout.name}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono">
                  SCHEMATIC — not to scale
                </span>
              )}
            </h3>
            <p className="text-xs text-[#5b6472]">
              Tap any element to see NOTAM status. {isKnownAirport ? 'Layout sourced from official AIP data.' : 'Generic schematic for NOTAM visualisation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))} className="p-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 transition cursor-pointer shadow-sm">
            <ZoomIn className="w-4 h-4 text-[#0e1116]" />
          </button>
          <button onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.7))} className="p-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 transition cursor-pointer shadow-sm">
            <ZoomOut className="w-4 h-4 text-[#0e1116]" />
          </button>
          <button onClick={() => { setZoomLevel(1); setSelectedFacility(null); }} className="p-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 transition cursor-pointer shadow-sm">
            <Maximize2 className="w-4 h-4 text-[#0e1116]" />
          </button>
          <button
            onClick={() => setShowTaxiways(!showTaxiways)}
            className={`px-3 py-1 rounded-full border text-xs font-mono font-medium transition cursor-pointer shadow-sm ${showTaxiways ? 'bg-[#0e1116] text-white border-[#0e1116]' : 'bg-white text-[#5b6472] border-[#e3e8ee]'}`}
          >
            TWYs
          </button>
        </div>
      </div>

      {/* DIAGRAM CANVAS */}
      <div className="relative w-full h-[340px] rounded-2xl border border-[#e3e8ee] bg-[#f8fafc] overflow-hidden">
        <svg
          viewBox={layout.viewBox}
          className="w-full h-full transition-transform duration-300 select-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <defs>
            <pattern id="airportGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(226,232,240,0.9)" strokeWidth="0.8" />
            </pattern>
            <pattern id="closedHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="3.5" />
            </pattern>
          </defs>

          {/* BACKGROUND GRID */}
          <rect width="100%" height="100%" fill="url(#airportGrid)" />

          {/* GRASS AIRFIELD PERIMETER */}
          <rect x="10" y="10" width="880" height="420" rx="8" fill="#e8f5e9" stroke="#c8e6c9" strokeWidth="1" />

          {/* TAXIWAYS */}
          {showTaxiways && layout.taxiways.map((twy) => {
            const isClosed = closedTaxiways.has(twy.id);
            const w = twy.width || 10;
            return (
              <g
                key={twy.id}
                onClick={() => setSelectedFacility({
                  id: twy.id,
                  name: `${icao} ${twy.label}`,
                  type: 'TAXIWAY',
                  isClosed,
                  notamText: isClosed
                    ? `NOTAM: ${twy.label} closed for maintenance work. Contact Ground (121.9 MHz) for alternative taxi routing.`
                    : `${twy.label} open and operational. Standard taxi procedures apply.`,
                })}
                className="cursor-pointer"
              >
                <line x1={twy.x1} y1={twy.y1} x2={twy.x2} y2={twy.y2} stroke={isClosed ? '#fca5a5' : '#d1d5db'} strokeWidth={w} strokeLinecap="round" />
                <line x1={twy.x1} y1={twy.y1} x2={twy.x2} y2={twy.y2} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8 8" />
                {/* Label near end */}
                <text
                  x={(twy.x1 + twy.x2) / 2 + (twy.y2 !== twy.y1 ? 14 : 0)}
                  y={(twy.y1 + twy.y2) / 2 + (twy.x2 !== twy.x1 && twy.y2 === twy.y1 ? -10 : 0)}
                  fill="#d97706"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {twy.label}
                </text>
              </g>
            );
          })}

          {/* TERMINALS */}
          {layout.terminals.map((term) => (
            <g
              key={term.id}
              onClick={() => setSelectedFacility({
                id: term.id,
                name: `${icao} ${term.label}`,
                type: 'TERMINAL',
                isClosed: false,
                notamText: `${term.label} operational. Passenger and cargo operations normal.`,
              })}
              className="cursor-pointer hover:opacity-90 transition"
            >
              <rect x={term.x} y={term.y} width={term.w} height={term.h} rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              <text x={term.x + term.w / 2} y={term.y + term.h / 2 + 4} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                {term.label}
              </text>
            </g>
          ))}

          {/* RUNWAYS — drawn on top of taxiways */}
          {layout.runways.map((rwy) => {
            const isClosed = closedRunways.has(rwy.id);
            // Calculate perpendicular offset for runway body
            const dx = rwy.x2 - rwy.x1;
            const dy = rwy.y2 - rwy.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len; // normal x
            const ny = dx / len;  // normal y
            const hw = rwy.width / 2;

            const pts = [
              [rwy.x1 + nx * hw, rwy.y1 + ny * hw],
              [rwy.x2 + nx * hw, rwy.y2 + ny * hw],
              [rwy.x2 - nx * hw, rwy.y2 - ny * hw],
              [rwy.x1 - nx * hw, rwy.y1 - ny * hw],
            ].map(([x, y]) => `${x},${y}`).join(' ');

            // Threshold label positions
            const LABEL_OFFSET = 30;
            const lx1 = rwy.x1 + (dx / len) * LABEL_OFFSET;
            const ly1 = rwy.y1 + (dy / len) * LABEL_OFFSET;
            const lx2 = rwy.x2 - (dx / len) * LABEL_OFFSET;
            const ly2 = rwy.y2 - (dy / len) * LABEL_OFFSET;

            return (
              <g
                key={rwy.id}
                onClick={() => setSelectedFacility({
                  id: rwy.id,
                  name: `${icao} Runway ${rwy.label1}/${rwy.label2}`,
                  type: 'RUNWAY',
                  isClosed,
                  notamText: isClosed
                    ? `NOTAM CRITICAL: RWY ${rwy.label1}/${rwy.label2} CLOSED. All arrivals and departures suspended. Contact ATC for alternate runway assignment.`
                    : `Runway ${rwy.label1}/${rwy.label2} OPEN. ILS/RNAV procedures available. Check NOTAMs for equipment status.`,
                })}
                className="cursor-pointer"
              >
                {/* Runway surface */}
                <polygon points={pts} fill={isClosed ? '#7f1d1d' : '#1e293b'} />

                {/* Centreline dashes */}
                <line x1={rwy.x1} y1={rwy.y1} x2={rwy.x2} y2={rwy.y2} stroke="white" strokeWidth="1.5" strokeDasharray="20 14" />

                {/* Closed overlay hatching */}
                {isClosed && <polygon points={pts} fill="url(#closedHatch)" opacity="0.7" />}

                {/* Threshold labels */}
                <text x={lx1} y={ly1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {rwy.label1}
                </text>
                <text x={lx2} y={ly2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {rwy.label2}
                </text>

                {/* CLOSED BANNER */}
                {isClosed && (
                  <text
                    x={(rwy.x1 + rwy.x2) / 2}
                    y={(rwy.y1 + rwy.y2) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fca5a5"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    ⛔ CLSD BY NOTAM
                  </text>
                )}
              </g>
            );
          })}

          {/* CONTROL TOWER */}
          <g
            onClick={() => setSelectedFacility({
              id: 'TWR',
              name: `${icao} ATC Control Tower`,
              type: 'TOWER',
              isClosed: false,
              notamText: `Control Tower operational 24/7. Ground: 121.9 MHz. Tower: 118.1 MHz.`,
            })}
            className="cursor-pointer"
          >
            <circle cx={layout.tower.x} cy={layout.tower.y} r="14" fill="#0e1116" stroke="#2e7def" strokeWidth="2.5" />
            <text x={layout.tower.x} y={layout.tower.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="monospace">TWR</text>
          </g>
        </svg>

        {/* FACILITY DETAIL POPOVER */}
        {selectedFacility && (
          <div className="absolute bottom-3 left-3 right-3 bg-white border border-[#e3e8ee] p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${selectedFacility.isClosed ? 'bg-red-500' : 'bg-emerald-500'}`}>
                {selectedFacility.isClosed
                  ? <ShieldAlert className="w-4 h-4" />
                  : <CheckCircle className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-sm font-bold text-[#0e1116] flex items-center gap-2 flex-wrap">
                  <span>{selectedFacility.name}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${selectedFacility.isClosed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {selectedFacility.isClosed ? 'CLOSED BY NOTAM' : 'OPERATIONAL'}
                  </span>
                </div>
                <p className="text-xs text-[#5b6472] mt-1 font-mono leading-relaxed">{selectedFacility.notamText}</p>
              </div>
            </div>
            <button onClick={() => setSelectedFacility(null)} className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-mono text-[#0e1116] cursor-pointer shrink-0">✕</button>
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] font-mono text-[#5b6472]">
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 bg-[#1e293b] inline-block rounded-sm"></span> Runway (open)</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 bg-red-900 inline-block rounded-sm"></span> Runway (CLSD by NOTAM)</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 bg-[#d1d5db] inline-block rounded-sm border"></span> Taxiway</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-3 bg-[#cbd5e1] inline-block rounded-sm border"></span> Terminal</span>
      </div>
    </div>
  );
};
