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
import { AuthModal } from './components/AuthModal';
import { BriefingSummary, RouteLegBriefing, AuditLogEntry } from './types';
import { generateClientFallbackBriefing, generateClientFallbackRoute } from './lib/clientFallback';
import { supabase, getUserProfile, UserProfile, recordBriefingAudit } from './lib/supabaseClient';
import { SaaSAppShell, SaaSTab } from './components/SaaSAppShell';
import { NotFoundPage } from './components/NotFoundPage';
import { FloatingCloudBackground } from './components/FloatingCloudBackground';
import { AlertTriangle, ShieldCheck, Zap, WifiOff, Compass } from 'lucide-react';

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
  const [saasTab, setSaasTab] = useState<SaaSTab>('BRIEFING');

  const handleSaasTabChange = (tab: SaaSTab) => {
    setSaasTab(tab);
    if (tab === 'BRIEFING') setViewMode('EXECUTIVE');
    if (tab === 'ROUTE') setViewMode('ROUTE');
    if (tab === 'DISPATCH') setIsDispatchModalOpen(true);
    if (tab === 'BILLING') setIsMonetizationModalOpen(true);
    if (tab === 'FLEET') setIsMonetizationModalOpen(true);
    if (tab === 'BOT') {
      alert('📱 WhatsApp Briefing Bot active on +1 (800) VAYU-BOT. Text any ICAO code (e.g. "VIDP") for instant cards!');
    }
  };

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Supabase Auth Listener
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        getUserProfile(session.user.id, session.user.email || '').then((prof) => {
          setCurrentUser(prof);
          if (prof.subscription_tier) {
            setUserTier(prof.subscription_tier.toUpperCase() as UserTier);
          }
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const prof = await getUserProfile(session.user.id, session.user.email || '');
        setCurrentUser(prof);
        if (prof.subscription_tier) {
          setUserTier(prof.subscription_tier.toUpperCase() as UserTier);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
        headers: {
          'Content-Type': 'application/json',
          'x-vayu-tier': userTier,
        },
        body: JSON.stringify({ icao }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setIsMonetizationModalOpen(true);
          setError(errData.message || 'Daily free briefing limit reached. Upgrade to Pro for unlimited corridor briefings.');
          setIsLoading(false);
          return;
        }
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

      // Record audit log to Supabase
      recordBriefingAudit(currentUser?.id, {
        icao: data.icao,
        generated_at_utc: data.generatedAtUtc,
        critical_count: data.criticalCount,
        warning_count: data.warningCount,
        flight_category: data.weather.flightCategory,
      });

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

    // Free Tier Usage check for route corridor
    if (userTier === 'FREE' && briefsUsedToday >= maxFreeBriefs) {
      setIsMonetizationModalOpen(true);
      setError('Daily free briefing limit reached. Upgrade to Pro for unlimited corridor briefings.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/route-briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vayu-tier': userTier,
        },
        body: JSON.stringify({ origin, destination, waypoints }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setIsMonetizationModalOpen(true);
          setError(errData.message || 'Daily free briefing limit reached. Upgrade to Pro for unlimited corridor briefings.');
          setIsLoading(false);
          return;
        }
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
    return 'cirrus-sky-bg text-[#0e1116] min-h-screen selection:bg-[#2e7def]/20 selection:text-[#0e1116] py-6 sm:py-10 px-4 sm:px-6 relative font-sans';
  };

  const getWorkstationFrameClass = () => {
    return 'cirrus-card text-[#0e1116]';
  };

  return (
    <div className={getThemeWrapperClass()}>
      {/* Floating SVG Sky Clouds Background */}
      <FloatingCloudBackground />

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
          onOpenAuth={() => setIsAuthModalOpen(true)}
          userTier={userTier}
          userEmail={currentUser?.email}
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
                  onSearchRoute={fetchRouteBriefing}
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
              ) : (
                /* LANDING SEARCH PORTAL (NO DEFAULT BRIEFING LOADED) */
                <div className="py-10 px-4 max-w-4xl mx-auto text-center font-sans">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold mb-4 border bg-blue-500/10 border-blue-500/30 text-blue-500">
                    <Compass className="w-4 h-4" />
                    <span>AIRSPACE BRIEFING DISPATCH PORTAL</span>
                  </div>
                  <h2 className={`text-3xl sm:text-5xl font-mono font-black tracking-tight mb-3 ${
                    theme === 'NIGHT_RED' ? 'text-red-400' : theme === 'DAY_FLIGHT' ? 'text-slate-900' : 'text-white'
                  }`}>
                    SEARCH AIRSPACE OR SELECT A HUB
                  </h2>
                  <p className={`text-xs sm:text-sm max-w-xl mx-auto mb-8 font-sans ${
                    theme === 'NIGHT_RED' ? 'text-red-300/80' : theme === 'DAY_FLIGHT' ? 'text-slate-600 font-medium' : 'text-zinc-400'
                  }`}>
                    Enter any ICAO or IATA airfield code in the search bar above (e.g. VIDP, VABB, VOBL, KJFK), or launch an instant pre-flight briefing for major hubs below:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    {[
                      { code: 'VIDP', name: 'Indira Gandhi Intl', city: 'Delhi, India', cat: 'VFR' },
                      { code: 'VABB', name: 'Chhatrapati Shivaji', city: 'Mumbai, India', cat: 'MVFR' },
                      { code: 'VOBL', name: 'Kempegowda Intl', city: 'Bengaluru, India', cat: 'VFR' },
                      { code: 'VDGO', name: 'Manohar Intl', city: 'Goa Mopa, India', cat: 'IFR' },
                      { code: 'VOHS', name: 'Rajiv Gandhi Intl', city: 'Hyderabad, India', cat: 'VFR' },
                      { code: 'VOMM', name: 'Chennai Intl', city: 'Chennai, India', cat: 'VFR' },
                      { code: 'KJFK', name: 'John F. Kennedy', city: 'New York, USA', cat: 'VFR' },
                      { code: 'EGLL', name: 'London Heathrow', city: 'London, UK', cat: 'VFR' },
                    ].map((hub) => (
                      <button
                        key={hub.code}
                        onClick={() => fetchSingleBriefing(hub.code)}
                        className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${
                          theme === 'NIGHT_RED'
                            ? 'glass-card-night border-red-900/60 hover:border-red-500 text-red-100'
                            : theme === 'DAY_FLIGHT'
                            ? 'bg-white border-slate-200 hover:border-blue-500 hover:bg-slate-50 text-slate-900 shadow-sm'
                            : 'glass-card-dark border-zinc-800 hover:border-zinc-500 text-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xl font-mono font-black tracking-wider text-blue-500 group-hover:text-blue-600">
                            {hub.code}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                            hub.cat === 'VFR'
                              ? theme === 'DAY_FLIGHT' ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold' : 'glass-pill-green text-emerald-200 font-bold'
                              : hub.cat === 'MVFR'
                              ? theme === 'DAY_FLIGHT' ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold' : 'glass-pill-yellow text-amber-200 font-bold'
                              : theme === 'DAY_FLIGHT' ? 'bg-red-100 text-red-950 border-red-400 font-bold' : 'glass-pill-red text-red-200 font-bold'
                          }`}>
                            {hub.cat}
                          </span>
                        </div>
                        <div className={`text-xs font-bold leading-snug line-clamp-1 ${
                          theme === 'DAY_FLIGHT' ? 'text-slate-900' : 'text-zinc-200'
                        }`}>
                          {hub.name}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${
                          theme === 'DAY_FLIGHT' ? 'text-slate-500' : 'text-zinc-500'
                        }`}>
                          {hub.city}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
          if (profile.subscription_tier) {
            handleSelectTier(profile.subscription_tier.toUpperCase() as UserTier);
          }
        }}
        onLogout={() => {
          setCurrentUser(null);
          if (supabase) {
            supabase.auth.signOut();
          }
        }}
        theme={theme}
        currentTier={userTier}
      />
    </div>
  );
}
