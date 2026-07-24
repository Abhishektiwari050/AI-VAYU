import React from 'react';
import { RouteLegBriefing } from '../types';
import { Mountain, AlertTriangle, ShieldCheck, ArrowRight, CloudRain, Compass } from 'lucide-react';

interface RouteCorridorProfileProps {
  routeData: RouteLegBriefing;
  theme?: string;
}

export const RouteCorridorProfile: React.FC<RouteCorridorProfileProps> = ({ routeData }) => {
  const allBriefings = [
    routeData.origin,
    ...routeData.alternatesAndWaypoints,
    routeData.destination,
  ];

  const hasCriticalCorridorNotam = allBriefings.some((b) => b.criticalCount > 0);

  return (
    <div className="w-full cirrus-card p-5 sm:p-6 mb-6 font-sans border border-[#e3e8ee] shadow-md transition-all">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e3e8ee]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-[#2e7def]/10 text-[#2e7def] border border-[#2e7def]/20">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0e1116] flex items-center gap-2">
              <span>GRAPHICAL CORRIDOR VERTICAL CROSS-SECTION PROFILE</span>
              <span className="px-2 py-0.5 rounded-full bg-[#2e7def]/10 text-[#2e7def] text-[10px] font-mono">
                {routeData.origin.icao} ➔ {routeData.destination.icao}
              </span>
            </h3>
            <p className="text-xs text-[#5b6472]">
              Side-view flight path profile showing terrain elevation contours, freezing level, cloud layers, and TFR airspace cylinders.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-[#2e7def] font-medium">
            <span className="w-3 h-0.5 bg-[#2e7def] inline-block"></span> FL330 Cruise
          </span>
          <span className="flex items-center gap-1.5 text-cyan-600 font-medium">
            <span className="w-3 h-0.5 bg-cyan-500 stroke-dasharray inline-block"></span> 12,000' Freezing Lvl
          </span>
          {hasCriticalCorridorNotam && (
            <span className="flex items-center gap-1.5 text-red-600 font-bold">
              <span className="w-2.5 h-2.5 bg-red-500/40 border border-red-500 inline-block"></span> TFR Airspace
            </span>
          )}
        </div>
      </div>

      {/* SVG CROSS-SECTION CANVAS */}
      <div className="w-full h-[280px] rounded-2xl border border-[#e3e8ee] bg-[#f8fafc] overflow-hidden relative">
        <svg viewBox="0 0 900 320" className="w-full h-full select-none">
          {/* ALTITUDE GRID LINES */}
          <line x1="60" y1="40" x2="860" y2="40" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="44" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">FL400</text>

          <line x1="60" y1="90" x2="860" y2="90" stroke="#2e7def" strokeWidth="2" strokeDasharray="6 3" />
          <text x="50" y="94" textAnchor="end" fill="#2e7def" fontSize="10" fontWeight="bold" fontFamily="monospace">FL330</text>

          <line x1="60" y1="160" x2="860" y2="160" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="50" y="164" textAnchor="end" fill="#06b6d4" fontSize="10" fontFamily="monospace">12,000'</text>

          <line x1="60" y1="220" x2="860" y2="220" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="224" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">5,000'</text>

          {/* REALISTIC MOUNTAIN TERRAIN CONTOURS */}
          <path
            d="M 60,285 L 140,270 L 250,230 L 380,185 L 520,225 L 680,260 L 860,285 L 860,320 L 60,320 Z"
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* ACTIVE TFR AIRSPACE CYLINDER (IF NOTAMS PRESENT) */}
          {hasCriticalCorridorNotam && (
            <g>
              <rect x="340" y="185" width="140" height="100" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 3" />
              <text x="410" y="225" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="black" fontFamily="monospace">
                ⛔ ACTIVE TFR CYLINDER
              </text>
              <text x="410" y="240" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="monospace">
                SFC - 18,000' MSL
              </text>
            </g>
          )}

          {/* CLOUD LAYERS (BKN 10,000' TOPS) */}
          <g fill="rgba(203, 213, 225, 0.6)" stroke="#94a3b8" strokeWidth="1">
            <ellipse cx="220" cy="140" rx="70" ry="22" />
            <ellipse cx="640" cy="145" rx="90" ry="26" />
          </g>
          <text x="220" y="144" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="sans-serif">BKN 10,000'</text>
          <text x="640" y="149" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="sans-serif">OVC 12,000'</text>

          {/* FLIGHT PATH (FL330 CRUISE TRAJECTORY) */}
          <path
            d="M 80,275 L 180,90 L 740,90 L 840,275"
            fill="none"
            stroke="#2e7def"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* WAYPOINT PINS ALONG FLIGHT PATH */}
          {allBriefings.map((b, idx) => {
            const xPos = 80 + (idx / Math.max(1, allBriefings.length - 1)) * 760;
            const yPos = idx === 0 || idx === allBriefings.length - 1 ? 275 : 90;
            const isCrit = b.criticalCount > 0;

            return (
              <g key={b.icao}>
                <circle cx={xPos} cy={yPos} r="7" fill={isCrit ? '#ef4444' : '#2e7def'} stroke="#ffffff" strokeWidth="2.5" />
                <text x={xPos} y={yPos - 12} textAnchor="middle" fill="#0e1116" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {b.icao}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
