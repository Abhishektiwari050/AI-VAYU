import React from 'react';
import { X, Check, Zap, Shield, Crown, Building2, CreditCard } from 'lucide-react';
import { DisplayTheme } from './Header';

export type UserTier = 'FREE' | 'PRO' | 'FLEET';

interface MonetizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: UserTier;
  onSelectTier: (tier: UserTier) => void;
  briefsUsedToday: number;
  maxFreeBriefs: number;
  theme: DisplayTheme;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  onSelectTier,
  briefsUsedToday,
  maxFreeBriefs,
  theme,
}) => {
  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const modalBg = isNight
    ? 'bg-[#180404] text-red-100 border-red-900/80'
    : isDay
    ? 'bg-white text-slate-900 border-slate-300'
    : 'bg-[#12141a] text-white border-zinc-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-sans">
      <div className={`w-full max-w-4xl border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto transition-colors ${modalBg}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-lg">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
                VAYU AVIATION TIERS & SUBSCRIPTION
              </h2>
              <p className="text-xs opacity-70 font-mono">
                FAR Part 91 & Part 135 Compliant Pre-Flight Intelligence Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Plan Alert Bar */}
        <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
          currentTier === 'PRO'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : currentTier === 'FLEET'
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
            : 'bg-zinc-900/60 border-zinc-700/60 text-zinc-300'
        }`}>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>
              ACTIVE TIER: <strong className="uppercase font-bold text-white">{currentTier} PILOT</strong>
            </span>
          </div>
          {currentTier === 'FREE' && (
            <div>
              Daily Briefings Usage: <strong className="text-amber-400">{briefsUsedToday} / {maxFreeBriefs} USED TODAY</strong>
            </div>
          )}
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* FREE TIER */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between transition relative ${
            currentTier === 'FREE' ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-black/20'
          }`}>
            <div>
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1">STANDARD</div>
              <h3 className="text-lg font-bold">Free Tier</h3>
              <div className="text-2xl font-mono font-black my-2">$0 <span className="text-xs font-normal opacity-60">/ forever</span></div>
              <p className="text-xs opacity-70 mb-4 leading-relaxed">
                Essential pre-flight awareness for GA pilots flying single airports.
              </p>
              
              <ul className="space-y-2 text-xs font-mono opacity-80 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>3 Airport Briefs / Day</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Regex Deterministic Engine</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live NOAA METARs</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectTier('FREE')}
              disabled={currentTier === 'FREE'}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border ${
                currentTier === 'FREE'
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-default'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {currentTier === 'FREE' ? 'CURRENT TIER' : 'SELECT FREE'}
            </button>
          </div>

          {/* PRO TIER */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between transition relative shadow-xl ${
            currentTier === 'PRO' ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500/50 bg-emerald-950/20'
          }`}>
            <div className="absolute -top-3 right-4 bg-emerald-500 text-black text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MOST POPULAR
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">PROFESSIONAL</div>
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <span>Pro Pilot</span>
                <Crown className="h-4 w-4 text-amber-400" />
              </h3>
              <div className="text-2xl font-mono font-black my-2">$9.99 <span className="text-xs font-normal opacity-60">/ month</span></div>
              <p className="text-xs opacity-70 mb-4 leading-relaxed">
                Unlimited flight route corridor briefings, audio narration, and PDF dispatch exports.
              </p>
              
              <ul className="space-y-2 text-xs font-mono opacity-90 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Unlimited Briefings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Route Corridor Waypoint Engine</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Gemini 3.6 Flash Voice Briefings</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>FAA SWIM Enterprise Redundancy</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Offline Kneeboard PDF Export</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectTier('PRO')}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border flex items-center justify-center space-x-2 ${
                currentTier === 'PRO'
                  ? 'bg-emerald-500 text-black border-emerald-400 font-black cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-400 shadow-lg'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>{currentTier === 'PRO' ? 'ACTIVE PRO TIER' : 'UPGRADE TO PRO ($9.99)'}</span>
            </button>
          </div>

          {/* FLEET TIER */}
          <div className={`border rounded-2xl p-5 flex flex-col justify-between transition relative ${
            currentTier === 'FLEET' ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/30 bg-purple-950/20'
          }`}>
            <div>
              <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">ENTERPRISE / PART 135</div>
              <h3 className="text-lg font-bold flex items-center gap-1.5">
                <span>Fleet & School</span>
                <Building2 className="h-4 w-4 text-purple-400" />
              </h3>
              <div className="text-2xl font-mono font-black my-2">$49 <span className="text-xs font-normal opacity-60">/ month</span></div>
              <p className="text-xs opacity-70 mb-4 leading-relaxed">
                Multi-seat flight school dashboard with Part 135 compliance dispatch logging.
              </p>
              
              <ul className="space-y-2 text-xs font-mono opacity-90 mb-6">
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-purple-400" />
                  <span>10 Pilot Multi-Seat Licenses</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-purple-400" />
                  <span>Part 135 Audit Trail Logging</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-purple-400" />
                  <span>SMS & WhatsApp Dispatch Alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-3.5 w-3.5 text-purple-400" />
                  <span>Dedicated SWIM Direct Data Pipe</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectTier('FLEET')}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border flex items-center justify-center space-x-2 ${
                currentTier === 'FLEET'
                  ? 'bg-purple-500 text-white border-purple-400 font-black cursor-default'
                  : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-lg'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>{currentTier === 'FLEET' ? 'ACTIVE FLEET TIER' : 'ACTIVATE FLEET ($49)'}</span>
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] font-mono opacity-50 border-t pt-4 border-white/10">
          Stripe Billing Integration • Cancel or change tiers anytime • Direct FAA SWIM Cloud Sync Enabled
        </div>

      </div>
    </div>
  );
};
