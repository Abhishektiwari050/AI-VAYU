import React from 'react';

/**
 * Hyper-Realistic Animated Floating Clouds with Organic Jiggle & Sway
 * Built with realistic SVG cloud gradients, layered atmospheric depth, and gentle jiggle floating animations.
 */
export const FloatingCloudBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* SVG Definitions for Realistic Atmospheric Cloud Lighting */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f1f5f9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.65" />
          </linearGradient>
          <filter id="cloudSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0284c7" floodOpacity="0.22" />
          </filter>
        </defs>
      </svg>

      {/* CLOUD 1: Top Left Cumulus Puff (Horizontal Drift + Organic Vertical Jiggle) */}
      <div className="absolute top-2 left-[-40px] w-[500px] sm:w-[650px] animate-[drift_45s_ease-in-out_infinite]">
        <div className="animate-[cloudFloatJiggle_8s_ease-in-out_infinite]">
          <svg viewBox="0 0 500 220" fill="none" className="w-full h-auto filter-[url(#cloudSoftShadow)]">
            <g fill="url(#cloudGrad1)">
              <circle cx="120" cy="140" r="70" />
              <circle cx="190" cy="110" r="85" />
              <circle cx="280" cy="100" r="95" />
              <circle cx="360" cy="130" r="75" />
              <circle cx="410" cy="150" r="50" />
              <rect x="100" y="140" width="310" height="70" rx="35" />
            </g>
          </svg>
        </div>
      </div>

      {/* CLOUD 2: Top Right Volumetric Cloud Bank (Slow Reverse Drift + Gentle Sway Jiggle) */}
      <div className="absolute top-24 right-[-80px] w-[450px] sm:w-[600px] animate-[drift_55s_ease-in-out_infinite_reverse]">
        <div className="animate-[cloudFloatJiggleSlow_11s_ease-in-out_infinite]">
          <svg viewBox="0 0 480 200" fill="none" className="w-full h-auto filter-[url(#cloudSoftShadow)]">
            <g fill="url(#cloudGrad2)">
              <circle cx="100" cy="130" r="60" />
              <circle cx="170" cy="95" r="75" />
              <circle cx="260" cy="85" r="85" />
              <circle cx="340" cy="110" r="70" />
              <rect x="80" y="120" width="280" height="60" rx="30" />
            </g>
          </svg>
        </div>
      </div>

      {/* CLOUD 3: Midground Left Floating Fluff */}
      <div className="absolute top-[40%] left-[8%] w-[380px] sm:w-[520px] animate-[drift_60s_ease-in-out_infinite]">
        <div className="animate-[cloudFloatJiggle_9s_ease-in-out_infinite_1s]">
          <svg viewBox="0 0 450 190" fill="none" className="w-full h-auto opacity-90 filter-[url(#cloudSoftShadow)]">
            <g fill="url(#cloudGrad1)">
              <circle cx="90" cy="120" r="55" />
              <circle cx="160" cy="90" r="70" />
              <circle cx="240" cy="80" r="80" />
              <circle cx="320" cy="105" r="60" />
              <rect x="75" y="110" width="260" height="55" rx="25" />
            </g>
          </svg>
        </div>
      </div>

      {/* CLOUD 4: Lower Horizon Volumetric Clouds */}
      <div className="absolute bottom-6 right-[4%] w-[460px] sm:w-[620px] animate-[drift_50s_ease-in-out_infinite_reverse]">
        <div className="animate-[cloudFloatJiggleSlow_10s_ease-in-out_infinite_2s]">
          <svg viewBox="0 0 520 210" fill="none" className="w-full h-auto filter-[url(#cloudSoftShadow)]">
            <g fill="url(#cloudGrad2)">
              <circle cx="110" cy="130" r="65" />
              <circle cx="190" cy="95" r="80" />
              <circle cx="290" cy="90" r="90" />
              <circle cx="380" cy="120" r="70" />
              <rect x="90" y="125" width="310" height="65" rx="30" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
