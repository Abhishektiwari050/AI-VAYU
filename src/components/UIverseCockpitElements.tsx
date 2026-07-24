import React from 'react';
import { Radio, ShieldAlert, Zap, Compass, CheckCircle2 } from 'lucide-react';
import { FlightCategory } from '../types';

/**
 * UIverse-inspired Radar Sweep Telemetry Loader for Project VAYU
 */
export const VayuRadarLoader: React.FC<{ message?: string }> = ({ message = 'Ingesting Live NOAA METAR, TAF & FAA NOTAM Feeds...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 font-mono">
      <div className="relative w-28 h-28 rounded-full border-2 border-emerald-500/40 bg-black/80 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.25)] overflow-hidden">
        {/* Concentric Range Rings */}
        <div className="absolute w-20 h-20 rounded-full border border-emerald-500/30"></div>
        <div className="absolute w-12 h-12 rounded-full border border-emerald-500/40"></div>
        <div className="absolute w-4 h-4 rounded-full bg-emerald-500/80 animate-ping"></div>

        {/* Crosshair Axes */}
        <div className="absolute w-full h-[1px] bg-emerald-500/30"></div>
        <div className="absolute h-full w-[1px] bg-emerald-500/30"></div>

        {/* Radar Rotating Sweep Beam */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            animationDuration: '2.5s',
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16,185,129,0.5) 360deg)',
          }}
        ></div>
      </div>

      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-2">
          <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
          <span>RADAR TELEMETRY INGESTION</span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-sm font-sans">{message}</p>
      </div>
    </div>
  );
};

/**
 * UIverse-inspired Cyberpunk Glassmorphic Critical Hazard Card
 */
export const CyberHazardCard: React.FC<{
  title: string;
  category: string;
  plainEnglish: string;
  rawSnippet: string;
  effectiveWindow?: string;
}> = ({ title, category, plainEnglish, rawSnippet, effectiveWindow }) => {
  return (
    <div className="relative p-5 rounded-2xl border border-red-500/60 bg-gradient-to-b from-red-950/40 to-black/80 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all font-mono">
      {/* Top Hazard Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-900/60 border border-red-700 text-red-200">
            {category}
          </span>
        </div>
        {effectiveWindow && (
          <span className="text-[10px] text-amber-400 font-bold">
            {effectiveWindow}
          </span>
        )}
      </div>

      <h4 className="text-sm font-bold text-red-200 leading-snug mb-1.5">{title}</h4>
      <p className="text-xs font-sans text-zinc-300 leading-relaxed mb-3">{plainEnglish}</p>

      <div className="p-2.5 rounded-xl bg-black/90 border border-red-900/50 text-[11px] font-mono text-amber-300 break-all leading-tight">
        {rawSnippet}
      </div>
    </div>
  );
};

/**
 * UIverse-inspired Tactical LED Status Badge
 */
export const AviationStatusBadge: React.FC<{ category: FlightCategory }> = ({ category }) => {
  const getBadgeConfig = () => {
    switch (category) {
      case 'VFR':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
          dot: 'bg-emerald-400 animate-pulse',
        };
      case 'MVFR':
        return {
          bg: 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'IFR':
      case 'LIFR':
        return {
          bg: 'bg-red-950/80 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
          dot: 'bg-red-400 animate-ping',
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider ${config.bg}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      <span>FLIGHT RULES: {category}</span>
    </div>
  );
};
