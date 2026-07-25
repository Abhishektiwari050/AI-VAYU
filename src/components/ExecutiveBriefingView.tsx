import React, { useState } from 'react';
import { BriefingSummary, FlightCategory, NotamBucket } from '../types';
import {
  ChevronDown,
  Share2,
  Printer,
  FileCode,
  Check,
  AlertTriangle,
  Clock,
  MessageSquare,
  Send,
  Eye,
  EyeOff,
  Radio,
  CloudRain,
  Search,
  ListFilter,
  Shield,
  Zap,
} from 'lucide-react';
import { DisplayTheme, FontSizeSetting } from './Header';
import { formatZuluAndLocalTime, evaluateNotamStatusWindow } from '../lib/timezoneUtils';
import { AerodromeRadarMap } from './AerodromeRadarMap';
import { CockpitAudioReadout } from './CockpitAudioReadout';
import { InteractiveAirportDiagram } from './InteractiveAirportDiagram';
import { ViralGrowthBanner } from './ViralGrowthBanner';

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
  onSearchSingle,
}) => {
  const [expandedNotam, setExpandedNotam] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRadarMap, setShowRadarMap] = useState<boolean>(true);
  const [showTafAccordion, setShowTafAccordion] = useState<boolean>(false);
  const [showFullLedger, setShowFullLedger] = useState<boolean>(false);
  const [activeLedgerBucket, setActiveLedgerBucket] = useState<NotamBucket | 'ALL'>('ALL');
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState<string>('');
  const [activeMediaTab, setActiveMediaTab] = useState<'DIAGRAM' | 'RADAR'>('DIAGRAM');


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
    const briefingUrl = typeof window !== 'undefined' ? `${window.location.origin}/#${briefing.icao}` : `https://ai-vayu.vercel.app/#${briefing.icao}`;
    const text = `✈ VAYU Briefing: ${briefing.icao} (${timeInfo.combinedString})
------------------------------
🌤 Weather: ${briefing.weather.flightCategory} (${briefing.weather.plainEnglishSummary})
🔴 Critical (${briefing.criticalCount}):
${briefing.criticalAlerts.map((a) => ` • ${a.title}: ${a.plainEnglish}`).join('\n') || ' None'}
🟡 Advisories (${briefing.warningCount}):
${briefing.warnings.map((w) => ` • ${w.title}: ${w.plainEnglish}`).join('\n') || ' None'}
------------------------------
🔗 Direct Briefing URL: ${briefingUrl}
ADVISORY ONLY: Informational pre-flight awareness utility under DGCA and FAA regulations.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `✈ VAYU PRE-FLIGHT BRIEFING [${briefing.icao}] (${timeInfo.combinedString})\n` +
      `Weather: ${briefing.weather.flightCategory} | ${briefing.weather.plainEnglishSummary}\n` +
      `Critical Hazards (${briefing.criticalCount}): ${briefing.criticalAlerts.map(a => a.title).join(', ') || 'None'}\n` +
      `FAR Part 91 & Part 135 Pre-flight Dispatch Log`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSmsShare = () => {
    const text = `VAYU Briefing [${briefing.icao}]: ${briefing.weather.flightCategory}, ${briefing.criticalCount} Critical NOTAMs. Flight Category: ${briefing.weather.flightCategory}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
  };

  const flightCat = briefing?.weather?.flightCategory || 'VFR';
  const weatherConfig = getWeatherPillCategory(flightCat) || { label: 'VFR', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };

  const cardGlassClass = isNight
    ? 'glass-card-night text-red-100'
    : 'cirrus-card text-[#0e1116]';

  const criticalCardClass = isNight
    ? 'glass-card-critical-night text-red-100'
    : 'cirrus-card bg-red-50/70 border-red-200 text-[#0e1116]';

  const advisoryCardClass = isNight
    ? 'glass-card-advisory-night text-red-100'
    : 'cirrus-card bg-amber-50/70 border-amber-200 text-[#0e1116]';

  const allLedgerItems = briefing?.allNotamsLedger || [];
  const filteredLedger = allLedgerItems.filter((item) => {
    const matchesBucket = activeLedgerBucket === 'ALL' || item.category === activeLedgerBucket;
    const matchesSearch =
      !ledgerSearchTerm ||
      item.rawText?.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
      item.id?.toLowerCase().includes(ledgerSearchTerm.toLowerCase());
    return matchesBucket && matchesSearch;
  });

  const counts = briefing?.bucketCounts || {
    RUNWAYS_TFRS: briefing?.criticalAlerts?.length || 0,
    PROCEDURES_NAVAIDS: briefing?.warnings?.length || 0,
    TAXIWAYS_APRON: 0,
    OBSTACLES_LIGHTING: 0,
    FIR_ENROUTE: 0,
    GENERAL: briefing?.infoItems?.length || 0,
  };

  return (
    <div className={`w-full font-sans p-4 sm:p-6 transition-colors duration-300 ${
      isNight ? 'text-red-100' : isDay ? 'text-slate-900' : 'text-white'
    }`}>
      
      {/* CONSOLIDATED PROVENANCE & FAR 91.3 LEGAL BARNER */}
      <div className={`p-3.5 rounded-2xl border text-xs font-mono mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isNight
          ? 'bg-red-950/60 border-red-800 text-red-300'
          : isDay
          ? 'bg-white border-[#e3e8ee] text-[#0e1116]'
          : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
      }`}>
        <div className="flex items-center gap-2.5">
          <AlertTriangle className={`w-4 h-4 shrink-0 ${isDay ? 'text-[#2e7def]' : 'text-amber-400'}`} />
          <div className="leading-snug">
            <strong className="font-bold uppercase tracking-wider">FAR PART 91.3 ADVISORY:</strong>{' '}
            Informational pre-flight awareness utility. Pilots retain sole operational authority.
          </div>
        </div>

        {/* Provenance Badge */}
        {(() => {
          const ds = briefing.dataSource;
          const allSynthetic = !ds;
          const anySynthetic = !ds || ds.metar === 'SYNTHETIC' || ds.notams === 'SYNTHETIC';
          return (
            <div className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold font-mono border flex items-center gap-2 ${
              allSynthetic
                ? 'bg-red-50 border-red-300 text-red-700'
                : anySynthetic
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <span>{allSynthetic ? '⚠ DEMO DATA' : anySynthetic ? '⚠ PARTIAL LIVE DATA' : '✓ LIVE DATA'}</span>
              <span className="opacity-40">|</span>
              <span className="font-normal text-[10px]">METAR: {ds?.metar ?? 'SYNTHETIC'}</span>
            </div>
          );
        })()}
      </div>

      {/* HERO AIRPORT TITLE & CIRRUS OPEN SKY HUD */}
      <div className="text-center my-8 space-y-3">
        <div className="text-3xl sm:text-5xl text-[#5b6472] cirrus-serif-pause">
          Clear skies, decoded in real-time.
        </div>

        <h1 className="text-6xl sm:text-8xl font-bold tracking-tight text-[#0e1116] font-sans">
          {briefing.icao}
        </h1>
        <p className="text-base font-normal text-[#5b6472]">
          {briefing.airportName}
        </p>

        {/* Time Info */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#e3e8ee] shadow-sm text-xs font-mono text-[#5b6472]">
          <Clock className="w-3.5 h-3.5 opacity-60 text-[#2e7def]" />
          <span>{timeInfo.combinedString}</span>
        </div>

        <div className="flex flex-col items-center gap-3 pt-2">
          {/* Weather Pill */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-[#e3e8ee] shadow-sm text-xs font-medium text-[#0e1116]">
            <span className={`w-2.5 h-2.5 rounded-full ${
              briefing.weather.flightCategory === 'VFR' ? 'bg-emerald-500' :
              briefing.weather.flightCategory === 'MVFR' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className="font-bold font-mono text-sm">{weatherConfig.label}</span>
            <span className="text-[#5b6472]">Winds: {briefing.weather.windInfo}</span>
            <span className="text-[#5b6472]">Vis: {briefing.weather.visibilityInfo}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-[#e3e8ee] text-xs font-medium text-[#0e1116] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[#5b6472]" />}
              <span>{copied ? 'Copied Briefing' : 'Copy Briefing'}</span>
            </button>
            <button
              onClick={onOpenKneeboard}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-[#e3e8ee] text-xs font-medium text-[#0e1116] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#5b6472]" />
              <span>Print Kneeboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* METAR & TAF WEATHER SUMMARY CONTAINER */}
      <div className="mb-6">
        <div className={`p-5 rounded-3xl border transition-all ${cardGlassClass}`}>
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 font-mono">
              <CloudSun className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-widest block text-[#0e1116] dark:text-white">
                METEOROLOGICAL CONDITIONS & TAF FORECAST
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-[#e3e8ee] dark:border-white/10">
              <span className="text-[10px] uppercase font-mono font-bold text-[#5b6472] block mb-1">
                PLAIN ENGLISH WEATHER SUMMARY:
              </span>
              <p className="text-sm font-sans font-medium text-[#0e1116] dark:text-zinc-200 leading-relaxed">
                {briefing.weather.plainEnglishSummary}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/30 border border-[#e3e8ee] dark:border-white/10 font-mono">
              <span className="text-[10px] uppercase font-bold text-[#5b6472] block mb-1">
                RAW METAR STRING:
              </span>
              <div className="text-xs leading-relaxed text-[#0e1116] dark:text-zinc-300 break-words select-text">
                {briefing.weather.rawMetar}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HANDS-FREE COCKPIT AUDIO READOUT MODE */}
      <CockpitAudioReadout briefing={briefing} theme={theme} />

      {/* WORKSTATION TABBED MEDIA SECTION (VECTOR DIAGRAM vs RADAR MAP) */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-[#e3e8ee] shadow-sm">
            <button
              onClick={() => setActiveMediaTab('DIAGRAM')}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 ${
                activeMediaTab === 'DIAGRAM' ? 'bg-[#0e1116] text-white shadow-sm' : 'text-[#5b6472] hover:text-[#0e1116]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>AERODROME DIAGRAM OVERLAY</span>
            </button>
            <button
              onClick={() => setActiveMediaTab('RADAR')}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 ${
                activeMediaTab === 'RADAR' ? 'bg-[#0e1116] text-white shadow-sm' : 'text-[#5b6472] hover:text-[#0e1116]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>RADAR & SPATIAL RADIAL GRID</span>
            </button>
          </div>
        </div>

        {activeMediaTab === 'DIAGRAM' ? (
          <InteractiveAirportDiagram briefing={briefing} theme={theme} />
        ) : (
          <AerodromeRadarMap briefing={briefing} theme={theme} />
        )}
      </div>

      {/* APPLE-GRADE BENTO GRID 5-BUCKET OPERATIONAL NOTAM MATRIX */}
      <div className={`p-5 rounded-3xl border mb-6 transition-all ${cardGlassClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e3e8ee]">
          <div className="flex items-center gap-2.5 font-mono">
            <div className="p-1.5 rounded-lg bg-[#2e7def]/10 text-[#2e7def] border border-[#2e7def]/20">
              <ListFilter className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest block text-[#0e1116]">
                DETERMINISTIC 5-BUCKET OPERATIONAL NOTAM MATRIX
              </span>
              <span className="text-[10px] text-[#5b6472] font-sans">Raw FAA & DGCA Aerodrome Data Stream</span>
            </div>
          </div>
          <button
            onClick={() => setShowFullLedger(!showFullLedger)}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold bg-[#0e1116] hover:bg-slate-800 text-white border-[#0e1116] transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{showFullLedger ? 'Hide Unfiltered Ledger' : `View Full NOTAM Ledger (${allLedgerItems.length || briefing.totalNotamsIngested})`}</span>
          </button>
        </div>

        {/* 5-Bucket Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            counts.RUNWAYS_TFRS > 0 ? 'bg-red-50/80 border-red-300 text-red-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-[#5b6472]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">1. RUNWAYS & TFRs</span>
              <span className={`w-2 h-2 rounded-full ${counts.RUNWAYS_TFRS > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`} />
            </div>
            <span className="text-3xl font-black font-mono mt-2 text-red-600">{counts.RUNWAYS_TFRS}</span>
          </div>

          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            counts.PROCEDURES_NAVAIDS > 0 ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-[#5b6472]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">2. PROCEDURES</span>
              <span className={`w-2 h-2 rounded-full ${counts.PROCEDURES_NAVAIDS > 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
            </div>
            <span className="text-3xl font-black font-mono mt-2 text-blue-600">{counts.PROCEDURES_NAVAIDS}</span>
          </div>

          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            counts.TAXIWAYS_APRON > 0 ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-[#5b6472]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">3. TAXIWAYS & APRON</span>
              <span className={`w-2 h-2 rounded-full ${counts.TAXIWAYS_APRON > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
            </div>
            <span className="text-3xl font-black font-mono mt-2 text-amber-600">{counts.TAXIWAYS_APRON}</span>
          </div>

          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            counts.OBSTACLES_LIGHTING > 0 ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-[#5b6472]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">4. OBSTACLES</span>
              <span className={`w-2 h-2 rounded-full ${counts.OBSTACLES_LIGHTING > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <span className="text-3xl font-black font-mono mt-2 text-emerald-600">{counts.OBSTACLES_LIGHTING}</span>
          </div>

          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            counts.FIR_ENROUTE > 0 ? 'bg-purple-50/80 border-purple-300 text-purple-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-[#5b6472]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">5. FIR ENROUTE</span>
              <span className={`w-2 h-2 rounded-full ${counts.FIR_ENROUTE > 0 ? 'bg-purple-500' : 'bg-slate-300'}`} />
            </div>
            <span className="text-3xl font-black font-mono mt-2 text-purple-600">{counts.FIR_ENROUTE}</span>
          </div>
        </div>
      </div>

      {/* FULL UNFILTERED NOTAM LEDGER SECTION */}
      {showFullLedger && (
        <div className={`p-5 rounded-2xl border mb-6 shadow-xl ${
          isNight ? 'bg-black border-red-900 text-red-100' : isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-zinc-950 border-zinc-800 text-zinc-100'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>ALL NOTAMs UNFILTERED DISPATCH LEDGER</span>
              </h3>
              <p className="text-[11px] opacity-70 font-sans mt-0.5">
                Zero NOTAMs dropped. Category filtered & timestamp audited per FAA & ICAO annex standards.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search raw text or NOTAM ID..."
                value={ledgerSearchTerm}
                onChange={(e) => setLedgerSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl border outline-none ${
                  isNight ? 'bg-red-950/40 border-red-800 text-red-100' : isDay ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                }`}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-zinc-800 text-xs font-mono">
            {[
              { id: 'ALL', label: `ALL (${allLedgerItems.length})` },
              { id: 'RUNWAYS_TFRS', label: `🔴 RWY/TFR (${counts.RUNWAYS_TFRS})` },
              { id: 'PROCEDURES_NAVAIDS', label: `🔵 PROC/NAV (${counts.PROCEDURES_NAVAIDS})` },
              { id: 'TAXIWAYS_APRON', label: `🟡 TWY/APRON (${counts.TAXIWAYS_APRON})` },
              { id: 'OBSTACLES_LIGHTING', label: `⚪ OBST/LGT (${counts.OBSTACLES_LIGHTING})` },
              { id: 'FIR_ENROUTE', label: `🟣 FIR (${counts.FIR_ENROUTE})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLedgerBucket(tab.id as any)}
                className={`px-3 py-1 rounded-lg border whitespace-nowrap transition cursor-pointer font-bold ${
                  activeLedgerBucket === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ledger Table / List */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredLedger.length > 0 ? (
              filteredLedger.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`p-3 rounded-xl border text-xs font-mono transition ${
                    item.severity === 'CRITICAL'
                      ? 'bg-red-950/30 border-red-800/80 text-red-200'
                      : item.severity === 'WARNING'
                      ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded border uppercase font-bold bg-black/40 border-zinc-700">
                        {item.category.replace('_', ' ')}
                      </span>
                      {item.isFir && (
                        <span className="text-[10px] px-2 py-0.5 rounded border uppercase font-bold bg-purple-950 text-purple-200 border-purple-700">
                          FIR EN-ROUTE ({item.firIcao || 'FIR'})
                        </span>
                      )}
                    </div>
                    {item.effectiveWindow && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {item.effectiveWindow}
                      </span>
                    )}
                  </div>

                  <p className="p-2 rounded bg-black/80 border border-zinc-800/80 text-[11px] font-mono whitespace-pre-wrap break-all leading-tight text-zinc-200">
                    {item.rawText}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs font-mono text-zinc-500 border rounded-xl border-dashed border-zinc-800">
                No NOTAMs matched the active bucket and search query.
              </div>
            )}
          </div>
        </div>
      )}



      {/* VIRAL GROWTH SHARE BANNER — bottom placement */}
      <div className="mb-6">
        <ViralGrowthBanner theme={theme} currentIcao={briefing.icao} />
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
              const notamWindow = evaluateNotamStatusWindow(alert.rawSnippet, alert.effectiveWindow, isDay);

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
                    
                    {/* Active Status Badge & FIR Tag */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider inline-flex items-center gap-1.5 ${notamWindow.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${notamWindow.label.includes('ACTIVE') ? 'led-glow-green' : 'led-glow-yellow'}`} />
                        <span>{notamWindow.label}</span>
                      </span>
                      {alert.isFir && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase bg-purple-950 text-purple-200 border-purple-700">
                          FIR EN-ROUTE
                        </span>
                      )}
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

                <div className={`mt-3 pt-2 border-t text-[10px] font-mono flex items-center justify-between ${
                  isNight ? 'border-amber-900/40 text-red-400/80' : isDay ? 'border-slate-200 text-slate-500' : 'border-zinc-800 text-zinc-500'
                }`}>
                  <span>[RAW NOTAM #{warn.id?.slice(0, 6) || '07/142'}]</span>
                  {warn.isFir && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-200 font-bold border border-purple-800">
                      FIR
                    </span>
                  )}
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
      <div className={`border rounded-2xl p-3 flex flex-wrap items-center justify-center gap-2.5 mt-8 transition-colors duration-300 ${cardGlassClass}`}>
        <button
          onClick={handleCopySummary}
          className={`text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border ${
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
          <span>{copied ? 'Copied' : 'Copy Briefing'}</span>
        </button>

        <button
          onClick={handleWhatsAppShare}
          className="text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Share</span>
        </button>

        <button
          onClick={handleSmsShare}
          className="text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border bg-blue-600/90 hover:bg-blue-500 text-white border-blue-400"
        >
          <Send className="w-3.5 h-3.5" />
          <span>SMS Share</span>
        </button>

        <button
          onClick={onOpenKneeboard}
          className={`text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border ${
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
          className={`text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer border ${
            isNight
              ? 'bg-red-900/60 border-red-800 text-red-100 hover:bg-red-800'
              : isDay
              ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-200'
              : 'bg-zinc-800/80 border-zinc-700/80 text-white hover:bg-zinc-700/90'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Part 91/121/135 Log</span>
        </button>
      </div>
    </div>
  );
};

