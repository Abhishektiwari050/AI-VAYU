import React from 'react';

interface VayuLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const VayuLogo: React.FC<VayuLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  glow = true,
}) => {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${dimensions} shrink-0`}>
        {/* Vector SVG Logo: Jet taking off dynamically over runway bar */}
        <svg
          viewBox="0 0 128 128"
          fill="none"
          className={`w-full h-full transform hover:scale-105 transition-transform duration-300 ${
            glow ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="vayuLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="runwayBarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Jet Body Silhouette */}
          <path
            d="
              M 22 68
              C 28 62, 38 58, 48 54
              L 52 32
              C 54 26, 58 25, 60 30
              L 68 48
              L 96 36
              C 106 32, 112 34, 108 42
              C 104 48, 82 64, 68 72
              L 58 86
              C 55 90, 52 88, 53 84
              L 56 74
              L 40 76
              L 28 80
              C 24 81, 20 78, 20 74
              Z"
            fill="url(#vayuLogoGrad)"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Cockpit Highlight */}
          <path d="M 90 42 L 100 38 C 103 37, 105 39, 102 42 Z" fill="#e0f2fe" opacity="0.9" />

          {/* Precision Runway Bar */}
          <rect x="18" y="98" width="92" height="10" rx="5" fill="url(#runwayBarGrad)" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-mono font-black tracking-wider text-white flex items-center gap-1 ${textSizes}`}>
            <span>PROJECT</span>
            <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              VAYU
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase mt-0.5 font-semibold">
            Aviation Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
