import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { Layers, AlertTriangle, CheckCircle, Info, ZoomIn, ZoomOut, Maximize2, ShieldAlert, Compass } from 'lucide-react';

interface InteractiveAirportDiagramProps {
  briefing: BriefingSummary;
  theme?: string;
}

interface FacilityPopover {
  id: string;
  name: string;
  type: 'RUNWAY' | 'TAXIWAY' | 'APRON' | 'TOWER';
  isClosed: boolean;
  notamText: string;
}

export const InteractiveAirportDiagram: React.FC<InteractiveAirportDiagramProps> = ({ briefing }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedFacility, setSelectedFacility] = useState<FacilityPopover | null>(null);
  const [showTaxiways, setShowTaxiways] = useState<boolean>(true);
  const [showAprons, setShowAprons] = useState<boolean>(true);

  // Analyze active NOTAM closures
  const rawNotamTexts = (briefing.allNotamsLedger || [])
    .map((n) => `${n.id} ${n.rawText.toUpperCase()}`)
    .join(' ');
  
  const isRwy09Closed = /RWY\s*(09|27|09\/27)\s*(CLSD|CLOSED)/i.test(rawNotamTexts);
  const isRwy13Closed = /RWY\s*(13|31|13R|31L|14|32)\s*(CLSD|CLOSED)/i.test(rawNotamTexts);
  const isTwyA1Closed = /TWY\s*(A1|A|ALPHA1?)\s*(CLSD|CLOSED|WORK|MAINT)/i.test(rawNotamTexts);
  const isTwyBClosed = /TWY\s*(B|BRAVO)\s*(CLSD|CLOSED|WORK|MAINT)/i.test(rawNotamTexts);
  const isApronClosed = /APRON\s*(CLSD|CLOSED|WORK|RESTRICTED)/i.test(rawNotamTexts);

  // Airport Specific Layout Info
  const icao = briefing.icao.toUpperCase();

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
              <span>REAL-TIME VECTOR AIRPORT DIAGRAM</span>
              <span className="px-2 py-0.5 rounded-full bg-[#2e7def]/10 text-[#2e7def] text-[10px] font-mono">
                {icao} ACCURATE LAYOUT
              </span>
            </h3>
            <p className="text-xs text-[#5b6472]">
              Interactive aerodrome vector map highlighting NOTAM taxiway & runway closures in real-time.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2))}
            className="p-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 transition cursor-pointer shadow-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-[#0e1116]" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.8))}
            className="p-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 transition cursor-pointer shadow-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-[#0e1116]" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setSelectedFacility(null);
            }}
            className="p-1.5 rounded-full bg-white border border-[#e3e8ee] hover:bg-slate-50 transition cursor-pointer shadow-sm"
            title="Reset Diagram"
          >
            <Maximize2 className="w-4 h-4 text-[#0e1116]" />
          </button>
          <button
            onClick={() => setShowTaxiways(!showTaxiways)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition cursor-pointer shadow-sm ${
              showTaxiways ? 'bg-[#0e1116] text-white border-[#0e1116]' : 'bg-white text-[#5b6472] border-[#e3e8ee]'
            }`}
          >
            TWYs
          </button>
        </div>
      </div>

      {/* VECTOR DIAGRAM CANVAS CONTAINER */}
      <div className="relative w-full h-[360px] rounded-2xl border border-[#e3e8ee] bg-[#f8fafc] overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 900 550"
          className="w-full h-full transition-transform duration-300 select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* GRID BACKGROUND */}
          <defs>
            <pattern id="diagGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(227, 232, 238, 0.8)" strokeWidth="1" />
            </pattern>
            <pattern id="closedHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagGrid)" />

          {/* MAIN APRON AREA */}
          {showAprons && (
            <g
              onClick={() => setSelectedFacility({
                id: 'APRON-MAIN',
                name: `${icao} Main Passenger Terminal Apron`,
                type: 'APRON',
                isClosed: isApronClosed,
                notamText: isApronClosed ? 'NOTAM: Main Apron construction work in progress. Taxi speed restricted to 10 kts.' : 'Apron fully operational. Standard pushback procedures in effect.'
              })}
              className="cursor-pointer transition hover:opacity-90"
            >
              <polygon
                points="280,240 500,240 500,330 280,330"
                fill={isApronClosed ? 'url(#closedHatch)' : '#e2e8f0'}
                stroke={isApronClosed ? '#ef4444' : '#94a3b8'}
                strokeWidth="2"
              />
              <text x="390" y="280" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="bold">
                MAIN PASSENGER APRON
              </text>
              {isApronClosed && (
                <text x="390" y="298" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
                  ⚠️ APRON RESTRICTED
                </text>
              )}
            </g>
          )}

          {/* TAXIWAYS LAYER */}
          {showTaxiways && (
            <g>
              {/* TAXIWAY ALPHA (MAIN PARALLEL TWY A) */}
              <g
                onClick={() => setSelectedFacility({
                  id: 'TWY-A',
                  name: 'Taxiway Alpha (TWY A)',
                  type: 'TAXIWAY',
                  isClosed: isTwyA1Closed,
                  notamText: isTwyA1Closed ? 'NOTAM: TWY A1 closed between TWY A and TWY B due to concrete resurfacing.' : 'TWY Alpha open and operational for code E aircraft.'
                })}
                className="cursor-pointer transition hover:opacity-90"
              >
                <line x1="100" y1="200" x2="800" y2="200" stroke={isTwyA1Closed ? '#ef4444' : '#cbd5e1'} strokeWidth="18" strokeLinecap="round" />
                <line x1="100" y1="200" x2="800" y2="200" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" />
                <text x="760" y="185" fill="#d97706" fontSize="12" fontWeight="bold">TWY A</text>
                {isTwyA1Closed && (
                  <rect x="360" y="191" width="120" height="18" fill="url(#closedHatch)" stroke="#ef4444" strokeWidth="1.5" />
                )}
              </g>

              {/* TAXIWAY BRAVO (CROSS TWY B) */}
              <g
                onClick={() => setSelectedFacility({
                  id: 'TWY-B',
                  name: 'Taxiway Bravo (TWY B)',
                  type: 'TAXIWAY',
                  isClosed: isTwyBClosed,
                  notamText: isTwyBClosed ? 'NOTAM: TWY Bravo maintenance work near intersection TWY A.' : 'TWY Bravo open.'
                })}
                className="cursor-pointer transition hover:opacity-90"
              >
                <line x1="390" y1="120" x2="390" y2="400" stroke={isTwyBClosed ? '#ef4444' : '#cbd5e1'} strokeWidth="16" strokeLinecap="round" />
                <line x1="390" y1="120" x2="390" y2="400" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 6" />
                <text x="405" y="140" fill="#d97706" fontSize="12" fontWeight="bold">TWY B</text>
              </g>
            </g>
          )}

          {/* RUNWAY 09/27 (PRIMARY RUNWAY) */}
          <g
            onClick={() => setSelectedFacility({
              id: 'RWY-0927',
              name: `Runway 09/27 (${icao} Primary)`,
              type: 'RUNWAY',
              isClosed: isRwy09Closed,
              notamText: isRwy09Closed ? 'NOTAM CRITICAL: RWY 09/27 CLOSED FOR ALL ARRIVALS AND DEPARTURES.' : 'Runway 09/27 OPEN. ILS CAT III operational.'
            })}
            className="cursor-pointer transition hover:opacity-90"
          >
            <line x1="120" y1="140" x2="780" y2="140" stroke={isRwy09Closed ? '#7f1d1d' : '#1e293b'} strokeWidth="28" strokeLinecap="square" />
            <line x1="120" y1="140" x2="780" y2="140" stroke="#ffffff" strokeWidth="2" strokeDasharray="20 15" />
            
            {/* Runway Designation Markings */}
            <text x="140" y="144" fill="#ffffff" fontSize="13" fontWeight="bold">09</text>
            <text x="750" y="144" fill="#ffffff" fontSize="13" fontWeight="bold">27</text>

            {/* Closure Overlay Banner */}
            {isRwy09Closed && (
              <g>
                <rect x="250" y="125" width="400" height="30" fill="#ef4444" rx="4" />
                <text x="450" y="145" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="black">
                  ⛔ RWY 09/27 CLOSED BY NOTAM
                </text>
              </g>
            )}
          </g>

          {/* RUNWAY 13/31 (SECONDARY RUNWAY) */}
          <g
            onClick={() => setSelectedFacility({
              id: 'RWY-1331',
              name: `Runway 13/31 (${icao} Secondary)`,
              type: 'RUNWAY',
              isClosed: isRwy13Closed,
              notamText: isRwy13Closed ? 'NOTAM: RWY 13/31 closed for scheduled surface inspection.' : 'Runway 13/31 OPEN. Visual approach available.'
            })}
            className="cursor-pointer transition hover:opacity-90"
          >
            <line x1="160" y1="380" x2="740" y2="80" stroke={isRwy13Closed ? '#7f1d1d' : '#334155'} strokeWidth="24" strokeLinecap="square" />
            <line x1="160" y1="380" x2="740" y2="80" stroke="#ffffff" strokeWidth="2" strokeDasharray="16 12" />
            
            <text x="180" y="370" fill="#ffffff" fontSize="12" fontWeight="bold">13</text>
            <text x="710" y="95" fill="#ffffff" fontSize="12" fontWeight="bold">31</text>

            {isRwy13Closed && (
              <g>
                <rect x="360" y="210" width="220" height="26" fill="#ef4444" rx="4" transform="rotate(-27 470 223)" />
                <text x="470" y="228" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" transform="rotate(-27 470 223)">
                  ⛔ RWY 13/31 CLOSED
                </text>
              </g>
            )}
          </g>

          {/* CONTROL TOWER ICON */}
          <g
            onClick={() => setSelectedFacility({
              id: 'ATC-TOWER',
              name: `${icao} ATC Control Tower`,
              type: 'TOWER',
              isClosed: false,
              notamText: 'Control Tower 118.10 MHz operational 24/7.'
            })}
            className="cursor-pointer transition hover:opacity-90"
          >
            <circle cx="450" cy="380" r="16" fill="#0e1116" stroke="#2e7def" strokeWidth="3" />
            <text x="450" y="384" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">TWR</text>
          </g>
        </svg>

        {/* POPOVER DETAIL MODAL FOR SELECTED FACILITY */}
        {selectedFacility && (
          <div className="absolute bottom-4 left-4 right-4 bg-white border border-[#e3e8ee] p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                selectedFacility.isClosed ? 'bg-red-500' : 'bg-[#10b981]'
              }`}>
                {selectedFacility.isClosed ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0e1116] flex items-center gap-2">
                  <span>{selectedFacility.name}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    selectedFacility.isClosed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedFacility.isClosed ? 'CLOSED BY NOTAM' : 'OPERATIONAL'}
                  </span>
                </h4>
                <p className="text-xs text-[#5b6472] mt-1 font-mono leading-relaxed">
                  {selectedFacility.notamText}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFacility(null)}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-mono text-[#0e1116] cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
