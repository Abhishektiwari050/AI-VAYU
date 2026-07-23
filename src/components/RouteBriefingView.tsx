import React from 'react';
import { RouteLegBriefing } from '../types';
import { Compass, ArrowRight, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ExecutiveBriefingView } from './ExecutiveBriefingView';
import { DisplayTheme, FontSizeSetting } from './Header';

interface RouteBriefingViewProps {
  routeData: RouteLegBriefing;
  theme: DisplayTheme;
  fontSize: FontSizeSetting;
  onOpenKneeboard: () => void;
  onOpenDispatchModal: () => void;
}

export const RouteBriefingView: React.FC<RouteBriefingViewProps> = ({
  routeData,
  theme,
  fontSize,
  onOpenKneeboard,
  onOpenDispatchModal,
}) => {
  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const allBriefings = [
    routeData.origin,
    ...routeData.alternatesAndWaypoints,
    routeData.destination,
  ];

  const totalCriticals = allBriefings.reduce((sum, b) => sum + b.criticalCount, 0);
  const totalWarnings = allBriefings.reduce((sum, b) => sum + b.warningCount, 0);

  const headerBoxClass = isNight
    ? 'glass-card-night border-red-900/60 text-red-100'
    : isDay
    ? 'glass-card-day border-slate-300 text-slate-900'
    : 'glass-card-dark border-zinc-800 text-white';

  return (
    <div className="space-y-8 font-mono">
      {/* Route Corridor Header Bar */}
      <div className={`border rounded-2xl p-6 sm:p-8 transition-colors ${headerBoxClass}`}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className={`flex items-center space-x-2 text-xs uppercase tracking-widest ${
              isNight ? 'text-red-300' : isDay ? 'text-slate-600' : 'text-zinc-400'
            }`}>
              <Compass className="h-4 w-4 opacity-80" />
              <span>FLIGHT ROUTE CORRIDOR BRIEFING</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center space-x-4 text-3xl font-black tracking-tighter">
              <span>{routeData.origin.icao}</span>
              <ArrowRight className="h-6 w-6 opacity-40" />
              {routeData.alternatesAndWaypoints.map((w) => (
                <React.Fragment key={w.icao}>
                  <span className="opacity-70 text-xl font-bold">{w.icao}</span>
                  <ArrowRight className="h-5 w-5 opacity-40" />
                </React.Fragment>
              ))}
              <span>{routeData.destination.icao}</span>
            </div>
          </div>

          {/* Risk Indicator */}
          <div className={`flex items-center space-x-3 border p-4 rounded-xl ${
            isNight ? 'border-red-900/40 bg-red-950/40' : isDay ? 'border-slate-200 bg-slate-100' : 'border-zinc-800 bg-black/40'
          }`}>
            <div>
              <div className={`text-[10px] uppercase tracking-widest mb-1 ${
                isNight ? 'text-red-400' : isDay ? 'text-slate-500' : 'text-zinc-500'
              }`}>
                CORRIDOR RISK PROFILE
              </div>
              <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest">
                {totalCriticals > 0 ? (
                  <span className="glass-pill-red text-red-100 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm font-bold">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span>HIGH RISK ({totalCriticals} CRITICAL)</span>
                  </span>
                ) : totalWarnings > 0 ? (
                  <span className="glass-pill-yellow text-amber-100 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm font-bold">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    <span>MODERATE ADVISORY ({totalWarnings} WARNINGS)</span>
                  </span>
                ) : (
                  <span className="glass-pill-green text-emerald-100 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>CLEAR CORRIDOR</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className={`mt-4 text-xs font-sans border-t pt-4 leading-relaxed ${
          isNight ? 'border-red-900/30 text-red-200/90' : isDay ? 'border-slate-200 text-slate-700' : 'border-zinc-800 text-zinc-300'
        }`}>
          {routeData.routeSummaryText}
        </p>
      </div>

      {/* Leg Tabs & Individual Airport Cards */}
      <div className="space-y-12">
        {allBriefings.map((briefing, idx) => {
          const isOrigin = idx === 0;
          const isDest = idx === allBriefings.length - 1;
          const legLabel = isOrigin ? 'ORIGIN DEPARTURE' : isDest ? 'DESTINATION ARRIVAL' : `EN-ROUTE WAYPOINT #${idx}`;

          return (
            <div key={briefing.icao} className="space-y-4">
              <div className={`flex items-center space-x-3 text-xs font-black uppercase tracking-[0.2em] border-l-4 pl-3 py-1.5 rounded-r-lg ${
                isNight
                  ? 'border-red-500 bg-red-950/60 text-red-100'
                  : isDay
                  ? 'border-slate-900 bg-slate-200 text-slate-900'
                  : 'border-zinc-400 bg-zinc-900/90 text-white'
              }`}>
                <span>SEGMENT 0{idx + 1} / {legLabel} ({briefing.icao})</span>
              </div>

              <ExecutiveBriefingView
                briefing={briefing}
                theme={theme}
                fontSize={fontSize}
                onOpenKneeboard={onOpenKneeboard}
                onOpenDispatchModal={onOpenDispatchModal}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
