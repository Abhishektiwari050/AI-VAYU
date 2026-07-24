import React from 'react';
import { Compass, Home, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onReturnHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnHome }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center font-sans">
      {/* CIRRUS OPEN SKY CARD CONTAINER */}
      <div className="cirrus-card p-8 sm:p-12 max-w-xl w-full flex flex-col items-center shadow-xl border border-[#e3e8ee]">
        
        {/* ANIMATED SVG FACE CONTAINER */}
        <div className="my-custom-face-container flex justify-center items-center h-48 w-full mb-6">
          <svg className="face w-44 h-44 text-[#0e1116]" viewBox="0 0 320 380">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={25}>
              <g className="face__eyes" transform="translate(0,112.5)">
                <g transform="translate(15,0)">
                  <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                  <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
                </g>
                <g transform="translate(230,0)">
                  <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                  <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
                </g>
              </g>
              <rect className="face__nose" x="132.5" y="112.5" width={55} height={155} rx={4} ry={4} />
              <g transform="translate(65,334)" strokeDasharray="102 102">
                <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
                <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
              </g>
            </g>
          </svg>
        </div>

        {/* 404 TITLE & PAUSE QUOTE */}
        <div className="text-3xl sm:text-4xl text-[#5b6472] cirrus-serif-pause mb-2">
          404 — Lost in the clouds.
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0e1116] mb-3">
          Way Aerodrome Not Found
        </h1>

        <p className="text-sm text-[#5b6472] max-w-md mb-8 leading-relaxed">
          The flight route or aerodrome identifier you requested does not exist or has been cleared from active datastreams.
        </p>

        {/* OBSIDIAN-BLACK RETURN CTA */}
        <button
          onClick={onReturnHome}
          className="cirrus-btn-obsidian cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Safe Airspace</span>
        </button>
      </div>
    </div>
  );
};
