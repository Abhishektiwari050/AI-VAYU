import React, { useState } from 'react';
import { Share2, Check, Sparkles, MessageSquare, Twitter, Globe, Flame, Gift } from 'lucide-react';
import { DisplayTheme } from './Header';

interface ViralGrowthBannerProps {
  theme: DisplayTheme;
  currentIcao?: string;
}

export const ViralGrowthBanner: React.FC<ViralGrowthBannerProps> = ({ theme, currentIcao = 'VIDP' }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/#${currentIcao}` : `https://vayu.aero/#${currentIcao}`;

  const shareText = `✈ I'm using Project VAYU for instant AI Pre-Flight Briefings & plain-English NOTAMs! Check briefing for ${currentIcao}: ${shareUrl}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const containerClass = isNight
    ? 'bg-gradient-to-r from-red-950/80 via-black to-red-950/80 border-red-900/60 text-red-100'
    : isDay
    ? 'bg-gradient-to-r from-amber-500/10 via-sky-50 to-emerald-500/10 border-amber-300 text-slate-900 shadow-sm'
    : 'bg-gradient-to-r from-sky-950/40 via-zinc-900 to-emerald-950/40 border-zinc-800 text-white';

  return (
    <div className={`w-full rounded-2xl border p-3.5 mb-6 font-mono transition-all ${containerClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                SHARE VAYU WITH YOUR FLIGHT CREW & PILOT CLUB
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                VIRAL PRO REWARD
              </span>
            </div>
            <p className="text-[11px] opacity-70 font-sans mt-0.5">
              📍 Geo-Optimized for DGCA (India) & FAA (USA) Airspace. Share plain-English briefings in 1-tap.
            </p>
          </div>
        </div>

        {/* Share Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link' : 'Copy Brief Link'}</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="px-3 py-1.5 rounded-xl border border-emerald-400 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleTwitter}
            className="px-3 py-1.5 rounded-xl border border-sky-400 bg-sky-600 hover:bg-sky-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm hidden sm:flex"
          >
            <Twitter className="w-3.5 h-3.5" />
            <span>Post to X</span>
          </button>
        </div>
      </div>
    </div>
  );
};
