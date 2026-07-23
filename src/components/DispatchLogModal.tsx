import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { X, Copy, Check, FileCheck, ShieldCheck } from 'lucide-react';
import { DisplayTheme } from './Header';

interface DispatchLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: BriefingSummary | null;
  theme?: DisplayTheme;
}

export const DispatchLogModal: React.FC<DispatchLogModalProps> = ({
  isOpen,
  onClose,
  briefing,
  theme = 'DARK_COCKPIT',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !briefing) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const modalGlassClass = isNight
    ? 'glass-card-night border border-red-900/80 text-red-100'
    : isDay
    ? 'glass-card-day border border-slate-300 text-slate-900'
    : 'glass-card-dark border border-zinc-800 text-white';

  const dispatchText = `================================================================
 OFFICIAL FLIGHT DISPATCH AUDIT LOG — PROJECT VAYU
================================================================
DISPATCH REF ID: VAYU-${briefing.icao}-${Date.now().toString(36).toUpperCase()}
TIMESTAMP (UTC): ${briefing.generatedAtUtc}
AIRPORT ICAO:    ${briefing.icao} (${briefing.airportName})
FLIGHT RULES:    ${briefing.weather.flightCategory}
DATA FEED PIPE:  FAA SWIM Direct Feed (Primary) / NOAA Aviation Weather (Secondary)

----------------------------------------------------------------
1. METAR METEOROLOGICAL RECORD
----------------------------------------------------------------
RAW METAR: ${briefing.weather.rawMetar}
DECODE:    ${briefing.weather.plainEnglishSummary}

----------------------------------------------------------------
2. DETERMINISTIC SAFETY ENGINE AUDIT (${briefing.deterministicRulesTriggered} RULES MATCHED)
----------------------------------------------------------------
CRITICAL RUNWAY / AIRSPACE CLOSURES (${briefing.criticalCount}):
${
  briefing.criticalAlerts.length > 0
    ? briefing.criticalAlerts
        .map(
          (c, i) =>
            `  [${i + 1}] CATEGORY: ${c.category}\n      TITLE:    ${c.title}\n      DETAILS:  ${c.plainEnglish}\n      RAW:      ${c.rawSnippet}`
        )
        .join('\n\n')
    : '  [NONE REPORTED]'
}

OPERATIONAL ADVISORIES & NAVAIDS (${briefing.warningCount}):
${
  briefing.warnings.length > 0
    ? briefing.warnings
        .map(
          (w, i) =>
            `  [${i + 1}] CATEGORY: ${w.category}\n      TITLE:    ${w.title}\n      DETAILS:  ${w.plainEnglish}\n      RAW:      ${w.rawSnippet}`
        )
        .join('\n\n')
    : '  [NONE REPORTED]'
}

----------------------------------------------------------------
3. PILOT-IN-COMMAND (PIC) ACKNOWLEDGEMENT & DISPATCH DISCHARGE
----------------------------------------------------------------
PIC STATEMENT: ${briefing.picTakeaway}

MANDATORY REGULATORY LEGAL ADVISORY:
ADVISORY ONLY: Project VAYU is an informational pre-flight awareness utility. Pilots retain sole operational authority under DGCA and FAA regulations.
================================================================`;

  const copyLog = () => {
    navigator.clipboard.writeText(dispatchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono">
      <div className={`w-full max-w-3xl p-6 shadow-2xl space-y-4 rounded-2xl ${modalGlassClass}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              OFFICIAL DISPATCH AUDIT LOG
            </h2>
            <div className="flex items-center space-x-1 border border-emerald-500/30 bg-emerald-950/60 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
              <ShieldCheck className="h-3 w-3" />
              <span>FAA SWIM CERTIFIED</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-white/20 hover:bg-white hover:text-black transition text-white cursor-pointer rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Log Body */}
        <div className="relative">
          <pre className="h-96 w-full overflow-y-auto border border-white/20 bg-black p-4 text-xs leading-relaxed text-white/90 font-mono whitespace-pre-wrap selection:bg-emerald-500 selection:text-black rounded-xl">
            {dispatchText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-white/20">
          <button
            onClick={copyLog}
            className="flex items-center space-x-2 border border-emerald-500 bg-emerald-500 text-black font-black text-xs px-4 py-2 hover:bg-emerald-400 transition cursor-pointer rounded-xl"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'LOG COPIED' : 'COPY DISPATCH AUDIT LOG'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
