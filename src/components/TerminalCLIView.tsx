import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { Terminal, Copy, Check } from 'lucide-react';
import { DisplayTheme } from './Header';

interface TerminalCLIViewProps {
  briefing: BriefingSummary;
  theme?: DisplayTheme;
}

export const TerminalCLIView: React.FC<TerminalCLIViewProps> = ({ briefing, theme = 'DARK_COCKPIT' }) => {
  const [copied, setCopied] = useState(false);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  // Format exact ANSI / Terminal text representation
  const terminalOutput = `=====================================================
 SKYBRIEF / VAYU — PRE-FLIGHT BRIEFING [${briefing.icao}]
=====================================================
[*] Ingesting live NOAA/FAA feeds for ${briefing.icao}...
    └─ METAR: Received (${briefing.weather.flightCategory})
    └─ NOTAMs: ${briefing.totalNotamsIngested} active records fetched
[*] Executing Deterministic Safety Engine...
    └─ ALERT: ${briefing.deterministicRulesTriggered} safety patterns matched (${briefing.criticalCount} Critical, ${briefing.warningCount} Warnings)

--- 1. WEATHER & CONDITIONS ---
METAR Raw: ${briefing.weather.rawMetar}
Category:  ${briefing.weather.flightCategory}
Summary:   ${briefing.weather.plainEnglishSummary}

--- 2. 🔴 CRITICAL ALERTS (${briefing.criticalCount}) ---
${
  briefing.criticalAlerts.length > 0
    ? briefing.criticalAlerts
        .map((c) => ` • [${c.category}] ${c.title}\n   └─ Plain English: ${c.plainEnglish}\n   └─ Raw: ${c.rawSnippet}`)
        .join('\n')
    : ' • NO CRITICAL RUNWAY CLOSURES OR TFRs DETECTED'
}

--- 3. 🟡 WARNINGS & NAVAIDS (${briefing.warningCount}) ---
${
  briefing.warnings.length > 0
    ? briefing.warnings
        .map((w) => ` • [${w.category}] ${w.title}\n   └─ Plain English: ${w.plainEnglish}\n   └─ Raw: ${w.rawSnippet}`)
        .join('\n')
    : ' • NO OPERATIONAL NAVAID OR TAXIWAY WARNINGS'
}

--- 4. ⚪ INFORMATION & OBSTACLES (${briefing.infoItems.length}) ---
${
  briefing.infoItems.length > 0
    ? briefing.infoItems.map((i) => ` • ${i.plainEnglish}`).join('\n')
    : ' • NO ADDITIONAL INFORMATIONAL NOTICES'
}

=====================================================
 PIC TAKEAWAY: ${briefing.picTakeaway}
=====================================================
ADVISORY ONLY: Informational pre-flight awareness utility under FAR Part 91.3.`;

  const copyTerminalText = () => {
    navigator.clipboard.writeText(terminalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const terminalBg = isNight
    ? 'bg-[#120202] border-red-900/60 text-red-200'
    : isDay
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-black border-zinc-800 text-white';

  return (
    <div className={`border font-mono shadow-2xl rounded-2xl overflow-hidden transition-colors ${terminalBg}`}>
      {/* Terminal Titlebar */}
      <div className={`flex items-center justify-between border-b px-6 py-3 text-xs ${
        isNight ? 'border-red-900/60 bg-red-950/60 text-red-300' : isDay ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <span className="h-2.5 w-2.5 bg-red-600 rounded-full inline-block"></span>
            <span className="h-2.5 w-2.5 bg-yellow-500 rounded-full inline-block"></span>
            <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full inline-block"></span>
          </div>
          <Terminal className="h-3.5 w-3.5 opacity-70 ml-2" />
          <span className="font-bold uppercase tracking-widest text-[11px]">vayu-cli --brief --icao {briefing.icao}</span>
        </div>

        <button
          onClick={copyTerminalText}
          className={`flex items-center space-x-1.5 border px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition cursor-pointer ${
            isNight
              ? 'border-red-800 bg-red-950 text-red-200 hover:bg-red-900'
              : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? 'COPIED CLI' : 'COPY RAW CLI'}</span>
        </button>
      </div>

      {/* Terminal Body */}
      <div className="p-6 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-500 selection:text-black">
        {terminalOutput.split('\n').map((line, idx) => {
          if (line.includes('🔴 CRITICAL ALERTS') || line.includes('ALERT:')) {
            return (
              <div key={idx} className="text-red-400 font-bold tracking-wide">
                {line}
              </div>
            );
          }
          if (line.includes('🟡 WARNINGS') || line.includes('ADVISORY')) {
            return (
              <div key={idx} className="text-amber-300 font-semibold tracking-wide">
                {line}
              </div>
            );
          }
          if (line.includes('METAR Raw:') || line.includes('SUMMARY') || line.includes('SKYBRIEF')) {
            return (
              <div key={idx} className="text-emerald-400 font-semibold">
                {line}
              </div>
            );
          }
          if (line.includes('PIC TAKEAWAY:')) {
            return (
              <div key={idx} className="text-black font-bold bg-amber-400 p-2 my-2 border-l-4 border-black">
                {line}
              </div>
            );
          }
          return <div key={idx}>{line}</div>;
        })}
      </div>
    </div>
  );
};
