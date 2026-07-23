import React, { useState, useEffect } from 'react';
import {
  Header,
  DisplayTheme,
  FontSizeSetting,
} from './components/Header';
import { ExecutiveBriefingView } from './components/ExecutiveBriefingView';
import { TerminalCLIView } from './components/TerminalCLIView';
import { RouteBriefingView } from './components/RouteBriefingView';
import { DispatchLogModal } from './components/DispatchLogModal';
import { KneeboardPrintModal } from './components/KneeboardPrintModal';
import { SavedBriefingsDrawer } from './components/SavedBriefingsDrawer';
import { MonetizationModal, UserTier } from './components/MonetizationModal';
import { BriefingSummary, RouteLegBriefing, AuditLogEntry } from './types';
import { generateClientFallbackBriefing, generateClientFallbackRoute } from './lib/clientFallback';
import { AlertTriangle, ShieldCheck, Zap, WifiOff } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<DisplayTheme>(() => {
    try {
      const saved = localStorage.getItem('vayu_theme');
      if (saved === 'NIGHT_RED' || saved === 'DAY_FLIGHT' || saved === 'DARK_COCKPIT') return saved;
    } catch {}
    return 'DARK_COCKPIT';
  });

  const [fontSize, setFontSize] = useState<FontSizeSetting>('NORMAL');
  const [viewMode, setViewMode] = useState<'EXECUTIVE' | 'CLI' | 'ROUTE'>('EXECUTIVE');

  const [userTier, setUserTier] = useState<UserTier>(() => {
    try {
      const saved = localStorage.getItem('vayu_user_tier');
      if (saved === 'PRO' || saved === 'FLEET' || saved === 'FREE') return saved;
    } catch {}
    return 'PRO';
  });

  const [briefsUsedToday, setBriefsUsedToday] = useState<number>(1);
  const maxFreeBriefs = 3;

  const [briefing, setBriefing] = useState<BriefingSummary | null>(null);
  const [routeBriefing, setRouteBriefing] = useState<RouteLegBriefing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isKneeboardModalOpen, setIsKneeboardModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isMonetizationModalOpen, setIsMonetizationModalOpen] = useState<boolean>(false);

  // Audit history
  const [history, setHistory] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('vayu_audit_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist theme changes
  const handleSetTheme = (newTheme: DisplayTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('vayu_theme', newTheme);
    } catch (e) {
      console.warn('Failed to persist theme preference', e);
    }
  };

  const handleSelectTier = (newTier: UserTier) => {
    setUserTier(newTier);
    try {
      localStorage.setItem('vayu_user_tier', newTier);
    } catch (e) {
      console.warn('Failed to persist tier preference', e);
    }
  };

  // Load default briefing on startup
  useEffect(() => {
    fetchSingleBriefing('KJFK');
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vayu_audit_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [history]);

  const fetchSingleBriefing = async (icao: string) => {
    setIsLoading(true);
    setError(null);

    // Free Tier Usage enforcement check
    if (userTier === 'FREE' && briefsUsedToday >= maxFreeBriefs) {
      setIsMonetizationModalOpen(true);
      setError('Daily Free Tier limit reached (3/3 briefings used). Upgrade to Pro Pilot for unlimited briefings.');
      setIsLoading(false);
      return;
    }

    // Check offline cache first if offline
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem(`vayu_cache_${icao}`);
        if (cached) {
          const parsed: BriefingSummary = JSON.parse(cached);
          setBriefing(parsed);
          setIsLoading(false);
          return;
        }
      } catch {}
    }

    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icao }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 400 && errData.error) {
          setError(errData.error);
          setIsLoading(false);
          return;
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: BriefingSummary = await res.json();
      setBriefing(data);

      // Save to offline cache
      try {
        localStorage.setItem(`vayu_cache_${data.icao}`, JSON.stringify(data));
      } catch {}

      const newEntry: AuditLogEntry = {
        id: `LOG-${data.icao}-${Date.now()}`,
        timestampUtc: data.generatedAtUtc,
        icao: data.icao,
        criticalCount: data.criticalCount,
        warningCount: data.warningCount,
        flightCategory: data.weather.flightCategory,
        briefingJson: data,
      };

      setHistory((prev) => [newEntry, ...prev.filter((h) => h.icao !== data.icao).slice(0, 25)]);
      setBriefsUsedToday((prev) => prev + 1);
    } catch (err: any) {
      console.warn('Fetch briefing network fallback activated:', err);
      const fallbackData = generateClientFallbackBriefing(icao);
      setBriefing(fallbackData);

      const newEntry: AuditLogEntry = {
        id: `LOG-${fallbackData.icao}-${Date.now()}`,
        timestampUtc: fallbackData.generatedAtUtc,
        icao: fallbackData.icao,
        criticalCount: fallbackData.criticalCount,
        warningCount: fallbackData.warningCount,
        flightCategory: fallbackData.weather.flightCategory,
        briefingJson: fallbackData,
      };
      setHistory((prev) => [newEntry, ...prev.filter((h) => h.icao !== fallbackData.icao).slice(0, 25)]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRouteBriefing = async (origin: string, destination: string, waypoints: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/route-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, waypoints }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 400 && errData.error) {
          setError(errData.error);
          setIsLoading(false);
          return;
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: RouteLegBriefing = await res.json();
      setRouteBriefing(data);
      setBriefing(data.origin);
      setViewMode('ROUTE');
    } catch (err: any) {
      console.warn('Fetch route briefing network fallback activated:', err);
      const fallbackRoute = generateClientFallbackRoute(origin, destination, waypoints);
      setRouteBriefing(fallbackRoute);
      setBriefing(fallbackRoute.origin);
      setViewMode('ROUTE');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Speech Synthesis
  const toggleAudioBriefing = async () => {
    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      return;
    }

    if (!briefing) return;

    const speechText = `Attention Pilot in Command. Pre-Flight Briefing for ${briefing.icao}. Weather conditions rated ${briefing.weather.flightCategory}. ${briefing.weather.plainEnglishSummary}. ${briefing.criticalCount} critical alerts active. ${briefing.picTakeaway}`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);

      setIsAudioPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech Synthesis API is not supported in this browser.');
    }
  };

  // Theme Wrapper & Workstation Frame Styles
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'NIGHT_RED':
        return 'bg-[#0a0202] text-[#ff4444] min-h-screen selection:bg-red-900 selection:text-white py-4 sm:py-8 px-3 sm:px-6 relative overflow-x-hidden font-sans transition-colors duration-300';
      case 'DAY_FLIGHT':
        return 'bg-[#f4f4f7] text-slate-900 min-h-screen selection:bg-blue-200 selection:text-black py-4 sm:py-8 px-3 sm:px-6 relative overflow-x-hidden font-sans transition-colors duration-300';
      case 'DARK_COCKPIT':
      default:
        return 'bg-[#030305] text-zinc-100 min-h-screen selection:bg-zinc-800 selection:text-white py-4 sm:py-8 px-3 sm:px-6 relative overflow-x-hidden font-sans transition-colors duration-300';
    }
  };

  const getWorkstationFrameClass = () => {
    switch (theme) {
      case 'NIGHT_RED':
        return 'glass-card-night border-hardware-night shadow-[0_20px_80px_rgba(153,27,27,0.35)] text-red-100';
      case 'DAY_FLIGHT':
        return 'glass-card-day border-hardware-day shadow-[0_16px_60px_rgba(0,0,0,0.08)] text-slate-900';
      case 'DARK_COCKPIT':
      default:
        return 'glass-card-dark border-hardware-dark shadow-[0_20px_80px_rgba(0,0,0,0.95)] text-zinc-100';
    }
  };

  return (
    <div className={getThemeWrapperClass()}>
      {/* Ambient Soft Glow Background Accent */}
      <div className={`fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[180px] pointer-events-none rounded-full z-0 transition-all duration-700 ${
        theme === 'NIGHT_RED' ? 'bg-red-600/10' : theme === 'DAY_FLIGHT' ? 'bg-blue-500/10' : 'bg-blue-600/3'
      }`} />

      {/* MASTER AVIATION WORKSTATION CONTAINER */}
      <div className={`relative max-w-5xl mx-auto rounded-3xl overflow-hidden z-10 transition-all duration-300 border ${getWorkstationFrameClass()}`}>
        
        {/* INTEGRATED HEADER & NAVIGATION */}
        <Header
          theme={theme}
          setTheme={handleSetTheme}
          fontSize={fontSize}
          setFontSize={setFontSize}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isAudioPlaying={isAudioPlaying}
          toggleAudioBriefing={toggleAudioBriefing}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
          onOpenDispatchModal={() => setIsDispatchModalOpen(true)}
          onOpenMonetization={() => setIsMonetizationModalOpen(true)}
          userTier={userTier}
          onSearchSingle={fetchSingleBriefing}
          onSearchRoute={fetchRouteBriefing}
          isLoading={isLoading}
          activeIcao={briefing?.icao}
        />

        {/* MAIN TABLET CONTENT CANVAS */}
        <div className="min-h-[500px]">
          
          {/* Offline In-Flight Banner Indicator */}
          {!isOnline && (
            <div className="m-4 rounded-xl border border-amber-600/60 bg-amber-950/80 p-3 font-mono text-xs text-amber-200 flex items-center space-x-2 shadow-md">
              <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
              <span>[IN-FLIGHT OFFLINE MODE] Serving cached route and airfield briefings from local storage.</span>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="m-4 rounded-xl border border-red-800 bg-red-950/80 p-4 font-mono text-xs text-red-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div>
                  <span className="font-bold">SYSTEM ALERT: </span>
                  {error}
                </div>
              </div>
              <button
                onClick={() => setIsMonetizationModalOpen(true)}
                className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg shrink-0 cursor-pointer text-[11px]"
              >
                Upgrade Tier
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="my-20 flex flex-col items-center justify-center space-y-4 font-mono text-xs text-zinc-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 text-white animate-spin shadow-lg">
                <Zap className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-center">
                <div className={`font-bold tracking-widest text-sm ${theme === 'DAY_FLIGHT' ? 'text-slate-900' : 'text-white'}`}>
                  PROJECT VAYU PARSING METAR & NOTAM FEEDS...
                </div>
                <div className={`text-[11px] mt-1 ${theme === 'DAY_FLIGHT' ? 'text-slate-600' : 'text-zinc-500'}`}>
                  Executing Regex Deterministic Safety Engine & Gemini 3.6 Flash Synthesis
                </div>
              </div>
            </div>
          )}

          {/* Active View Render */}
          {!isLoading && (
            <>
              {viewMode === 'ROUTE' && routeBriefing ? (
                <RouteBriefingView
                  routeData={routeBriefing}
                  theme={theme}
                  fontSize={fontSize}
                  onOpenKneeboard={() => setIsKneeboardModalOpen(true)}
                  onOpenDispatchModal={() => setIsDispatchModalOpen(true)}
                />
              ) : viewMode === 'CLI' && briefing ? (
                <TerminalCLIView briefing={briefing} theme={theme} />
              ) : briefing ? (
                <ExecutiveBriefingView
                  briefing={briefing}
                  theme={theme}
                  fontSize={fontSize}
                  onOpenKneeboard={() => setIsKneeboardModalOpen(true)}
                  onOpenDispatchModal={() => setIsDispatchModalOpen(true)}
                  onSearchSingle={fetchSingleBriefing}
                />
              ) : null}
            </>
          )}
        </div>

        {/* WORKSTATION BOTTOM BAR WITH MANDATORY LEGAL DISCLAIMER */}
        <div className={`py-3.5 text-center border-t px-4 sm:px-6 transition-colors duration-300 font-mono ${
          theme === 'NIGHT_RED'
            ? 'glass-card-night border-hardware-night text-red-300'
            : theme === 'DAY_FLIGHT'
            ? 'glass-card-day border-hardware-day text-slate-700'
            : 'glass-card-dark border-hardware-dark text-zinc-400'
        }`}>
          <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-left text-[11px] ${
            theme === 'NIGHT_RED'
              ? 'glass-card-night border-hardware-night text-red-200'
              : theme === 'DAY_FLIGHT'
              ? 'glass-card-day border-hardware-day text-slate-800 shadow-sm'
              : 'glass-card-dark border-hardware-dark text-zinc-300'
          }`}>
            <div className="flex items-center space-x-2 shrink-0 font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>PROJECT VAYU EFB</span>
            </div>
            <div className="text-[10px] sm:text-[11px] leading-relaxed opacity-90">
              ADVISORY ONLY: Project VAYU is an informational pre-flight awareness utility. Pilots retain sole operational authority under DGCA and FAA regulations.
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <DispatchLogModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        briefing={briefing}
        theme={theme}
      />

      <KneeboardPrintModal
        isOpen={isKneeboardModalOpen}
        onClose={() => setIsKneeboardModalOpen(false)}
        briefing={briefing}
      />

      <SavedBriefingsDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        history={history}
        onSelectBriefing={(entry) => {
          setBriefing(entry.briefingJson);
          setViewMode('EXECUTIVE');
        }}
        onClearHistory={() => setHistory([])}
        theme={theme}
      />

      <MonetizationModal
        isOpen={isMonetizationModalOpen}
        onClose={() => setIsMonetizationModalOpen(false)}
        currentTier={userTier}
        onSelectTier={(t) => {
          handleSelectTier(t);
          setIsMonetizationModalOpen(false);
        }}
        briefsUsedToday={briefsUsedToday}
        maxFreeBriefs={maxFreeBriefs}
        theme={theme}
      />
    </div>
  );
}
