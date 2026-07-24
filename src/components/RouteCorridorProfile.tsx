import React from 'react';
import { RouteLegBriefing } from '../types';
import { DisplayTheme } from './Header';
import { Cloud, Mountain, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

interface RouteCorridorProfileProps {
  routeData: RouteLegBriefing;
  theme: DisplayTheme;
}

export const RouteCorridorProfile: React.FC<RouteCorridorProfileProps> = ({ routeData, theme }) => {
  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const allBriefings = [
    routeData.origin,
    ...routeData.alternatesAndWaypoints,
    routeData.destination,
  ];

  const containerBg = isNight ? 'bg-black border-red-900/60' : isDay ? 'bg-slate-50 border-slate-300' : 'bg-zinc-950 border-zinc-800';
  const svgBg = isNight ? '#0a0202' : isDay ? '#f8fafc' : '#0a0c10';

  return (
    <div className={`w-full rounded-3xl border p-5 font-mono mb-6 transition-all ${containerBg}`}>
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
              GRAPHICAL CORRIDOR VERTICAL CROSS-SECTION PROFILE
            </h3>
            <p className="text-[11px] opacity-70 font-sans">
              Side-view flight corridor profile showing terrain, freezing levels, cloud tops & TFR cylinders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-2.5 h-0.5 bg-sky-400 inline-block"></span> FL330 Cruise
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-0.5 bg-cyan-400 stroke-dasharray inline-block"></span> 12,000' Freezing Lvl
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 bg-red-500/40 border border-red-500 inline-block"></span> TFR Airspace
          </span>
        </div>
      </div>

      {/* SVG CROSS-SECTION CANVAS */}
      <div className="w-full h-[260px] rounded-2xl border border-zinc-800 overflow-hidden relative">
        <svg viewBox="0 0 900 320" className="w-full h-full" style={{ backgroundColor: svgBg }}>
          {/* ALTITUDE GRID LINES */}
          <line x1="60" y1="40" x2="860" y2="40" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="44" textAnchor="end" fill="#94a3b8" fontSize="9">FL400</text>

          <line x1="60" y1="90" x2="860" y2="90" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 3" />
          <text x="50" y="94" textAnchor="end" fill="#38bdf8" fontSize="9" fontWeight="bold">FL330</text>

          <line x1="60" y1="160" x2="860" y2="160" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="50" y="164" textAnchor="end" fill="#22d3ee" fontSize="9">12,000'</text>

          <line x1="60" y1="220" x2="860" y2="220" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <text x="50" y="224" textAnchor="end" fill="#94a3b8" fontSize="9">5,000'</text>

          {/* TERRAIN ELEVATION PROFILE */}
          <path
            d="M 60,280 L 150,270 L 300,220 L 450,190 L 600,240 L 750,265 L 860,280 L 860,320 L 60,320 Z"
            fill={isNight ? '#2a0a0a' : isDay ? '#cbd5e1' : '#1e293b'}
            stroke={isNight ? '#ef4444' : isDay ? '#475569' : '#475569'}
            strokeWidth="2"
          />

          {/* TFR AIRSPACE CYLINDER (IF CRITICAL HAZARDS IN CORRIDOR) */}
          <rect x="360" y="200" width="120" height="90" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="420" y="240" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">
            🔴 TFR CYLINDER
          </text>
          <text x="420" y="252" textAnchor="middle" fill="#f87171" fontSize="8">
            SFC - 5,000' MSL
          </text>

          {/* CLOUD LAYERS */}
          <ellipse cx="250" cy="130" rx="60" ry="20" fill="rgba(148,163,184,0.3)" stroke="#94a3b8" strokeWidth="1" />
          <ellipse cx="650" cy="140" rx="80" ry="25" fill="rgba(148,163,184,0.3)" stroke="#94a3b8" strokeWidth="1" />
          <text x="250" y="133" textAnchor="middle" fill="#e2e8f0" fontSize="8">BKN 10,000'</text>

          {/* FLIGHT PATH (FL330 CRUISE TRAJECTORY) */}
          <path
            d="M 80,270 L 180,90 L 740,90 L 840,270"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
          />

          {/* WAYPOINT PINS & ICAO LABELS ALONG PROFILE */}
          {allBriefings.map((b, idx) => {
            const stepWidth = (860 - 60) / (allBriefings.length - 1 || 1);
            const cx = 60 + idx * stepWidth;
            const cy = idx === 0 || idx === allBriefings.length - 1 ? 270 : 90;

            return (
              <g key={b.icao}>
                <circle cx={cx} cy={cy} r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <text x={cx} y={cy - 12} textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
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
