import React, { useState } from 'react';
import { FlaggedNotam } from '../types';
import {
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Radio,
  Compass,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface NotamCardProps {
  notam: FlaggedNotam;
  isNight?: boolean;
}

export const NotamCard: React.FC<NotamCardProps> = ({ notam, isNight = false }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const parsed = notam.parsedIcao;
  const isCritical = notam.severity === 'CRITICAL';
  const isWarning = notam.severity === 'WARNING';

  const categoryBadgeColors =
    notam.category === 'RUNWAYS_TFRS'
      ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
      : notam.category === 'PROCEDURES_NAVAIDS'
      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
      : notam.category === 'TAXIWAYS_APRON'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
      : notam.category === 'OBSTACLES_LIGHTING'
      ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
      : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';

  const statusBadgeColors =
    notam.effectiveStatus === 'ACTIVE_NOW'
      ? 'bg-red-600 text-white font-bold animate-pulse'
      : notam.effectiveStatus === 'SCHEDULED_FUTURE'
      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
      : 'bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-slate-300';

  const handleCopyRaw = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(notam.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const decodedTitle = notam.title || (parsed?.notamId ? `${parsed.notamId} — ${parsed.qSubjectDecoded || notam.category} ${parsed.qConditionDecoded || ''}` : `NOTAM ${notam.id}`);
  const summaryText = notam.plainEnglishSummary || notam.rawText;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
        isNight
          ? 'bg-red-950/40 border-red-900/60 text-red-100'
          : isCritical
          ? 'bg-red-50/90 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-slate-900 dark:text-white'
          : isWarning
          ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-slate-900 dark:text-white'
          : 'bg-white dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white'
      }`}
    >
      {/* CARD MAIN BAR */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* ROW 1: BADGES & TEMPORAL WINDOW */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            {/* Category Badge */}
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${categoryBadgeColors}`}>
              {notam.category.replace('_', ' ')}
            </span>

            {/* Q-Code Badge if available */}
            {parsed?.qCode && (
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-zinc-800 text-[10px] font-bold">
                Q: {parsed.qCode}
              </span>
            )}
          </div>

          {/* Temporal Active Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${statusBadgeColors}`}>
              {notam.effectiveStatus === 'ACTIVE_NOW'
                ? '🔴 ACTIVE NOW'
                : notam.effectiveStatus === 'SCHEDULED_FUTURE'
                ? '🟡 SCHEDULED FUTURE'
                : '⚪ PERMANENT / EXPIRED'}
            </span>

            {notam.effectiveWindow && (
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium hidden sm:inline">
                {notam.effectiveWindow}
              </span>
            )}
          </div>
        </div>

        {/* ROW 2: DECODED TITLE & 1-SENTENCE SUMMARY */}
        <div className="space-y-1">
          <h4 className="text-sm font-bold font-mono tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            {isCritical && <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span>{decodedTitle}</span>
          </h4>
          <p className="text-xs font-sans font-medium text-slate-700 dark:text-zinc-300 leading-relaxed">
            {summaryText}
          </p>
        </div>

        {/* ROW 3: ACCORDION TOGGLE BUTTON */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 text-xs">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer transition"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isExpanded ? 'Hide Raw String' : 'Verify Raw Government ASCII String'}</span>
          </button>

          <button
            onClick={handleCopyRaw}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied Raw!' : 'Copy Raw'}</span>
          </button>
        </div>
      </div>

      {/* EXPANDABLE ACCORDION: RAW ASCII STRING & ICAO STRUCTURED DATA */}
      {isExpanded && (
        <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
            <span>OFFICIAL ICAO / FAA UNEDITED ASCII DATASTREAM</span>
            <span>NOTAM ID: {parsed?.notamId || notam.id}</span>
          </div>

          {/* Structured ICAO Fields Breakdown */}
          {parsed && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">ITEM A (ICAO)</span>
                <span className="font-bold text-amber-400">{parsed.icao || notam.id}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">Q-CODE</span>
                <span className="font-bold text-emerald-400">{parsed.qCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">ITEM B (WEF)</span>
                <span className="text-slate-300">{parsed.effectiveStartFormatted || parsed.effectiveStartRaw || 'WEF'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-bold">ITEM C (TIL)</span>
                <span className="text-slate-300">{parsed.effectiveEndFormatted || parsed.effectiveEndRaw || 'TIL'}</span>
              </div>
            </div>
          )}

          {/* Unedited Government Raw Body */}
          <div className="bg-black/60 p-3 rounded-lg border border-slate-800 text-[11px] leading-relaxed break-all font-mono text-emerald-300">
            {notam.rawText}
          </div>
        </div>
      )}
    </div>
  );
};
