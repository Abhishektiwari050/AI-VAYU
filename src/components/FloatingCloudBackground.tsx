import React from 'react';

/**
 * Animated Floating Cloud Background Layer for Cirrus Open Sky Theme
 * Renders prominent, highly visible white volumetric clouds drifting across the blue sky.
 */
export const FloatingCloudBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Cloud 1 - Top Left Large Cirrus Cloud */}
      <div className="absolute -top-6 left-[-50px] w-[500px] sm:w-[700px] opacity-85 animate-[drift_40s_ease-in-out_infinite]">
        <svg viewBox="0 0 600 250" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 100 180 C 60 180, 20 150, 40 100 C 60 50, 130 40, 180 75 C 230 30, 340 30, 390 75 C 440 45, 520 60, 550 110 C 580 110, 600 140, 580 180 Z"
            fill="white"
            filter="drop-shadow(0px 14px 28px rgba(56, 189, 248, 0.4))"
          />
        </svg>
      </div>

      {/* Cloud 2 - Top Right Mid-Altitude Cloud */}
      <div className="absolute top-20 right-[-100px] w-[450px] sm:w-[650px] opacity-90 animate-[drift_50s_ease-in-out_infinite_reverse]">
        <svg viewBox="0 0 600 250" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 90 170 C 50 170, 20 140, 40 95 C 60 50, 130 40, 170 70 C 220 25, 330 25, 380 70 C 430 40, 500 55, 530 100 C 560 100, 580 130, 560 170 Z"
            fill="white"
            filter="drop-shadow(0px 16px 32px rgba(14, 165, 233, 0.35))"
          />
        </svg>
      </div>

      {/* Cloud 3 - Lower Middle Fluffy Cumulus */}
      <div className="absolute top-[45%] left-[5%] w-[400px] sm:w-[600px] opacity-75 animate-[drift_65s_ease-in-out_infinite]">
        <svg viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 60 140 C 30 140, 10 120, 25 85 C 40 50, 95 40, 130 65 C 170 30, 250 30, 290 65 C 330 40, 390 50, 420 85 C 450 85, 470 110, 450 140 Z"
            fill="white"
            filter="drop-shadow(0px 12px 24px rgba(56, 189, 248, 0.3))"
          />
        </svg>
      </div>

      {/* Cloud 4 - Bottom Right Horizon Cloud */}
      <div className="absolute bottom-10 right-[5%] w-[480px] sm:w-[680px] opacity-80 animate-[drift_55s_ease-in-out_infinite_reverse]">
        <svg viewBox="0 0 600 230" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M 80 160 C 45 160, 15 130, 30 90 C 45 50, 110 40, 150 65 C 190 25, 290 25, 340 65 C 390 35, 460 50, 490 90 C 520 90, 540 120, 520 160 Z"
            fill="white"
            filter="drop-shadow(0px 14px 28px rgba(14, 165, 233, 0.35))"
          />
        </svg>
      </div>
    </div>
  );
};
