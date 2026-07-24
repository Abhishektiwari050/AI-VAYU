import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { DisplayTheme } from './Header';
import { Layers, AlertTriangle, CheckCircle, Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface InteractiveAirportDiagramProps {
  briefing: BriefingSummary;
  theme: DisplayTheme;
}

export const InteractiveAirportDiagram: React.FC<InteractiveAirportDiagramProps> = ({ briefing, theme }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTaxiways, setShowTaxiways] = useState<boolean>(true);
  const [showAprons, setShowAprons] = useState<boolean>(true);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  // Analyze active NOTAM closures
  const rawNotamTexts = (briefing.allNotamsLedger || []).map((n) => n.rawText.toUpperCase()).join(' ');
  
  const isRwy09Closed = /RWY\s*(09|27|09\/27)\s*(CLSD|CLOSED)/i.test(rawNotamTexts);
  const isRwy13Closed = /RWY\s*(13|31|13R|31L)\s*(CLSD|CLOSED)/i.test(rawNotamTexts);
  const isTwyA1Closed = /TWY\s*(A1|A|ALPHA1?)\s*(CLSD|CLOSED)/i.test(rawNotamTexts);
  const isApronClosed = /APRON\s*(CLSD|CLOSED|WORK|RESTRICTED)/i.test(rawNotamTexts);

  const containerBg = isNight ? 'bg-black border-red-900/60' : isDay ? 'bg-slate-50 border-slate-300' : 'bg-zinc-950 border-zinc-800';
  const svgBg = isNight ? '#0a0202' : isDay ? '#f8fafc' : '#090a0f';

  return (
    <div className={`w-full rounded-3xl border p-4 sm:p-5 font-mono mb-6 transition-all ${containerBg}`}>
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              INTERACTIVE AIRPORT DIAGRAM OVERLAY ({briefing.icao})
            </h3>
            <p className="text-[11px] opacity-70 font-sans">
              Real-time vector aerodrome layout highlighting NOTAM taxiway & runway closures.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2))}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-zinc-300" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-zinc-300" />
          </button>
          <button
            onClick={() => setShowTaxiways(!showTaxiways)}
            className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
              showTaxiways ? 'bg-amber-600 border-amber-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            TWYs
          </button>
        </div>
      </div>

      {/* SVG VECTOR DIAGRAM CANVAS */}
      <div className="relative w-full h-[320px] rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})`, backgroundColor: svgBg }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="diagGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isNight ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.15)'} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagGrid)" />

          {/* APRON / RAMP AREA */}
          {showAprons && (
            <g
              onClick={() => setSelectedElement('MAIN APRON & RAMP AREA')}
              className="cursor-pointer transition hover:opacity-80"
            >
              <polygon
                points="250,220 450,220 450,300 250,300"
                fill={isApronClosed ? 'rgba(239, 68, 68, 0.35)' : isNight ? 'rgba(60, 20, 20, 0.6)' : isDay ? '#e2e8f0' : '#1e293b'}
                stroke={isApronClosed ? '#ef4444' : '#64748b'}
                strokeWidth={isApronClosed ? '2' : '1'}
                strokeDasharray={isApronClosed ? '4 2' : 'none'}
              />
              <text x="350" y="260" textAnchor="middle" fill={isNight ? '#f87171' : isDay ? '#334155' : '#94a3b8'} fontSize="11" fontWeight="bold">
                MAIN PASSENGER APRON
              </text>
            </g>
          )}

          {/* TAXIWAYS */}
          {showTaxiways && (
            <g>
              {/* TWY A (Parallel Taxiway) */}
              <line
                x1="100" y1="170" x2="700" y2="170"
                stroke={isNight ? '#7f1d1d' : isDay ? '#cbd5e1' : '#334155'}
                strokeWidth="16"
              />
              <text x="120" y="165" fill="#f59e0b" fontSize="10" fontWeight="bold">TWY A</text>

              {/* TWY A1 (High Speed Exit - Highlighted in Pulsing Red if Closed) */}
              <line
                x1="320" y1="170" x2="420" y2="100"
                stroke={isTwyA1Closed ? '#ef4444' : '#f59e0b'}
                strokeWidth={isTwyA1Closed ? '18' : '12'}
                className={isTwyA1Closed ? 'animate-pulse' : ''}
                onClick={() => setSelectedElement('TAXIWAY A1 (HIGH-SPEED EXIT)')}
              />
              <text x="380" y="125" fill={isTwyA1Closed ? '#ef4444' : '#f59e0b'} fontSize="11" fontWeight="bold">
                TWY A1 {isTwyA1Closed ? '🔴 [CLOSED]' : ''}
              </text>

              {/* TWY B (Apron Link) */}
              <line
                x1="350" y1="170" x2="350" y2="220"
                stroke="#f59e0b" strokeWidth="12"
              />
              <text x="360" y="200" fill="#f59e0b" fontSize="10" fontWeight="bold">TWY B</text>
            </g>
          )}

          {/* RUNWAY 09/27 (Main Runway) */}
          <g onClick={() => setSelectedElement('RUNWAY 09/27 (MAIN RUNWAY)')} className="cursor-pointer">
            <line
              x1="80" y1="100" x2="720" y2="100"
              stroke={isRwy09Closed ? '#b91c1c' : '#1e293b'}
              strokeWidth="28"
            />
            {/* Centerline */}
            <line
              x1="90" y1="100" x2="710" y2="100"
              stroke={isRwy09Closed ? '#ef4444' : '#ffffff'}
              strokeWidth="3"
              strokeDasharray="15 10"
            />
            {/* Threshold 09 */}
            <text x="100" y="104" fill="#ffffff" fontSize="13" fontWeight="bold">09</text>
            {/* Threshold 27 */}
            <text x="680" y="104" fill="#ffffff" fontSize="13" fontWeight="bold">27</text>

            {isRwy09Closed && (
              <g>
                <rect x="300" y="86" width="200" height="28" fill="#ef4444" rx="4" />
                <text x="400" y="104" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  RWY 09/27 CLOSED BY NOTAM
                </text>
              </g>
            )}
          </g>

          {/* RUNWAY 13R/31L (Crosswind Runway) */}
          <g onClick={() => setSelectedElement('RUNWAY 13R/31L (CROSSWIND RUNWAY)')} className="cursor-pointer">
            <line
              x1="180" y1="380" x2="620" y2="60"
              stroke={isRwy13Closed ? '#b91c1c' : '#1e293b'}
              strokeWidth="24"
            />
            <line
              x1="190" y1="373" x2="610" y2="67"
              stroke={isRwy13Closed ? '#ef4444' : '#ffffff'}
              strokeWidth="2"
              strokeDasharray="12 8"
            />
            <text x="200" y="375" fill="#ffffff" fontSize="11" fontWeight="bold">13R</text>
            <text x="590" y="80" fill="#ffffff" fontSize="11" fontWeight="bold">31L</text>
          </g>

          {/* CONTROL TOWER ICON */}
          <circle cx="500" cy="260" r="14" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
          <text x="500" y="264" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">TWR</text>

          {/* HAZARD CALLOUT BADGES */}
          {(isTwyA1Closed || isRwy09Closed || isRwy13Closed) && (
            <g transform="translate(20, 20)">
              <rect x="0" y="0" width="240" height="48" fill="rgba(239, 68, 68, 0.9)" rx="6" />
              <text x="10" y="20" fill="#ffffff" fontSize="10" fontWeight="bold">
                ⚠️ ACTIVE NOTAM CLOSURES:
              </text>
              <text x="10" y="36" fill="#ffffff" fontSize="9">
                {[
                  isRwy09Closed ? 'RWY 09/27' : '',
                  isRwy13Closed ? 'RWY 13R/31L' : '',
                  isTwyA1Closed ? 'TWY A1' : '',
                ].filter(Boolean).join(', ')} CLSD FOR MAINT
              </text>
            </g>
          )}
        </svg>

        {/* Element Selection Info Pill */}
        {selectedElement && (
          <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/90 border border-zinc-800 text-xs font-mono flex items-center justify-between text-amber-300 shadow-lg">
            <span>SELECTED: {selectedElement}</span>
            <button onClick={() => setSelectedElement(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
        )}
      </div>
    </div>
  );
};
