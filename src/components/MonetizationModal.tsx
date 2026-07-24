import React, { useState } from 'react';
import { X, Check, Zap, Shield, Crown, Building2, CreditCard, Lock, UserCheck, CheckCircle2 } from 'lucide-react';
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
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<UserTier | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [userEmail, setUserEmail] = useState('pic.pilot@vayu.aero');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const modalBg = isNight
    ? 'bg-[#180404] text-red-100 border-red-900/80'
    : isDay
    ? 'bg-white text-slate-900 border-slate-300'
    : 'bg-[#12141a] text-white border-zinc-800';

  const handleSimulatedStripeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setIsProcessingStripe(true);
    setTimeout(() => {
      setIsProcessingStripe(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onSelectTier(selectedPlanForCheckout);
        setPaymentSuccess(false);
        setSelectedPlanForCheckout(null);
        onClose();
      }, 1400);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-sans">
      <div className={`w-full max-w-4xl border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto transition-colors ${modalBg}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-current/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-lg">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">
                  VAYU AVIATION TIERS & SUBSCRIPTION
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  STRIPE AUTH CONNECTED
                </span>
              </div>
              <p className="text-xs opacity-70 font-mono">
                FAR Part 91, 121 & 135 Compliant Pre-Flight Intelligence Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Switcher */}
            <div className="flex items-center bg-black/20 p-1 rounded-xl border border-current/10 text-xs font-mono">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${currency === 'USD' ? 'bg-amber-500 text-black' : 'opacity-60 hover:opacity-100'}`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${currency === 'INR' ? 'bg-amber-500 text-black' : 'opacity-60 hover:opacity-100'}`}
              >
                INR (₹)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-current/10 hover:bg-current/10 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Current Auth Pilot Status & Usage Bar */}
        <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
          currentTier === 'PRO'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : currentTier === 'FLEET'
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
            : 'bg-zinc-900/60 border-zinc-700/60 text-zinc-300'
        }`}>
          <div className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>
              AUTHENTICATED PILOT: <strong className="text-white">{userEmail}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>
              ACTIVE TIER: <strong className="uppercase font-bold text-white">{currentTier} PILOT</strong>
            </span>
            {currentTier === 'FREE' && (
              <span className="ml-2 font-bold text-amber-400">
                ({briefsUsedToday} / {maxFreeBriefs} Daily Queries Used)
              </span>
            )}
          </div>
        </div>

        {/* STRIPE CHECKOUT MODAL OVERLAY (IF A PLAN IS SELECTED) */}
        {selectedPlanForCheckout ? (
          <div className="border rounded-2xl p-6 bg-slate-900/95 text-white border-amber-500/50 shadow-2xl space-y-4 font-mono">
            <div className="flex justify-between items-center border-b pb-3 border-zinc-700">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h3 className="font-mono font-bold text-lg">
                  STRIPE SECURE CHECKOUT — {selectedPlanForCheckout} SUBSCRIPTION
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="text-xs font-mono opacity-70 hover:opacity-100 underline"
              >
                Cancel / Change Plan
              </button>
            </div>

            {paymentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-xl font-mono font-bold text-emerald-300">
                  PAYMENT AUTHORIZED & VERIFIED!
                </h4>
                <p className="text-xs font-mono text-zinc-300">
                  Stripe Subscription Activated for <strong className="text-white">{userEmail}</strong>. Upgrading account to {selectedPlanForCheckout}...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSimulatedStripeSubmit} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 flex justify-between items-center">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">SELECTED TIER</span>
                    <strong className="text-amber-400 text-sm font-bold uppercase">{selectedPlanForCheckout} PILOT TIER</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-400 block text-[10px]">RECURRING CHARGE</span>
                    <strong className="text-white text-base font-bold">
                      {selectedPlanForCheckout === 'PRO' ? (currency === 'INR' ? '₹799 / mo' : '$9.99 / mo') : (currency === 'INR' ? '₹3,999 / mo' : '$49.00 / mo')}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 text-[10px] mb-1">PILOT ACCOUNT EMAIL</label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-zinc-400 text-[10px]">STRIPE CREDIT CARD / PAYMENT METHOD</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      required
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono pl-10 focus:border-amber-400 focus:outline-none"
                    />
                    <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 text-[10px] mb-1">EXPIRY (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-[10px] mb-1">CVC / CWW</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        required
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessingStripe}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isProcessingStripe ? (
                      <>
                        <Zap className="w-4 h-4 animate-spin" />
                        <span>PROCESSING STRIPE PAYMENT...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>CONFIRM & PAY ({selectedPlanForCheckout === 'PRO' ? (currency === 'INR' ? '₹799' : '$9.99') : (currency === 'INR' ? '₹3,999' : '$49.00')})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Tier Cards Grid */
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
                  Essential pre-flight awareness for GA pilots with 3 daily briefing queries.
                </p>
                
                <ul className="space-y-2 text-xs font-mono opacity-80 mb-6">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>3 Airport Queries / Day</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Regex Deterministic Scanner</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>NOAA METAR Weather Feeds</span>
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
                <div className="text-2xl font-mono font-black my-2">
                  {currency === 'INR' ? '₹799' : '$9.99'}{' '}
                  <span className="text-xs font-normal opacity-60">/ month</span>
                </div>
                <p className="text-xs opacity-70 mb-4 leading-relaxed">
                  Unlimited queries, downloadable PDF dispatch logs, and instant SMS/WhatsApp briefing sharing.
                </p>
                
                <ul className="space-y-2 text-xs font-mono opacity-90 mb-6">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Unlimited Briefing Queries</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Downloadable PDF Dispatch Logs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>SMS & WhatsApp Sharing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Route Waypoint Corridor Engine</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanForCheckout('PRO')}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border flex items-center justify-center space-x-2 ${
                  currentTier === 'PRO'
                    ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-black border-emerald-400 shadow-lg'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{currentTier === 'PRO' ? 'RENEW PRO TIER' : `UPGRADE PRO (${currency === 'INR' ? '₹799' : '$9.99'})`}</span>
              </button>
            </div>

            {/* FLEET TIER */}
            <div className={`border rounded-2xl p-5 flex flex-col justify-between transition relative ${
              currentTier === 'FLEET' ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/30 bg-purple-950/20'
            }`}>
              <div>
                <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">FLIGHT SCHOOL / FLEET</div>
                <h3 className="text-lg font-bold flex items-center gap-1.5">
                  <span>Fleet & School</span>
                  <Building2 className="h-4 w-4 text-purple-400" />
                </h3>
                <div className="text-2xl font-mono font-black my-2">
                  {currency === 'INR' ? '₹3,999' : '$49'}{' '}
                  <span className="text-xs font-normal opacity-60">/ month</span>
                </div>
                <p className="text-xs opacity-70 mb-4 leading-relaxed">
                  Multi-seat dashboard with Part 91/121/135 compliance exports and audit logs.
                </p>
                
                <ul className="space-y-2 text-xs font-mono opacity-90 mb-6">
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                    <span>Multi-Seat Flight School Dashboard</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                    <span>Part 91 / 121 / 135 Compliance Exports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                    <span>Automated Dispatch Audit Logs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                    <span>Priority FAA Direct SWIM Feed</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanForCheckout('FLEET')}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border flex items-center justify-center space-x-2 ${
                  currentTier === 'FLEET'
                    ? 'bg-purple-500 text-white border-purple-400 font-black'
                    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-lg'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{currentTier === 'FLEET' ? 'RENEW FLEET TIER' : `ACTIVATE FLEET (${currency === 'INR' ? '₹3,999' : '$49'})`}</span>
              </button>
            </div>

          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-[11px] font-mono opacity-50 border-t pt-4 border-current/10">
          Stripe Secure Checkout • Instant Auth Provisioning • Cancel or switch tiers anytime
        </div>

      </div>
    </div>
  );
};
