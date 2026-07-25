import React, { useState } from 'react';
import { BriefingSummary } from '../types';
import { FileCode, Search, ShieldCheck, Check, Copy, AlertTriangle } from 'lucide-react';
import { DisplayTheme } from './Header';

interface RawDataInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: BriefingSummary;
  theme: DisplayTheme;
}

export const RawDataInspectorModal: React.FC<RawDataInspectorModalProps> = ({
  isOpen,
  onClose,
  briefing,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'METAR' | 'TAF' | 'NOTAMS'>('NOTAMS');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const rawMetar = briefing.weather.rawMetar || 'No METAR available.';
  const rawTaf = briefing.weather.rawTaf || 'No TAF forecast available.';
  const notamLedger = briefing.allNotamsLedger || [];

  const filteredNotams = notamLedger.filter(
    (n) =>
      !searchTerm ||
      n.rawText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyRaw = () => {
    let content = '';
    if (activeTab === 'METAR') content = rawMetar;
    if (activeTab === 'TAF') content = rawTaf;
    if (activeTab === 'NOTAMS') content = notamLedger.map((n) => n.rawText).join('\n\n');

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className={`w-full max-w-4xl max-h-[85vh] rounded-3xl border p-6 shadow-2xl flex flex-col transition-all ${
        isNight
          ? 'glass-card-night border-red-900 text-red-100'
          : isDay
          ? 'bg-white border-slate-200 text-slate-900'
          : 'glass-card-dark border-zinc-800 text-white'
      }`}>
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight flex items-center gap-2 font-mono">
                <span>RAW DATA INSPECTION — {briefing.icao}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px]">
                  100% VERIFIABLE
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Compare AI briefing summaries against official raw NOAA/FAA text strings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRaw}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Raw Text'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TABS & SEARCH */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            {(['NOTAMS', 'METAR', 'TAF'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab} {tab === 'NOTAMS' && `(${notamLedger.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'NOTAMS' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search raw NOTAM text..."
                className="pl-8 pr-4 py-1.5 rounded-xl border text-xs font-mono bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-56"
              />
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-mono text-xs leading-relaxed">
          {activeTab === 'METAR' && (
            <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 border border-zinc-800 break-words whitespace-pre-wrap select-text">
              <div className="text-[10px] text-zinc-500 mb-1">OFFICIAL RAW METAR STRING:</div>
              {rawMetar}
            </div>
          )}

          {activeTab === 'TAF' && (
            <div className="p-4 rounded-2xl bg-slate-900 text-blue-300 border border-zinc-800 break-words whitespace-pre-wrap select-text">
              <div className="text-[10px] text-zinc-500 mb-1">OFFICIAL RAW TAF FORECAST STRING:</div>
              {rawTaf}
            </div>
          )}

          {activeTab === 'NOTAMS' && (
            <div className="space-y-3">
              {filteredNotams.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-zinc-500 text-xs">
                  No NOTAM strings matched your search term.
                </div>
              ) : (
                filteredNotams.map((notam, idx) => (
                  <div
                    key={notam.id || idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      notam.severity === 'CRITICAL'
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : notam.severity === 'WARNING'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-slate-900 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[10px] tracking-wider text-blue-400">
                        [{notam.id}] — CATEGORY: {notam.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        notam.severity === 'CRITICAL'
                          ? 'bg-red-500 text-white'
                          : notam.severity === 'WARNING'
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {notam.severity}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap select-text leading-relaxed">{notam.rawText}</p>
                    {notam.matchedKeywords?.length > 0 && (
                      <div className="mt-2 text-[10px] text-amber-400">
                        MATCHED KEYWORDS: {notam.matchedKeywords.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
