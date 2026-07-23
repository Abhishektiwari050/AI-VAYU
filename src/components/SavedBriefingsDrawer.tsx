import React from 'react';
import { AuditLogEntry } from '../types';
import { X, History, Trash2, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DisplayTheme } from './Header';

interface SavedBriefingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditLogEntry[];
  onSelectBriefing: (entry: AuditLogEntry) => void;
  onClearHistory: () => void;
  theme?: DisplayTheme;
}

export const SavedBriefingsDrawer: React.FC<SavedBriefingsDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectBriefing,
  onClearHistory,
  theme = 'DARK_COCKPIT',
}) => {
  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const drawerBgClass = isNight
    ? 'glass-card-night border-l border-red-900/60 text-red-100'
    : isDay
    ? 'glass-card-day border-l border-slate-300 text-slate-900'
    : 'glass-card-dark border-l border-zinc-800 text-white';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md font-mono">
      <div className={`h-full w-full max-w-md p-6 shadow-2xl space-y-6 overflow-y-auto ${drawerBgClass}`}>
        {/* Top bar */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isNight ? 'border-red-900/60' : isDay ? 'border-slate-200' : 'border-zinc-800'
        }`}>
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 opacity-80" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">
              AUDIT TRAIL & RECENT BRIEFINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 border transition rounded cursor-pointer ${
              isNight
                ? 'border-red-800/60 hover:bg-red-900/40 text-red-200'
                : isDay
                ? 'border-slate-300 hover:bg-slate-200 text-slate-800'
                : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <div className="py-12 text-center text-xs text-white/40 uppercase tracking-widest border border-white/10 p-6">
            No past briefings recorded in local session cache.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">
              <span>{history.length} SAVED REPORTS</span>
              <button
                onClick={onClearHistory}
                className="flex items-center space-x-1 text-red-500 hover:text-red-400 transition font-bold"
              >
                <Trash2 className="h-3 w-3" />
                <span>CLEAR ALL</span>
              </button>
            </div>

            {history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  onSelectBriefing(entry);
                  onClose();
                }}
                className="group cursor-pointer border border-white/20 bg-black p-4 hover:bg-white hover:text-black transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-lg text-white group-hover:text-black tracking-tight transition">
                      {entry.icao}
                    </span>
                    <span className="border border-white/20 group-hover:border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-black">
                      {entry.flightCategory}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-black transition" />
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-black/80">
                  <span>{new Date(entry.timestampUtc).toLocaleDateString()} {new Date(entry.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center space-x-2">
                    {entry.criticalCount > 0 ? (
                      <span className="text-red-400 group-hover:text-red-700 flex items-center space-x-1 font-black">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>{entry.criticalCount} CRITICAL</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 group-hover:text-emerald-700 flex items-center space-x-1 font-black">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>CLEAR</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
