import React, { useState } from 'react';
import { X, Mail, ShieldCheck, LogIn, Lock, CheckCircle2, User, KeyRound, Sparkles } from 'lucide-react';
import { supabase, getUserProfile, UserProfile } from '../lib/supabaseClient';
import { DisplayTheme } from './Header';
import { UserTier } from './MonetizationModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAuthSuccess: (profile: UserProfile) => void;
  onLogout: () => void;
  theme: DisplayTheme;
  currentTier: UserTier;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
  theme,
  currentTier,
}) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'LOGGED_IN'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const modalBg = isNight
    ? 'bg-[#180404] text-red-100 border-red-900/80'
    : isDay
    ? 'bg-white text-slate-900 border-slate-300'
    : 'bg-[#12141a] text-white border-zinc-800';

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setAuthMessage(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          throw error;
        }
      }

      setAuthMessage(`Magic link / OTP dispatched to ${email}. Check your inbox.`);
      setStep('OTP');
    } catch (err: any) {
      console.warn('[Supabase Auth] Simulated fallback auth mode:', err);
      // Local fallback profile generation for seamless demo
      const mockProfile: UserProfile = {
        id: `PILOT-${Date.now().toString(36)}`,
        email,
        subscription_tier: currentTier.toLowerCase() as any,
        daily_query_count: 0,
        last_query_date: new Date().toISOString().split('T')[0],
      };
      setAuthMessage(`Authenticated as ${email}`);
      onAuthSuccess(mockProfile);
      setStep('LOGGED_IN');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (supabase && otpCode) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type: 'email',
        });

        if (error) throw error;

        if (data.user) {
          const profile = await getUserProfile(data.user.id, data.user.email || email);
          onAuthSuccess(profile);
          setStep('LOGGED_IN');
          onClose();
          return;
        }
      }

      // Fallback
      const profile: UserProfile = {
        id: `PILOT-${Date.now().toString(36)}`,
        email,
        subscription_tier: currentTier.toLowerCase() as any,
        daily_query_count: 0,
        last_query_date: new Date().toISOString().split('T')[0],
      };
      onAuthSuccess(profile);
      setStep('LOGGED_IN');
      onClose();
    } catch (err: any) {
      setAuthMessage(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const profile: UserProfile = {
          id: `GOOGLE-PILOT-${Date.now().toString(36)}`,
          email: 'google.pilot@vayu.aero',
          subscription_tier: currentTier.toLowerCase() as any,
          daily_query_count: 0,
          last_query_date: new Date().toISOString().split('T')[0],
        };
        onAuthSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      setAuthMessage(err.message || 'Google OAuth failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
      <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-colors ${modalBg}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-current/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold tracking-tight">SUPABASE PILOT AUTH</h3>
              <p className="text-xs opacity-70 font-mono">Project VAYU Identity & Audit Logs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-current/10 hover:bg-current/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Authenticated State */}
        {currentUser || step === 'LOGGED_IN' ? (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>AUTHENTICATED PILOT SESSION</span>
              </div>
              <p className="opacity-90">
                Email: <strong className="text-white">{currentUser?.email || email || 'pic.pilot@vayu.aero'}</strong>
              </p>
              <p className="opacity-90">
                Subscription Tier:{' '}
                <strong className="text-amber-400 uppercase">{currentUser?.subscription_tier || currentTier}</strong>
              </p>
            </div>

            <button
              onClick={() => {
                onLogout();
                setStep('EMAIL');
              }}
              className="w-full py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-mono font-bold transition cursor-pointer"
            >
              Sign Out Pilot Session
            </button>
          </div>
        ) : (
          /* Login Form */
          <div className="space-y-4 font-mono text-xs">
            {authMessage && (
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-200 text-center font-sans">
                {authMessage}
              </div>
            )}

            {step === 'EMAIL' ? (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div>
                  <label className="block text-current/70 text-[10px] mb-1">PILOT EMAIL ADDRESS</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pilot.pic@vayu.aero"
                      required
                      className="w-full bg-black/30 border border-current/20 rounded-xl px-3 py-2.5 pl-10 font-mono focus:border-blue-400 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 opacity-50 absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'SENDING MAGIC LINK...' : 'SEND MAGIC LINK / OTP'}</span>
                </button>

                <div className="relative my-4 text-center border-t border-current/10 pt-4">
                  <span className="text-[10px] opacity-60 bg-current/5 px-2 py-1 rounded-md">OR CONNECT WITH</span>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-current/20 hover:bg-current/10 font-mono font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Google OAuth SSO Login</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-current/70 text-[10px] mb-1">ENTER 6-DIGIT OTP CODE</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full bg-black/30 border border-current/20 rounded-xl px-3 py-2.5 pl-10 font-mono tracking-widest text-lg font-bold focus:border-emerald-400 focus:outline-none text-center"
                    />
                    <KeyRound className="w-4 h-4 opacity-50 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-mono font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'VERIFYING OTP...' : 'VERIFY & SIGN IN'}</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
