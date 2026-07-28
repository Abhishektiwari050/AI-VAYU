import React, { useMemo } from 'react';
import { FlaggedNotam, NotamBucket, SeverityLevel } from '../types';
import { Filter, Search, ShieldAlert, CheckCircle2, Clock, MapPin } from 'lucide-react';

interface NotamLedgerFiltersProps {
  notams: FlaggedNotam[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: NotamBucket | 'ALL';
  onCategoryChange: (cat: NotamBucket | 'ALL') => void;
  selectedSeverity: SeverityLevel | 'ALL';
  onSeverityChange: (sev: SeverityLevel | 'ALL') => void;
  selectedStatus: string | 'ALL';
  onStatusChange: (status: string | 'ALL') => void;
  selectedRunway: string | 'ALL';
  onRunwayChange: (rwy: string | 'ALL') => void;
}

export const NotamLedgerFilters: React.FC<NotamLedgerFiltersProps> = ({
  notams,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSeverity,
  onSeverityChange,
  selectedStatus,
  onStatusChange,
  selectedRunway,
  onRunwayChange,
}) => {
  // Extract all distinct runway designators mentioned across the NOTAM dataset
  const availableRunways = useMemo(() => {
    const rwySet = new Set<string>();
    const regex = /\b(?:RWY|RUNWAY)\s*([0-9]{2}[LCR]?(?:\/[0-9]{2}[LCR]?)?)\b/gi;

    notams.forEach((n) => {
      let match;
      while ((match = regex.exec(n.rawText)) !== null) {
        if (match[1]) rwySet.add(match[1].toUpperCase());
      }
    });

    return Array.from(rwySet).sort();
  }, [notams]);

  const activeCount = useMemo(
    () => notams.filter((n) => n.effectiveStatus === 'ACTIVE_NOW').length,
    [notams]
  );
  const criticalCount = useMemo(
    () => notams.filter((n) => n.severity === 'CRITICAL').length,
    [notams]
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Filter size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              NOTAM LEDGER FILTERS
            </h3>
            <p className="text-xs text-slate-400">
              Showing {notams.length} ingested items ({activeCount} active now, {criticalCount} critical)
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Q-codes, RWY, keywords..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Row 1: Severity & Status */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1">
          Severity:
        </span>
        <button
          onClick={() => onSeverityChange('ALL')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            selectedSeverity === 'ALL'
              ? 'bg-slate-700 text-white border border-slate-600'
              : 'bg-slate-950/50 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onSeverityChange('CRITICAL')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
            selectedSeverity === 'CRITICAL'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-slate-950/50 text-slate-400 hover:text-rose-300 border border-slate-800'
          }`}
        >
          <ShieldAlert size={12} className="text-rose-400" />
          Critical ({criticalCount})
        </button>
        <button
          onClick={() => onSeverityChange('WARNING')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            selectedSeverity === 'WARNING'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-950/50 text-slate-400 hover:text-amber-300 border border-slate-800'
          }`}
        >
          Warning
        </button>

        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider ml-4 mr-1">
          Status:
        </span>
        <button
          onClick={() => onStatusChange('ALL')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            selectedStatus === 'ALL'
              ? 'bg-slate-700 text-white border border-slate-600'
              : 'bg-slate-950/50 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onStatusChange('ACTIVE_NOW')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
            selectedStatus === 'ACTIVE_NOW'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-950/50 text-slate-400 hover:text-emerald-300 border border-slate-800'
          }`}
        >
          <Clock size={12} className="text-emerald-400" />
          Active Now ({activeCount})
        </button>
      </div>

      {/* Filter Row 2: Runway Specific Filter */}
      {availableRunways.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] font-medium text-amber-400/90 uppercase tracking-wider mr-1 flex items-center gap-1">
            <MapPin size={12} /> Target Runway:
          </span>
          <button
            onClick={() => onRunwayChange('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              selectedRunway === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-950/40 text-slate-400 hover:text-amber-200 border border-slate-800'
            }`}
          >
            ALL RWYS
          </button>
          {availableRunways.map((rwy) => (
            <button
              key={rwy}
              onClick={() => onRunwayChange(rwy)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                selectedRunway === rwy
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-950/40 text-slate-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              RWY {rwy}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
