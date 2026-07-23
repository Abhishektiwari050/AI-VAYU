import React, { useState } from 'react';
import { BriefingSummary, FlightCategory } from '../types';
import {
  ChevronDown,
  Share2,
  Printer,
  FileCode,
  Check,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { DisplayTheme, FontSizeSetting } from './Header';
import { formatZuluAndLocalTime, evaluateNotamStatusWindow } from '../lib/timezoneUtils';

interface ExecutiveBriefingViewProps {
  briefing: BriefingSummary;
  theme: DisplayTheme;
  fontSize: FontSizeSetting;
  onOpenKneeboard: () => void;
  onOpenDispatchModal: () => void;
  onSearchSingle?: (icao: string) => void;
}

export const ExecutiveBriefingView: React.FC<ExecutiveBriefingViewProps> = ({
  briefing,
  theme,
  onOpenKneeboard,
  onOpenDispatchModal,
}) => {
  const [expandedNotam, setExpandedNotam] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const timeInfo = formatZuluAndLocalTime(briefing.icao, new Date(briefing.generatedAtUtc || Date.now()));

  const getWeatherPillCategory = (category: FlightCategory) => {
    if (isNight) {
      return { dot: '🔴', label: category, colorClass: 'glass-pill-red text-red-200 font-bold' };
    }
    if (isDay) {
      switch (category) {
        case 'VFR':
          return { dot: '🟢', label: 'VFR', colorClass: 'bg-emerald-100 border border-emerald-500 text-emerald-950 font-black shadow-sm' };
        case 'MVFR':
          return { dot: '🟡', label: 'MVFR', colorClass: 'bg-amber-100 border border-amber-500 text-amber-950 font-black shadow-sm' };
        case 'IFR':
        case 'LIFR':
          return { dot: '🔴', label: category, colorClass: 'bg-red-100 border border-red-500 text-red-950 font-black shadow-sm' };
        default:
          return { dot: '⚪', label: 'UNK', colorClass: 'bg-slate-200 border border-slate-400 text-slate-900 font-black shadow-sm' };
      }
    }
    switch (category) {
      case 'VFR':
        return { dot: '🟢', label: 'VFR', colorClass: 'glass-pill-green text-emerald-200 font-bold' };
      case 'MVFR':
        return { dot: '🟡', label: 'MVFR', colorClass: 'glass-pill-yellow text-amber-200 font-bold' };
      case 'IFR':
      case 'LIFR':
        return { dot: '🔴', label: category, colorClass: 'glass-pill-red text-red-200 font-bold' };
      default:
        return { dot: '⚪', label: 'UNK', colorClass: 'glass-pill-neutral text-zinc-300 font-bold' };
    }
  };

  const handleCopySummary = () => {
    const text = `✈ VAYU Briefing: ${briefing.icao} (${timeInfo.combinedString})
------------------------------
🌤 Weather: ${briefing.weather.flightCategory} (${briefing.weather.plainEnglishSummary})
🔴 Critical (${briefing.criticalCount}):
${briefing.criticalAlerts.map((a) => ` • ${a.title}: ${a.plainEnglish}`).join('\n') || ' None'}
🟡 Advisories (${briefing.warningCount}):
${briefing.warnings.map((w) => ` • ${w.title}: ${w.plainEnglish}`).join('\n') || ' None'}
------------------------------
ADVISORY ONLY: Informational pre-flight awareness utility under DGCA and FAA regulations.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const weatherConfig = getWeatherPillCategory(briefing.weather.flightCategory);

  const cardGlassClass = isNight
    ? 'glass-card-night text-red-100'
    : isDay
    ? 'glass-card-day text-slate-900'
    : 'glass-card-dark text-white';

  const criticalCardClass = isNight
    ? 'glass-card-critical-night text-red-100'
    : isDay
    ? 'glass-card-critical-day text-slate-900'
    : 'glass-card-critical-dark text-white';

  const advisoryCardClass = isNight
    ? 'glass-card-advisory-night text-red-100'
    : isDay
    ? 'glass-card-advisory-day text-slate-900'
    : 'glass-card-advisory-dark text-white';

  return (
    <div className={`w-full font-sans p-4 sm:p-6 transition-colors duration-300 ${
      isNight ? 'text-red-100' : isDay ? 'text-slate-900' : 'text-white'
    }`}>
      
      {/* MANDATORY LEGAL FAR PART 91.3 ADVISORY DISCLAIMER BANNER */}
      <div className={`p-3 rounded-2xl border text-[11px] font-mono mb-6 flex items-start gap-2.5 shadow-sm ${
        isNight
          ? 'bg-red-950/60 border-red-800/80 text-red-300'
          : isDay
          ? 'bg-amber-100/90 border-amber-400 text-amber-950'
          : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300'
      }`}>
        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDay ? 'text-amber-900' : 'text-amber-400'}`} />
        <div className="leading-snug">
          <strong className={`font-bold uppercase tracking-wider ${isDay ? 'text-amber-900 font-black' : 'text-amber-400'}`}>FAR PART 91.3 PIC RESPONSIBILITY DISCLAIMER:</strong>{' '}
          Project VAYU is an informational pre-flight awareness utility. It does not replace official FAA briefings via 1800wxbrief.com or official flight service stations. The Pilot-in-Command retains sole operational authority.
        </div>
      </div>

      {/* HERO AIRPORT TITLE, LOCAL TIME & WEATHER PILL */}
      <div className="text-center my-6">
        <h1 className={`text-5xl sm:text-7xl font-mono font-medium tracking-wider mb-1 ${
          isNight ? 'text-red-400' : isDay ? 'text-slate-900' : 'text-white'
        }`}>
          {briefing.icao}
        </h1>
        <p className={`text-xs sm:text-sm font-normal mb-2 ${
          isNight ? 'text-red-300/70' : isDay ? 'text-slate-600' : 'text-zinc-400'
        }`}>
          {briefing.airportName}
        </p>

        {/* Both Zulu Time & Local Airport Time Normalization */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold mb-4 border ${
          isNight ? 'bg-red-950/40 border-red-900/60 text-red-300' : isDay ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-black/80 border-zinc-800 text-zinc-200'
        }`}>
          <Clock className="w-3.5 h-3.5 opacity-80" />
          <span>{timeInfo.combinedString}</span>
        </div>

        <div className="flex justify-center px-2">
          {/* Centered Weather Pill */}
          <div className={`inline-flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2 rounded-full border text-xs font-mono font-medium shadow-inner flex-wrap max-w-full ${weatherConfig.colorClass}`}>
            <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${
              isNight ? 'led-glow-red' : weatherConfig.label === 'VFR' ? 'led-glow-green' : weatherConfig.label === 'MVFR' ? 'led-glow-yellow' : 'led-glow-red'
            }`} />
            <span className="font-bold">{weatherConfig.label}</span>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span>Winds {briefing.weather.windInfo}</span>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span>Vis {briefing.weather.visibilityInfo}</span>
          </div>
        </div>
      </div>

      {/* CRITICAL ATTENTION SECTION */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase mb-3 ${
          isNight ? 'text-red-500' : isDay ? 'text-red-700 font-black' : 'text-red-500'
        }`}>
          <span className="w-3 h-3 rounded-full led-glow-red inline-block shrink-0" />
          <span>CRITICAL ATTENTION ({briefing.criticalCount})</span>
        </div>

        {briefing.criticalAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {briefing.criticalAlerts.map((alert, idx) => {
              const notamWindow = evaluateNotamStatusWindow(alert.rawSnippet, undefined, isDay);

              return (
                <div
                  key={alert.id || idx}
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all ${criticalCardClass}`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className={`text-sm font-semibold leading-snug ${
                        isNight ? 'text-red-200' : isDay ? 'text-red-950' : 'text-white'
                      }`}>
                        {alert.title}
                      </h3>
                      <span className="w-3 h-3 rounded-full led-glow-red shrink-0 mt-0.5" />
                    </div>
                    
                    {/* Active Status Badge */}
                    <div className="mb-2">
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider inline-flex items-center gap-1.5 ${notamWindow.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${notamWindow.label.includes('ACTIVE') ? 'led-glow-green' : 'led-glow-yellow'}`} />
                        <span>{notamWindow.label}</span>
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed font-sans ${
                      isNight ? 'text-red-300/80' : isDay ? 'text-slate-700' : 'text-zinc-300'
                    }`}>
                      {alert.plainEnglish}
                    </p>
                  </div>

                  <div className={`mt-3 pt-2.5 border-t flex justify-between items-center ${
                    isNight ? 'border-red-900/50' : isDay ? 'border-slate-200' : 'border-zinc-800'
                  }`}>
                    <button
                      onClick={() => setExpandedNotam(expandedNotam === idx ? null : idx)}
                      className={`text-[10px] font-mono flex items-center gap-1 transition cursor-pointer ${
                        isNight ? 'text-red-400 hover:text-red-200' : isDay ? 'text-slate-500 hover:text-slate-800' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <span>[RAW NOTAM #{alert.id?.slice(0, 6) || '07/142'}]</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${expandedNotam === idx ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {expandedNotam === idx && (
                    <div className={`mt-2 p-2 rounded-lg border text-[10px] font-mono break-all leading-tight ${
                      isNight ? 'bg-black/80 border-red-900/60 text-red-300' : isDay ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-black/80 border-zinc-800 text-zinc-300'
                    }`}>
                      {alert.rawSnippet}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`border rounded-xl p-4 text-center text-xs font-mono ${
            isNight ? 'bg-red-950/40 border-red-900/40 text-red-400/80' : isDay ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-[#141213] border-zinc-800/80 text-zinc-500'
          }`}>
            No active runway closures, TFR airspace, or braking action hazards reported.
          </div>
        )}
      </div>

      {/* AIRPORT ADVISORIES SECTION */}
      <div className="mb-6">
        <div className={`flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase mb-3 ${
          isNight ? 'text-amber-500' : isDay ? 'text-amber-700' : 'text-amber-400'
        }`}>
          <span className="w-3 h-3 rounded-full led-glow-yellow inline-block" />
          <span>AIRPORT ADVISORIES ({briefing.warningCount})</span>
        </div>

        {briefing.warnings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {briefing.warnings.map((warn, idx) => (
              <div
                key={warn.id || idx}
                className={`rounded-2xl p-4 flex flex-col justify-between transition-all ${advisoryCardClass}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className={`text-sm font-semibold leading-snug ${
                      isNight ? 'text-red-200' : isDay ? 'text-slate-900' : 'text-white'
                    }`}>
                      {warn.title}
                    </h3>
                    {warn.plainEnglish && (
                      <p className={`text-xs leading-relaxed font-sans mt-1 ${
                        isNight ? 'text-red-300/80' : isDay ? 'text-slate-700' : 'text-zinc-300'
                      }`}>
                        {warn.plainEnglish}
                      </p>
                    )}
                  </div>
                  <span className="w-3 h-3 rounded-full led-glow-yellow shrink-0 mt-0.5" />
                </div>

                <div className={`mt-3 pt-2 border-t text-[10px] font-mono ${
                  isNight ? 'border-amber-900/40 text-red-400/80' : isDay ? 'border-slate-200 text-slate-500' : 'border-zinc-800 text-zinc-500'
                }`}>
                  [RAW NOTAM #{warn.id?.slice(0, 6) || '07/142'}]
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`border rounded-xl p-4 text-center text-xs font-mono ${
            isNight ? 'bg-red-950/40 border-red-900/40 text-red-400/80' : isDay ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-[#141312] border-zinc-800/80 text-zinc-500'
          }`}>
            No NavAid outages, approach procedure modifications, or taxiway restrictions.
          </div>
        )}
      </div>

      {/* BOTTOM ACTION DOCK */}
      <div className={`border rounded-2xl p-3 flex flex-wrap items-center justify-center gap-3 mt-8 transition-colors duration-300 ${cardGlassClass}`}>
        <button
          onClick={handleCopySummary}
          className={`text-xs font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border ${
            isNight
              ? 'bg-red-900/60 border-red-800 text-red-100 hover:bg-red-800'
              : isDay
              ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-200'
              : 'bg-zinc-800/80 border-zinc-700/80 text-white hover:bg-zinc-700/90'
          }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Share2 className="w-3.5 h-3.5 opacity-80" />
          )}
          <span>{copied ? 'Copied Briefing' : 'Share Briefing (Copy)'}</span>
        </button>

        <button
          onClick={onOpenKneeboard}
          className={`text-xs font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border ${
            isNight
              ? 'bg-red-900/60 border-red-800 text-red-100 hover:bg-red-800'
              : isDay
              ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-200'
              : 'bg-zinc-800/80 border-zinc-700/80 text-white hover:bg-zinc-700/90'
          }`}
        >
          <Printer className="w-3.5 h-3.5 opacity-80" />
          <span>Export Dispatch PDF</span>
        </button>

        <button
          onClick={onOpenDispatchModal}
          className={`text-xs font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border ${
            isNight
              ? 'bg-red-900/60 border-red-800 text-red-100 hover:bg-red-800'
              : isDay
              ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-200'
              : 'bg-zinc-800/80 border-zinc-700/80 text-white hover:bg-zinc-700/90'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dispatch Log</span>
        </button>
      </div>
    </div>
  );
};
