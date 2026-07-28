import React, { useState } from 'react';
import { FlaggedNotam } from '../types';
import { Navigation, AlertTriangle, ShieldAlert, Radio, Layers, MapPin, Zap } from 'lucide-react';

interface CorridorGisMapProps {
  icao: string;
  airportName?: string;
  notams: FlaggedNotam[];
  flightCategory?: string;
}

export const CorridorGisMap: React.FC<CorridorGisMapProps> = ({
  icao,
  airportName,
  notams,
  flightCategory = 'VFR',
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RUNWAYS' | 'HAZARDS'>('OVERVIEW');
  const [selectedPin, setSelectedPin] = useState<FlaggedNotam | null>(null);

  const criticalCount = notams.filter((n) => n.severity === 'CRITICAL').length;
  const warningCount = notams.filter((n) => n.severity === 'WARNING').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8 shadow-xl">
      {/* Map Header Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-md text-indigo-400">
            <Navigation size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide font-mono">{icao}</span>
              <span className="text-xs text-slate-400">• {airportName || 'Aerodrome Corridor'}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  flightCategory === 'VFR'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : flightCategory === 'IFR'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {flightCategory}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            GIS Vector Map
          </button>
          <button
            onClick={() => setActiveTab('RUNWAYS')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'RUNWAYS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Runway Diagrams
          </button>
          <button
            onClick={() => setActiveTab('HAZARDS')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'HAZARDS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hazard Pins ({criticalCount + warningCount})
          </button>
        </div>
      </div>

      {/* SVG Interactive Vector Canvas */}
      <div className="relative bg-slate-950 h-72 w-full overflow-hidden flex items-center justify-center border-b border-slate-800">
        {/* Background Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Radar Range Rings */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 600 300">
          <circle cx="300" cy="150" r="60" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="300" cy="150" r="120" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="300" cy="150" r="180" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
        </svg>

        {/* Primary Vector Render Area */}
        <div className="relative z-10 w-full h-full flex items-center justify-center p-6">
          {activeTab === 'OVERVIEW' && (
            <div className="relative w-full max-w-xl h-full flex items-center justify-between px-8">
              {/* Origin Node */}
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 font-mono font-bold text-xs shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  {icao}
                </div>
                <span className="text-[11px] font-mono font-semibold text-emerald-400">ORIGIN</span>
              </div>

              {/* Route Corridor Polyline */}
              <div className="relative flex-1 mx-4 h-0.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-sky-400 flex items-center justify-center">
                <div className="absolute top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-900 border border-indigo-500/40 rounded text-[10px] font-mono text-indigo-300 shadow">
                  CORRIDOR 250° • 12 NM BUFFER
                </div>
                {/* Animated Flight Indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 left-1/3 animate-pulse text-indigo-400">
                  <Navigation size={16} className="rotate-90" />
                </div>
              </div>

              {/* Destination Node */}
              <div className="flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-300 font-mono font-bold text-xs shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                  DEST
                </div>
                <span className="text-[11px] font-mono font-semibold text-sky-400">APPROACH</span>
              </div>
            </div>
          )}

          {activeTab === 'RUNWAYS' && (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-center gap-8 mb-4">
                {/* Simulated Runway 1 */}
                <div className="relative w-48 h-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-between px-3 font-mono text-xs text-white">
                  <span className="font-bold text-emerald-400">11L</span>
                  <div className="flex-1 mx-2 h-0.5 border-t border-dashed border-slate-500" />
                  <span className="font-bold text-emerald-400">29R</span>
                  {criticalCount > 0 && (
                    <div className="absolute inset-0 bg-rose-950/80 border-2 border-rose-500 rounded flex items-center justify-center gap-1 text-rose-200 font-bold text-[11px]">
                      <ShieldAlert size={14} className="text-rose-400" /> RWY CLOSED VIA NOTAM
                    </div>
                  )}
                </div>

                {/* Simulated Runway 2 */}
                <div className="relative w-48 h-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-between px-3 font-mono text-xs text-white">
                  <span className="font-bold text-emerald-400">09</span>
                  <div className="flex-1 mx-2 h-0.5 border-t border-dashed border-slate-500" />
                  <span className="font-bold text-emerald-400">27</span>
                  <div className="absolute -top-2 right-2 px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] rounded">
                    OPEN
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Interactive Aerodrome Runway Status • Click NOTAM card to inspect raw details
              </p>
            </div>
          )}

          {activeTab === 'HAZARDS' && (
            <div className="w-full max-w-lg space-y-2 overflow-y-auto max-h-56 pr-2">
              {notams.filter((n) => n.severity !== 'INFO').length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">
                  No active critical hazards or warnings reported on corridor map.
                </div>
              ) : (
                notams
                  .filter((n) => n.severity !== 'INFO')
                  .slice(0, 5)
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedPin(n)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        n.severity === 'CRITICAL'
                          ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-900/40 text-rose-200'
                          : 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-900/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="font-bold uppercase tracking-wider">{n.category}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                          {n.id}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-slate-300 text-[11px]">{n.rawText}</p>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Live GIS Telemetry Badge */}
        <div className="absolute bottom-2 right-3 flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <Zap size={12} className="text-indigo-400" />
          <span>VAYU GIS Telemetry Layer Active</span>
        </div>
      </div>
    </div>
  );
};
