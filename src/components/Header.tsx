import React, { useState } from 'react';
import {
  Terminal,
  Sun,
  Moon,
  Eye,
  Volume2,
  VolumeX,
  History,
  FileText,
  Search,
  Zap,
  Compass,
  Crown,
  ShieldCheck,
  Command,
  Clipboard,
  FileCode,
} from 'lucide-react';
import { PRESET_ROUTES, normalizeAirportCode } from '../lib/airportData';
import { UserTier } from './MonetizationModal';
import { VayuLogo } from './VayuLogo';

export type DisplayTheme = 'DARK_COCKPIT' | 'NIGHT_RED' | 'DAY_FLIGHT';
export type FontSizeSetting = 'NORMAL' | 'LARGE' | 'KNEEBOARD';

interface HeaderProps {
  theme: DisplayTheme;
  setTheme: (t: DisplayTheme) => void;
  fontSize: FontSizeSetting;
  setFontSize: (s: FontSizeSetting) => void;
  viewMode: 'EXECUTIVE' | 'CLI' | 'ROUTE';
  setViewMode: (v: 'EXECUTIVE' | 'CLI' | 'ROUTE') => void;
  isAudioPlaying: boolean;
  toggleAudioBriefing: () => void;
  onOpenHistory: () => void;
  onOpenDispatchModal: () => void;
  onOpenMonetization: () => void;
  onOpenAuth: () => void;
  userTier: UserTier;
  onSearchSingle: (icao: string) => void;
  onOpenSmartPaste?: () => void;
  onOpenRawInspector?: () => void;
  isLoading: boolean;
  activeIcao?: string;
  userEmail?: string;
}

function normalizeCode(raw: string): string {
  return normalizeAirportCode(raw) || raw.trim().toUpperCase();
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  viewMode,
  setViewMode,
  isAudioPlaying,
  toggleAudioBriefing,
  onOpenHistory,
  onOpenDispatchModal,
  onOpenMonetization,
  onOpenAuth,
  userTier,
  onSearchSingle,
  onSearchRoute,
  isLoading = false,
  activeIcao = 'VIDP',
  userEmail,
}) => {
  const currentZulu = new Date().toISOString().substring(11, 16);

  const [singleIcao, setSingleIcao] = useState(activeIcao || '');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypointInput, setWaypointInput] = useState('');

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = normalizeCode(singleIcao);
    if (formatted) {
      setSingleIcao(formatted);
      onSearchSingle(formatted);
    }
  };

  const handleRouteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedOrigin = normalizeCode(origin);
    const formattedDest = normalizeCode(destination);
    if (formattedOrigin && formattedDest) {
      setOrigin(formattedOrigin);
      setDestination(formattedDest);
      const waypoints = waypointInput
        .split(',')
        .map((w) => normalizeCode(w.trim()))
        .filter(Boolean);
      onSearchRoute(formattedOrigin, formattedDest, waypoints);
    }
  };

  const quickAirports = [
    { code: 'VIDP', status: 'GREEN', label: 'Delhi' },
    { code: 'VABB', status: 'YELLOW', label: 'Mumbai' },
    { code: 'VOBL', status: 'GREEN', label: 'Bengaluru' },
    { code: 'VAID', status: 'GREEN', label: 'Indore' },
    { code: 'VDGO', status: 'RED', label: 'Goa' },
    { code: 'VIJP', status: 'GREEN', label: 'Jaipur' },
    { code: 'VILK', status: 'GREEN', label: 'Lucknow' },
    { code: 'KJFK', status: 'GREEN', label: 'New York' },
    { code: 'EGLL', status: 'GREEN', label: 'London' },
  ];

  return (
    <header className="w-full p-4 sm:p-6 mb-6 font-sans">
      <div className="flex flex-col gap-5 max-w-7xl mx-auto">
        
        {/* ROW 1: BRAND IDENTITY & CIRRUS TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e3e8ee]">
          {/* Brand */}
          <div className="flex items-center space-x-3.5">
            <VayuLogo size="md" showText={true} />
            
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#e3e8ee] shadow-sm text-xs font-medium text-[#5b6472]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FAA & DGCA Open Sky Datastream</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2.5 text-xs">
            {/* UTC Clock */}
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e3e8ee] text-[#5b6472] font-mono shadow-sm">
              <span className="opacity-60">UTC</span>
              <span className="font-semibold text-[#0e1116]">{currentZulu}Z</span>
            </div>

            {/* Auth */}
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#e3e8ee] text-[#0e1116] hover:bg-slate-50 font-medium transition cursor-pointer shadow-sm"
            >
              <span>{userEmail ? userEmail.split('@')[0] : 'Sign In'}</span>
            </button>

            {/* Tier */}
            <button
              onClick={onOpenMonetization}
              className="px-3.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900 font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>{userTier}</span>
            </button>

            {/* Smart Paste */}
            {onOpenSmartPaste && (
              <button
                onClick={onOpenSmartPaste}
                className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-mono text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Clipboard className="w-3.5 h-3.5 text-blue-600" />
                <span>Smart Paste</span>
              </button>
            )}

            {/* Raw Data Inspector */}
            {onOpenRawInspector && (
              <button
                onClick={onOpenRawInspector}
                className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 font-mono text-[11px] font-bold transition cursor-pointer hidden md:flex items-center gap-1.5 shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>Raw Data</span>
              </button>
            )}

            {/* Dispatch */}
            <button
              onClick={onOpenDispatchModal}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#e3e8ee] text-[#0e1116] hover:bg-slate-50 font-medium transition cursor-pointer hidden sm:flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-[#5b6472]" />
              <span>Dispatch</span>
            </button>

            {/* Audit */}
            <button
              onClick={onOpenHistory}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#e3e8ee] text-[#0e1116] hover:bg-slate-50 font-medium transition cursor-pointer hidden sm:flex items-center gap-1.5 shadow-sm"
            >
              <History className="w-3.5 h-3.5 text-[#5b6472]" />
              <span>History</span>
            </button>

            {/* Audio */}
            <button
              onClick={toggleAudioBriefing}
              className={`px-3.5 py-1.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isAudioPlaying ? 'bg-emerald-600 text-white font-medium border-emerald-500 animate-pulse' : 'bg-white border-[#e3e8ee] text-[#0e1116]'
              }`}
            >
              {isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#5b6472]" />}
              <span className="hidden sm:inline">{isAudioPlaying ? 'Reading' : 'Audio'}</span>
            </button>
          </div>
        </div>

        {/* ROW 2: SEARCH INPUT & USER-SPECIFIED CIR-TABS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex-1">
            {viewMode !== 'ROUTE' ? (
              <form onSubmit={handleSingleSubmit} className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6472]" />
                  <input
                    type="text"
                    value={singleIcao}
                    onChange={(e) => setSingleIcao(e.target.value.toUpperCase())}
                    placeholder="Search airport by ICAO code (VIDP, VABB, KJFK)..."
                    maxLength={4}
                    className="w-full bg-white border border-[#e3e8ee] rounded-full py-3 pl-11 pr-12 text-sm font-medium text-[#0e1116] placeholder-[#5b6472] focus:outline-none focus:border-[#2e7def] focus:ring-2 focus:ring-[#2e7def]/20 shadow-[0_1px_1px_rgba(14,17,22,0.04),0_20px_40px_-24px_rgba(14,17,22,0.18)] transition-all"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 border border-[#e3e8ee] text-[10px] font-mono text-[#5b6472]">
                    <Command className="w-2.5 h-2.5" />
                    <span>K</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="cirrus-btn-obsidian cursor-pointer disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Brief</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRouteSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="grid grid-cols-3 gap-2 flex-1 w-full font-mono">
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    placeholder="ORIGIN"
                    maxLength={4}
                    className="bg-white border border-[#e3e8ee] rounded-full px-4 py-2.5 text-xs text-[#0e1116] focus:outline-none shadow-sm"
                  />
                  <input
                    type="text"
                    value={waypointInput}
                    onChange={(e) => setWaypointInput(e.target.value.toUpperCase())}
                    placeholder="WAYPOINTS"
                    className="bg-white border border-[#e3e8ee] rounded-full px-4 py-2.5 text-xs text-[#0e1116] focus:outline-none shadow-sm"
                  />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="DEST"
                    maxLength={4}
                    className="bg-white border border-[#e3e8ee] rounded-full px-4 py-2.5 text-xs text-[#0e1116] focus:outline-none shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="cirrus-btn-obsidian cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
                >
                  {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                  <span>Route</span>
                </button>
              </form>
            )}
          </div>

          {/* EXACT USER-SPECIFIED CIR-TABS RADIO TABLIST */}
          <div className="cir-tabs" role="tablist" aria-label="View Mode">
            <input
              className="cir-tabs__r"
              type="radio"
              name="cir-view-mode"
              id="cir-r-briefing"
              checked={viewMode === 'EXECUTIVE'}
              onChange={() => setViewMode('EXECUTIVE')}
            />
            <label className="cir-tabs__t" htmlFor="cir-r-briefing" role="tab">
              Briefing
            </label>

            <input
              className="cir-tabs__r"
              type="radio"
              name="cir-view-mode"
              id="cir-r-route"
              checked={viewMode === 'ROUTE'}
              onChange={() => setViewMode('ROUTE')}
            />
            <label className="cir-tabs__t" htmlFor="cir-r-route" role="tab">
              Corridor Leg
            </label>

            <input
              className="cir-tabs__r"
              type="radio"
              name="cir-view-mode"
              id="cir-r-cli"
              checked={viewMode === 'CLI'}
              onChange={() => setViewMode('CLI')}
            />
            <label className="cir-tabs__t" htmlFor="cir-r-cli" role="tab">
              Terminal CLI
            </label>
          </div>
        </div>

        {/* ROW 3: QUICK AIRPORT CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs pt-1">
          <span className="text-xs text-[#5b6472] font-medium mr-1 shrink-0">Airfields:</span>
          {viewMode !== 'ROUTE' ? (
            quickAirports.map((ap) => {
              const dotBg = ap.status === 'RED' ? 'bg-red-500' : ap.status === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <button
                  key={ap.code}
                  onClick={() => {
                    setSingleIcao(ap.code);
                    onSearchSingle(ap.code);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#e3e8ee] text-[#0e1116] hover:border-[#2e7def] hover:text-[#2e7def] text-xs font-medium transition flex items-center gap-2 shrink-0 shadow-[0_1px_1px_rgba(14,17,22,0.04)] cursor-pointer"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} />
                  <span className="font-semibold">{ap.code}</span>
                  <span className="text-[#5b6472] text-[11px]">{ap.label}</span>
                </button>
              );
            })
          ) : (
            PRESET_ROUTES.map((route) => (
              <button
                key={route.name}
                onClick={() => {
                  setOrigin(route.origin);
                  setDestination(route.destination);
                  setWaypointInput(route.waypoints.join(', '));
                  onSearchRoute(route.origin, route.destination, route.waypoints);
                }}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#e3e8ee] text-[#0e1116] hover:border-[#2e7def] text-xs font-medium transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                <span>{route.name}</span>
                <span className="text-[#5b6472] text-[11px]">({route.origin}→{route.destination})</span>
              </button>
            ))
          )}
        </div>
      </div>
    </header>
  );
};
