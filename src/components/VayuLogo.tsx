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
        {/* Updated Official VAYU Vector Logo */}
        <img
          src="/vayu-logo.svg"
          alt="Project VAYU Logo"
          className={`w-full h-full object-contain transform hover:scale-105 transition-transform duration-300 ${
            glow ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]' : ''
          }`}
        />
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
