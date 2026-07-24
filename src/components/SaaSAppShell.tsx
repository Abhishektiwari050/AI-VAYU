import React, { useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  Users,
  FileText,
  MessageSquare,
  CreditCard,
  Settings,
  Bell,
  ChevronDown,
  ShieldCheck,
  Zap,
  Globe,
  Menu,
  X,
  Search,
  Crown,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { UserTier } from './MonetizationModal';
import { DisplayTheme } from './Header';
import { VayuLogo } from './VayuLogo';

export type SaaSTab = 'BRIEFING' | 'ROUTE' | 'FLEET' | 'DISPATCH' | 'BOT' | 'BILLING';

interface SaaSAppShellProps {
  children: React.ReactNode;
  activeTab: SaaSTab;
  setActiveTab: (tab: SaaSTab) => void;
  userTier: UserTier;
  onOpenMonetization: () => void;
  onOpenAuth: () => void;
  onOpenDispatchModal: () => void;
  userEmail?: string;
  theme: DisplayTheme;
  activeIcao?: string;
}

export const SaaSAppShell: React.FC<SaaSAppShellProps> = ({
  children,
  activeTab,
  setActiveTab,
  userTier,
  onOpenMonetization,
  onOpenAuth,
  onOpenDispatchModal,
  userEmail,
  theme,
  activeIcao = 'VIDP',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentZulu = new Date().toISOString().substring(11, 16);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const navItems: { id: SaaSTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'BRIEFING', label: 'Briefing Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'ROUTE', label: 'Corridor Route Planner', icon: <Compass className="w-4 h-4" /> },
    { id: 'FLEET', label: 'Fleet & Aircraft Manager', icon: <Users className="w-4 h-4" />, badge: 'FLEET' },
    { id: 'DISPATCH', label: 'Dispatch Audit Logs', icon: <FileText className="w-4 h-4" /> },
    { id: 'BOT', label: 'WhatsApp / Bot Webhook', icon: <MessageSquare className="w-4 h-4" />, badge: 'AUTO' },
    { id: 'BILLING', label: 'Subscription & Billing', icon: <CreditCard className="w-4 h-4" /> },
  ];

  const sidebarClass = isNight
    ? 'bg-[#100404] border-red-950/80 text-red-100'
    : isDay
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-[#0b0e14] border-white/[0.08] text-slate-100';

  const headerClass = isNight
    ? 'bg-[#100404]/90 border-red-950/80 text-red-100'
    : isDay
    ? 'bg-white/90 border-slate-200 text-slate-900'
    : 'bg-[#0b0e14]/90 border-white/[0.08] text-slate-100';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${
      isNight ? 'bg-[#080202] text-red-100' : isDay ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#07090e] text-[#f1f5f9]'
    }`}>
      {/* MOBILE BACKDROP OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* SAAS COLLAPSIBLE SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 border-r z-50 flex flex-col justify-between p-4 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${sidebarClass}`}
      >
        <div>
          {/* Workspace Brand Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
            <VayuLogo size="md" showText={true} />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SaaS Workspace Selector */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-semibold text-white leading-tight">Global Workspace</div>
                <div className="text-[10px] text-zinc-400">DGCA & FAA Live</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 font-mono text-xs">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl font-medium transition cursor-pointer flex items-center justify-between ${
                    active
                      ? isNight
                        ? 'bg-red-600 text-white font-bold'
                        : isDay
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Session */}
        <div className="pt-4 border-t border-white/[0.08] font-mono text-xs space-y-2">
          <button
            onClick={onOpenMonetization}
            className="w-full p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">{userTier} TIER</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400 underline">Upgrade</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="w-full p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] text-zinc-300 transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-medium truncate max-w-[130px]">
                {userEmail ? userEmail.split('@')[0] : 'Sign In'}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN APPLICATION WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP SAAS APPLICATION BAR */}
        <header className={`sticky top-0 z-30 px-4 sm:px-6 py-3 border-b backdrop-blur-xl flex items-center justify-between gap-4 font-mono text-xs ${headerClass}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Aerodrome:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300">
                {activeIcao}
              </span>
            </div>
          </div>

          {/* Top SaaS KPI Metrics Bar */}
          <div className="hidden lg:flex items-center gap-6 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-zinc-400">Stream:</span>
              <span className="font-semibold text-white">FAA & DGCA 100% Realtime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-zinc-400">Zulu:</span>
              <span className="font-semibold text-white">{currentZulu}Z</span>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDispatchModal}
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dispatch PDF</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE BODY CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
