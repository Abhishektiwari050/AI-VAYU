import React from 'react';

/**
 * Animated Floating Cloud Background Layer for Cirrus Open Sky Theme
 * Renders high-performance layered SVG clouds drifting across the blue sky.
 */
export const FloatingCloudBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Cloud Group 1 - Upper High Cirrus (Slow Drift Right) */}
      <div className="absolute top-8 -left-32 w-[600px] opacity-40 animate-[drift_60s_linear_infinite]">
        <svg viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 50 150 C 30 150, 10 130, 20 100 C 30 70, 70 60, 100 80 C 130 50, 190 50, 220 80 C 250 60, 300 70, 320 100 C 340 100, 360 120, 350 150 Z"
            fill="white"
            filter="drop-shadow(0px 10px 20px rgba(186, 230, 253, 0.5))"
          />
        </svg>
      </div>

      {/* Cloud Group 2 - Midground Cumulus (Medium Drift Right) */}
      <div className="absolute top-48 right-[-200px] w-[750px] opacity-55 animate-[drift_45s_linear_infinite_reverse]">
        <svg viewBox="0 0 600 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 80 160 C 50 160, 20 135, 35 95 C 50 55, 110 40, 150 70 C 190 30, 270 30, 310 70 C 350 45, 420 55, 450 95 C 480 95, 510 120, 490 160 Z"
            fill="white"
            filter="drop-shadow(0px 12px 24px rgba(186, 230, 253, 0.6))"
          />
        </svg>
      </div>

      {/* Cloud Group 3 - Low Soft Horizon Fluff */}
      <div className="absolute bottom-12 left-10 w-[550px] opacity-35 animate-[drift_75s_linear_infinite]">
        <svg viewBox="0 0 500 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 40 130 C 20 130, 5 115, 15 90 C 25 65, 60 55, 85 70 C 110 45, 160 45, 185 70 C 210 55, 250 60, 270 90 C 290 90, 310 110, 300 130 Z"
            fill="white"
            filter="drop-shadow(0px 8px 16px rgba(186, 230, 253, 0.4))"
          />
        </svg>
      </div>
    </div>
  );
};
