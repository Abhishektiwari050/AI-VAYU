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
  onSearchRoute: (origin: string, destination: string, waypoints: string[]) => void;
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
  isLoading,
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

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const containerClass = isNight
    ? 'bg-[#140606] border-red-950 text-red-100'
    : isDay
    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
    : 'bg-[#0b0e14]/90 border-white/[0.08] text-slate-100 shadow-2xl';

  const inputClass = isNight
    ? 'bg-red-950/40 border-red-900/60 text-red-100 placeholder-red-400/40 focus:border-red-500'
    : isDay
    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-800'
    : 'bg-zinc-900/60 border-white/[0.08] text-white placeholder-zinc-500 focus:border-white/20 focus:bg-zinc-900/90';

  const btnSecondaryClass = isNight
    ? 'border-red-900/60 bg-red-950/40 text-red-200 hover:bg-red-900/40'
    : isDay
    ? 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
    : 'border-white/[0.08] bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white';

  const btnPrimaryClass = isNight
    ? 'bg-red-600 hover:bg-red-500 text-white font-medium'
    : isDay
    ? 'bg-slate-900 hover:bg-slate-800 text-white font-medium'
    : 'bg-white hover:bg-zinc-100 text-zinc-950 font-semibold shadow-sm';

  return (
    <header className={`w-full p-4 sm:p-5 rounded-2xl border mb-6 transition-all font-sans ${containerClass}`}>
      <div className="flex flex-col gap-4 max-w-7xl mx-auto">
        
        {/* ROW 1: MINIMAL BRAND HEADER & COCKPIT SESSION */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-white/[0.06]">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <VayuLogo size="md" showText={true} />
            
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full badge-minimal text-[11px] font-mono">
              <span className="led-quiet-green" />
              <span className="opacity-80">FAA & DGCA Live</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            {/* Zulu Clock */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg badge-minimal text-[11px]">
              <span className="opacity-50">UTC</span>
              <span className="font-semibold text-white">{currentZulu}Z</span>
            </div>

            {/* Auth */}
            <button
              onClick={onOpenAuth}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition cursor-pointer ${btnSecondaryClass}`}
            >
              <span className="hidden sm:inline">{userEmail ? userEmail.split('@')[0] : 'Sign In'}</span>
            </button>

            {/* Tier */}
            <button
              onClick={onOpenMonetization}
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              <span>{userTier}</span>
            </button>

            {/* Dispatch */}
            <button
              onClick={onOpenDispatchModal}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition cursor-pointer hidden sm:flex items-center gap-1 ${btnSecondaryClass}`}
            >
              <FileText className="w-3 h-3 opacity-70" />
              <span>Dispatch</span>
            </button>

            {/* Audit */}
            <button
              onClick={onOpenHistory}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition cursor-pointer hidden sm:flex items-center gap-1 ${btnSecondaryClass}`}
            >
              <History className="w-3 h-3 opacity-70" />
              <span>History</span>
            </button>

            {/* Audio */}
            <button
              onClick={toggleAudioBriefing}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition cursor-pointer flex items-center gap-1 ${
                isAudioPlaying ? 'bg-emerald-500 text-black font-semibold' : btnSecondaryClass
              }`}
            >
              {isAudioPlaying ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              <span className="hidden sm:inline">{isAudioPlaying ? 'Stop' : 'Audio'}</span>
            </button>

            {/* Theme switcher */}
            <div className="flex items-center border border-white/[0.08] p-0.5 rounded-lg bg-black/40">
              <button
                type="button"
                onClick={() => setTheme('DARK_COCKPIT')}
                className={`p-1 rounded cursor-pointer transition ${
                  theme === 'DARK_COCKPIT' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Dark Cockpit"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('NIGHT_RED')}
                className={`p-1 rounded cursor-pointer transition ${
                  theme === 'NIGHT_RED' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Night Red"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('DAY_FLIGHT')}
                className={`p-1 rounded cursor-pointer transition ${
                  theme === 'DAY_FLIGHT' ? 'bg-slate-200 text-slate-900' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Day Sunlight"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: CLEAN MINIMAL COMMAND BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1">
            {viewMode !== 'ROUTE' ? (
              <form onSubmit={handleSingleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={singleIcao}
                    onChange={(e) => setSingleIcao(e.target.value.toUpperCase())}
                    placeholder="Search ICAO airport (VIDP, VABB, KJFK)..."
                    maxLength={4}
                    className={`w-full border rounded-xl py-2.5 pl-10 pr-12 text-xs sm:text-sm font-mono font-medium focus:outline-none transition ${inputClass}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
                    <Command className="w-2.5 h-2.5" />
                    <span>K</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 ${btnPrimaryClass}`}
                >
                  {isLoading ? <Zap className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Brief</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRouteSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="grid grid-cols-3 gap-2 flex-1 w-full font-mono">
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    placeholder="ORIGIN"
                    maxLength={4}
                    className={`border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputClass}`}
                  />
                  <input
                    type="text"
                    value={waypointInput}
                    onChange={(e) => setWaypointInput(e.target.value.toUpperCase())}
                    placeholder="WAYPOINTS"
                    className={`border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputClass}`}
                  />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="DEST"
                    maxLength={4}
                    className={`border rounded-xl px-3 py-2 text-xs focus:outline-none ${inputClass}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full sm:w-auto px-4 py-2 text-xs rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 ${btnPrimaryClass}`}
                >
                  {isLoading ? <Zap className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                  <span>Route</span>
                </button>
              </form>
            )}
          </div>

          {/* VIEW SWITCHER PILLS */}
          <div className="flex items-center border border-white/[0.08] p-1 rounded-xl bg-black/40 text-xs font-mono shrink-0">
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'EXECUTIVE' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Briefing
            </button>
            <button
              onClick={() => setViewMode('ROUTE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'ROUTE' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Corridor Leg
            </button>
            <button
              onClick={() => setViewMode('CLI')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'CLI' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Terminal CLI
            </button>
          </div>
        </div>

        {/* ROW 3: REFINED QUICK AIRPORT CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono pt-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1 shrink-0">Popular:</span>
          {viewMode !== 'ROUTE' ? (
            quickAirports.map((ap) => {
              const ledClass = ap.status === 'RED' ? 'led-quiet-red' : ap.status === 'YELLOW' ? 'led-quiet-yellow' : 'led-quiet-green';
              return (
                <button
                  key={ap.code}
                  onClick={() => {
                    setSingleIcao(ap.code);
                    onSearchSingle(ap.code);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 text-[11px] transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span className={ledClass} />
                  <span className="font-semibold text-white">{ap.code}</span>
                  <span className="text-zinc-500 text-[10px]">{ap.label}</span>
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
                className="px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300 text-[11px] transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{route.name}</span>
                <span className="text-zinc-500 text-[10px]">({route.origin}→{route.destination})</span>
              </button>
            ))
          )}
        </div>
      </div>
    </header>
  );
};
