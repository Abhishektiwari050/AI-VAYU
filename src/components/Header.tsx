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
  Plane,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { PRESET_ROUTES } from '../lib/airportData';
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
  userTier: UserTier;
  onSearchSingle: (icao: string) => void;
  onSearchRoute: (origin: string, destination: string, waypoints: string[]) => void;
  isLoading: boolean;
  activeIcao?: string;
}

function normalizeCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length === 3 && /^[A-Z]{3}$/.test(trimmed)) {
    return 'K' + trimmed;
  }
  return trimmed;
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
  userTier,
  onSearchSingle,
  onSearchRoute,
  isLoading,
  activeIcao = 'KJFK',
}) => {
  const currentZulu = new Date().toISOString().substring(11, 16);

  const [singleIcao, setSingleIcao] = useState(activeIcao);
  const [origin, setOrigin] = useState('KJFK');
  const [destination, setDestination] = useState('KBOS');
  const [waypointInput, setWaypointInput] = useState('KPVD');

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
    { code: 'KJFK', status: '🟢', type: 'GREEN', label: 'VFR' },
    { code: 'KDFW', status: '🔴', type: 'RED', label: 'CRITICAL' },
    { code: 'KLAX', status: '🟢', type: 'GREEN', label: 'VFR' },
    { code: 'KORD', status: '🟡', type: 'YELLOW', label: 'ADVISORY' },
    { code: 'KDEN', status: '🟢', type: 'GREEN', label: 'VFR' },
    { code: 'EGLL', status: '🟢', type: 'GREEN', label: 'VFR' },
  ];

  // Theme-driven styling variables
  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const borderHardwareClass = isNight
    ? 'border-hardware-night'
    : isDay
    ? 'border-hardware-day'
    : 'border-hardware-dark';

  const ribbonGlassClass = isNight
    ? 'glass-command-ribbon-night text-red-100'
    : isDay
    ? 'glass-command-ribbon-day text-slate-900'
    : 'glass-command-ribbon-dark text-white';

  const inputBgClass = isNight
    ? 'bg-red-950/50 border-hardware-night text-red-100 placeholder-red-400/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
    : isDay
    ? 'bg-white/90 border-hardware-day text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-500/30'
    : 'bg-black/80 border-hardware-dark text-white placeholder-zinc-500 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/30';

  const actionBtnClass = isNight
    ? 'border-hardware-night bg-red-950/60 text-red-200 hover:bg-red-900/80'
    : isDay
    ? 'border-hardware-day bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    : 'border-hardware-dark bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white';

  const activeTabClass = isNight
    ? 'bg-red-600 text-white shadow-md font-bold'
    : isDay
    ? 'bg-slate-900 text-white shadow-md font-bold'
    : 'bg-zinc-100 text-zinc-950 shadow-sm font-bold';

  const inactiveTabClass = isNight
    ? 'text-red-300/70 hover:text-red-100'
    : isDay
    ? 'text-slate-600 hover:text-slate-900'
    : 'text-zinc-400 hover:text-white';

  const submitBtnClass = isNight
    ? 'bg-red-600 hover:bg-red-500 text-white shadow-sm'
    : isDay
    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
    : 'bg-white hover:bg-zinc-200 text-black font-bold shadow-sm';

  return (
    <header className={`w-full p-3.5 sm:p-5 rounded-t-[26px] shadow-2xl relative z-30 font-sans transition-all duration-300 ${ribbonGlassClass}`}>
      {/* UNIFIED GLASSMORPHIC COMMAND RIBBON */}
      <div className="flex flex-col gap-3">
        
        {/* ROW 1: BRANDING, ZULU CLOCK & COCKPIT CONTROLS */}
        <div className={`flex flex-wrap items-center justify-between gap-3 text-xs font-mono uppercase tracking-wider pb-2.5 border-b ${
          isNight ? 'border-red-900/40' : isDay ? 'border-slate-300/80' : 'border-white/[0.12]'
        }`}>
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <VayuLogo size="md" showText={true} />
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse inline-block ${isNight ? 'led-glow-red' : isDay ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)]' : 'led-glow-green'}`} />

            {/* FAA SWIM Data Feed Status Badge */}
            <div className={`hidden md:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
              isNight
                ? 'border-red-900/60 bg-red-950/40 text-red-300'
                : isDay
                ? 'border-slate-200 bg-slate-100 text-slate-700'
                : 'border-zinc-800 bg-zinc-900/90 text-zinc-300'
            }`}>
              <ShieldCheck className="h-3 w-3 text-zinc-400" />
              <span>FAA SWIM CONNECTED</span>
            </div>
          </div>

          {/* Right: Tier Badge, Zulu Clock & Cockpit Theme Controls */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 text-xs">
            
            {/* Tier / Subscription Badge Button */}
            <button
              onClick={onOpenMonetization}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer border ${
                userTier === 'PRO'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : userTier === 'FLEET'
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              <Crown className="h-3 w-3 text-amber-400" />
              <span>{userTier} PILOT</span>
            </button>

            <span className={`hidden sm:inline text-[11px] ${isDay ? 'text-slate-600' : 'text-zinc-400'}`}>
              Zulu: <strong className={`font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>{currentZulu}Z</strong>
            </span>

            <button
              onClick={onOpenDispatchModal}
              className={`flex items-center space-x-1 border px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${actionBtnClass}`}
              title="Dispatch Audit Log"
            >
              <FileText className="h-3.5 w-3.5 opacity-70" />
              <span className="hidden sm:inline">Dispatch</span>
            </button>

            <button
              onClick={onOpenHistory}
              className={`flex items-center space-x-1 border px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${actionBtnClass}`}
              title="Audit Trail"
            >
              <History className="h-3.5 w-3.5 opacity-70" />
              <span className="hidden sm:inline">Audit</span>
            </button>

            <button
              onClick={toggleAudioBriefing}
              className={`flex items-center space-x-1 border px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                isAudioPlaying
                  ? 'border-emerald-500 bg-emerald-500 text-black animate-pulse font-black'
                  : actionBtnClass
              }`}
            >
              {isAudioPlaying ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isAudioPlaying ? 'Stop' : 'Audio'}</span>
            </button>

            {/* Hardware Cockpit Theme Selector */}
            <div className={`flex items-center border p-0.5 rounded-lg transition-colors ${
              isNight
                ? 'border-hardware-night bg-red-950/80'
                : isDay
                ? 'border-hardware-day bg-slate-200'
                : 'border-hardware-dark bg-zinc-900/90'
            }`}>
              <button
                type="button"
                onClick={() => setTheme('DARK_COCKPIT')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  theme === 'DARK_COCKPIT'
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : isDay
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Dark Cockpit Mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTheme('NIGHT_RED')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  theme === 'NIGHT_RED'
                    ? 'bg-red-600 text-white font-bold shadow-sm'
                    : isDay
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Night-Vision Red Mode"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setTheme('DAY_FLIGHT')}
                className={`p-1.5 rounded cursor-pointer transition ${
                  theme === 'DAY_FLIGHT'
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Day Sunlight Mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* ROW 2: SINGLE INTEGRATED GLASS COMMAND RIBBON (PRIMARY FOCUS SEARCH BAR + NAVIGATION SWITCHER TABS) */}
        <div className={`p-2.5 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-all ${
          isNight
            ? 'glass-command-ribbon-night'
            : isDay
            ? 'glass-command-ribbon-day'
            : 'glass-command-ribbon-dark'
        }`}>
          
          {/* PRIMARY FOCUS: SEARCH INPUT FORM */}
          <div className="flex-1">
            {viewMode !== 'ROUTE' ? (
              <form onSubmit={handleSingleSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${isNight ? 'text-red-400' : isDay ? 'text-slate-500' : 'text-emerald-400'}`} />
                  <input
                    type="text"
                    value={singleIcao}
                    onChange={(e) => setSingleIcao(e.target.value.toUpperCase())}
                    placeholder="ENTER ICAO / FAA AIRPORT CODE (e.g. KJFK, DFW, KLAX)..."
                    maxLength={4}
                    className={`w-full border rounded-xl py-2.5 pl-11 pr-3 text-xs sm:text-sm font-mono font-bold uppercase tracking-widest focus:outline-none transition-all shadow-inner ${inputBgClass}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 ${submitBtnClass}`}
                >
                  {isLoading ? (
                    <Zap className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="tracking-wider">Brief</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRouteSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="grid grid-cols-3 gap-1.5 flex-1 w-full">
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
                  className={`w-full sm:w-auto font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 ${submitBtnClass}`}
                >
                  {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                  <span className="tracking-wider">Route</span>
                </button>
              </form>
            )}
          </div>

          {/* SEAMLESS INTEGRATED NAVIGATION TABS */}
          <div className={`flex items-center border p-1 rounded-xl text-[11px] font-mono uppercase shrink-0 ${
            isNight ? 'border-hardware-night bg-red-950/90' : isDay ? 'border-hardware-day bg-slate-200/90' : 'border-hardware-dark bg-zinc-900/90'
          }`}>
            <button
              onClick={() => setViewMode('EXECUTIVE')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'EXECUTIVE' ? activeTabClass : inactiveTabClass
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Card</span>
            </button>
            <button
              onClick={() => setViewMode('ROUTE')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'ROUTE' ? activeTabClass : inactiveTabClass
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Route</span>
            </button>
            <button
              onClick={() => setViewMode('CLI')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'CLI' ? activeTabClass : inactiveTabClass
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>CLI</span>
            </button>
          </div>
        </div>

        {/* ROW 3: QUICK AIRFIELDS STRIP WITH FROSTED LIQUID GLASS PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono pt-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider mr-0.5 shrink-0 ${isDay ? 'text-slate-600' : 'text-zinc-400'}`}>QUICK AIRFIELDS:</span>
          {viewMode !== 'ROUTE' ? (
            quickAirports.map((ap) => {
              const pillClass =
                ap.type === 'RED'
                  ? 'glass-pill-red text-red-200'
                  : ap.type === 'YELLOW'
                  ? 'glass-pill-yellow text-amber-200'
                  : isNight
                  ? 'bg-red-950/40 border border-red-900/60 text-red-200'
                  : isDay
                  ? 'bg-white border border-slate-200 text-slate-800'
                  : 'bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white';

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
                  className={`px-3 py-1 rounded-xl text-[11px] font-mono font-bold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${pillClass}`}
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
                className={`px-2.5 py-0.5 rounded-lg text-[11px] border transition flex items-center gap-1 shrink-0 cursor-pointer ${
                  isNight
                    ? 'bg-red-950/50 border-hardware-night text-red-200 hover:text-white'
                    : isDay
                    ? 'bg-white border-hardware-day text-slate-800 hover:bg-slate-100'
                    : 'bg-zinc-900/80 border-hardware-dark text-zinc-300 hover:text-white'
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
