import React, { useState, useEffect } from 'react';
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
  Plane,
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
    { code: 'VIDP', status: '🟢', type: 'GREEN', label: 'DELHI' },
    { code: 'VABB', status: '🟡', type: 'YELLOW', label: 'MUMBAI' },
    { code: 'VOBL', status: '🟢', type: 'GREEN', label: 'BLR' },
    { code: 'VAID', status: '🟢', type: 'GREEN', label: 'INDORE' },
    { code: 'VDGO', status: '🔴', type: 'RED', label: 'GOA' },
    { code: 'VIJP', status: '🟢', type: 'GREEN', label: 'JAIPUR' },
    { code: 'VILK', status: '🟢', type: 'GREEN', label: 'LUCKNOW' },
    { code: 'KJFK', status: '🟢', type: 'GREEN', label: 'NYC' },
    { code: 'EGLL', status: '🟢', type: 'GREEN', label: 'LHR' },
  ];

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const headerGlassClass = isNight
    ? 'glass-card-night text-red-100'
    : isDay
    ? 'glass-card-day text-slate-900'
    : 'glass-card-dark text-white';

  const ribbonGlassClass = isNight
    ? 'glass-command-ribbon-night text-red-100'
    : isDay
    ? 'glass-command-ribbon-day text-slate-900'
    : 'glass-command-ribbon-dark text-white';

  const inputBgClass = isNight
    ? 'bg-red-950/50 border-red-900/60 text-red-100 placeholder-red-400/50 focus:border-red-500'
    : isDay
    ? 'bg-white/90 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
    : 'bg-black/80 border-white/10 text-white placeholder-zinc-500 focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/30';

  const actionBtnClass = isNight
    ? 'border-red-900/60 bg-red-950/60 text-red-200 hover:bg-red-900/80'
    : isDay
    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
    : 'border-white/10 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white';

  const activeTabClass = isNight
    ? 'bg-red-600 text-white shadow-md font-bold'
    : isDay
    ? 'bg-slate-900 text-white shadow-md font-bold'
    : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md font-bold';

  const inactiveTabClass = isNight
    ? 'text-red-300/70 hover:text-red-100'
    : isDay
    ? 'text-slate-600 hover:text-slate-900'
    : 'text-zinc-400 hover:text-white';

  const submitBtnClass = isNight
    ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
    : isDay
    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
    : 'bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-500 hover:brightness-110 text-black font-extrabold shadow-[0_0_20px_rgba(56,189,248,0.3)]';

  return (
    <header className={`w-full p-4 sm:p-6 rounded-t-[28px] shadow-2xl relative z-30 font-sans transition-all duration-300 ${headerGlassClass}`}>
      <div className="flex flex-col gap-4">
        
        {/* ROW 1: APPLE-GRADE HEADER BRANDING & COCKPIT STATUS */}
        <div className={`flex flex-wrap items-center justify-between gap-3 text-xs font-mono uppercase tracking-wider pb-3 border-b ${
          isNight ? 'border-red-900/40' : isDay ? 'border-slate-300/80' : 'border-white/10'
        }`}>
          {/* Brand Identity */}
          <div className="flex items-center space-x-3.5">
            <VayuLogo size="lg" showText={true} />

            {/* Glowing Datastream Status Pill */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              isNight
                ? 'border-red-900/60 bg-red-950/40 text-red-300'
                : isDay
                ? 'border-slate-300 bg-slate-100 text-slate-800'
                : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            }`}>
              <span className={`w-2 h-2 rounded-full inline-block ${isNight ? 'led-glow-red' : isDay ? 'bg-blue-600' : 'led-glow-green animate-pulse'}`} />
              <span className="tracking-widest">LIVE DGCA & FAA DATASTREAM</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
            
            {/* Auth Session */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center space-x-1.5 border px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition cursor-pointer ${
                userEmail ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300' : actionBtnClass
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{userEmail ? userEmail.split('@')[0].toUpperCase() : 'AUTH'}</span>
            </button>

            {/* Tier Badge */}
            <button
              onClick={onOpenMonetization}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono transition cursor-pointer border ${
                userTier === 'PRO'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : userTier === 'FLEET'
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>{userTier} PILOT</span>
            </button>

            {/* Zulu Clock */}
            <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[11px] font-mono font-bold ${
              isNight ? 'bg-red-950/40 border-red-900/60 text-red-300' : isDay ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-black/60 border-white/10 text-zinc-200'
            }`}>
              <span className="opacity-60">ZULU:</span>
              <span className="text-sky-400">{currentZulu}Z</span>
            </div>

            <button
              onClick={onOpenDispatchModal}
              className={`flex items-center space-x-1 border px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${actionBtnClass}`}
            >
              <FileText className="h-3.5 w-3.5 opacity-70" />
              <span className="hidden sm:inline">Dispatch</span>
            </button>

            <button
              onClick={onOpenHistory}
              className={`flex items-center space-x-1 border px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${actionBtnClass}`}
            >
              <History className="h-3.5 w-3.5 opacity-70" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            <button
              onClick={toggleAudioBriefing}
              className={`flex items-center space-x-1 border px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                isAudioPlaying ? 'border-emerald-500 bg-emerald-500 text-black animate-pulse font-black' : actionBtnClass
              }`}
            >
              {isAudioPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isAudioPlaying ? 'Stop' : 'Audio'}</span>
            </button>

            {/* Apple Cockpit Theme Selector */}
            <div className={`flex items-center border p-1 rounded-xl transition-colors ${
              isNight ? 'border-red-900/60 bg-red-950/80' : isDay ? 'border-slate-300 bg-slate-200' : 'border-white/10 bg-black/60'
            }`}>
              <button
                type="button"
                onClick={() => setTheme('DARK_COCKPIT')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${
                  theme === 'DARK_COCKPIT' ? 'bg-sky-500 text-black font-bold shadow-sm' : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
                title="Dark Cockpit Mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTheme('NIGHT_RED')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${
                  theme === 'NIGHT_RED' ? 'bg-red-600 text-white font-bold shadow-sm' : isDay ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'
                }`}
                title="Night-Vision Red Mode"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTheme('DAY_FLIGHT')}
                className={`p-1.5 rounded-lg cursor-pointer transition ${
                  theme === 'DAY_FLIGHT' ? 'bg-slate-900 text-white font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
                title="Day Sunlight Mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* ROW 2: SEARCH INPUT COMMAND BAR & MODE SWITCH TABS */}
        <div className={`p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-all ${ribbonGlassClass}`}>
          
          <div className="flex-1">
            {viewMode !== 'ROUTE' ? (
              <form onSubmit={handleSingleSubmit} className="flex items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isNight ? 'text-red-400' : isDay ? 'text-slate-500' : 'text-sky-400'}`} />
                  <input
                    type="text"
                    value={singleIcao}
                    onChange={(e) => setSingleIcao(e.target.value.toUpperCase())}
                    placeholder="ENTER ICAO AIRPORT CODE (e.g. VIDP, VABB, KJFK, EGLL)..."
                    maxLength={4}
                    className={`w-full border rounded-2xl py-2.5 pl-11 pr-12 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest focus:outline-none transition-all ${inputBgClass}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`font-mono text-xs px-5 sm:px-6 py-3 rounded-2xl transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 ${submitBtnClass}`}
                >
                  {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="tracking-wider">Brief</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRouteSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="grid grid-cols-3 gap-2 flex-1 w-full">
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    placeholder="ORIGIN"
                    maxLength={4}
                    className={`border rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none ${inputBgClass}`}
                  />
                  <input
                    type="text"
                    value={waypointInput}
                    onChange={(e) => setWaypointInput(e.target.value.toUpperCase())}
                    placeholder="WAYPOINTS"
                    className={`border rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none ${inputBgClass}`}
                  />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value.toUpperCase())}
                    placeholder="DEST"
                    maxLength={4}
                    className={`border rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none ${inputBgClass}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full sm:w-auto font-mono text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 ${submitBtnClass}`}
                >
                  {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                  <span className="tracking-wider">Route</span>
                </button>
              </form>
            )}
          </div>

          {/* MODE TABS */}
          <div className={`flex items-center justify-around w-full md:w-auto border p-1 rounded-2xl text-[11px] font-mono uppercase shrink-0 ${
            isNight ? 'border-red-900/60 bg-red-950/70' : isDay ? 'border-slate-300 bg-slate-200' : 'border-white/10 bg-black/60'
          }`}>
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              className={`flex-1 md:flex-none justify-center flex items-center space-x-1.5 px-4 py-2 font-bold rounded-xl transition cursor-pointer min-h-[38px] ${
                viewMode === 'EXECUTIVE' ? activeTabClass : inactiveTabClass
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setViewMode('ROUTE')}
              className={`flex-1 md:flex-none justify-center flex items-center space-x-1.5 px-4 py-2 font-bold rounded-xl transition cursor-pointer min-h-[38px] ${
                viewMode === 'ROUTE' ? activeTabClass : inactiveTabClass
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Route</span>
            </button>
            <button
              onClick={() => setViewMode('CLI')}
              className={`flex-1 md:flex-none justify-center flex items-center space-x-1.5 px-4 py-2 font-bold rounded-xl transition cursor-pointer min-h-[38px] ${
                viewMode === 'CLI' ? activeTabClass : inactiveTabClass
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>CLI</span>
            </button>
          </div>
        </div>

        {/* ROW 3: QUICK AIRFIELDS STRIP */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar text-xs font-mono pt-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 shrink-0 ${isDay ? 'text-slate-600' : 'text-zinc-400'}`}>
            HUB PRESETS:
          </span>
          {viewMode !== 'ROUTE' ? (
            quickAirports.map((ap) => {
              const pillClass = isDay
                ? ap.type === 'RED'
                  ? 'bg-red-100 border border-red-400 text-red-950 font-black shadow-sm'
                  : ap.type === 'YELLOW'
                  ? 'bg-amber-100 border border-amber-400 text-amber-950 font-black shadow-sm'
                  : 'bg-emerald-100 border border-emerald-400 text-emerald-950 font-black shadow-sm'
                : isNight
                ? ap.type === 'RED'
                  ? 'glass-pill-red text-red-200 font-bold'
                  : ap.type === 'YELLOW'
                  ? 'glass-pill-yellow text-amber-200 font-bold'
                  : 'bg-red-950/40 border border-red-900/60 text-red-200 font-bold'
                : ap.type === 'RED'
                ? 'glass-pill-red text-red-200 font-bold'
                : ap.type === 'YELLOW'
                ? 'glass-pill-yellow text-amber-200 font-bold'
                : 'glass-pill-green text-emerald-200 font-bold';

              const ledGlowClass =
                ap.type === 'RED'
                  ? 'led-glow-red'
                  : ap.type === 'YELLOW'
                  ? 'led-glow-yellow'
                  : 'led-glow-green';

              return (
                <button
                  key={ap.code}
                  onClick={() => {
                    setSingleIcao(ap.code);
                    onSearchSingle(ap.code);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${pillClass}`}
                >
                  <span className={`w-2 h-2 rounded-full inline-block ${ledGlowClass}`} />
                  <span className="tracking-wider">{ap.code}</span>
                  <span className="text-[9px] uppercase tracking-tighter opacity-90 font-black">{ap.label}</span>
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
                className={`px-3 py-1 rounded-xl text-[11px] border transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isNight
                    ? 'bg-red-950/50 border-red-900/60 text-red-200 hover:text-white'
                    : isDay
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    : 'bg-zinc-900/80 border-white/10 text-zinc-300 hover:text-white'
                }`}
              >
                <span>{route.name}</span>
                <span className="opacity-60 text-[9px]">({route.origin}→{route.destination})</span>
              </button>
            ))
          )}
        </div>
      </div>
    </header>
  );
};
