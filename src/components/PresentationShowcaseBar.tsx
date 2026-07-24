import React from 'react';
import { Sparkles, Globe, Plane, Radio, ShieldCheck, Play, Tv } from 'lucide-react';

interface PresentationShowcaseBarProps {
  activeIcao: string;
  onSelectIcao: (icao: string) => void;
  onTogglePresentationMode: () => void;
  isPresentationMode: boolean;
}

export const PresentationShowcaseBar: React.FC<PresentationShowcaseBarProps> = ({
  activeIcao,
  onSelectIcao,
  onTogglePresentationMode,
  isPresentationMode,
}) => {
  const hubs = [
    { code: 'VIDP', name: 'Delhi', region: 'India', status: 'VFR', statusBg: 'bg-emerald-100 text-emerald-700' },
    { code: 'VABB', name: 'Mumbai', region: 'India', status: 'MVFR', statusBg: 'bg-amber-100 text-amber-700' },
    { code: 'VOBL', name: 'Bengaluru', region: 'India', status: 'VFR', statusBg: 'bg-emerald-100 text-emerald-700' },
    { code: 'KJFK', name: 'New York', region: 'USA', status: 'VFR', statusBg: 'bg-emerald-100 text-emerald-700' },
    { code: 'EGLL', name: 'London', region: 'UK', status: 'VFR', statusBg: 'bg-emerald-100 text-emerald-700' },
    { code: 'OMDB', name: 'Dubai', region: 'UAE', status: 'VFR', statusBg: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="w-full cirrus-card p-4 sm:p-5 mb-6 border border-[#e3e8ee] shadow-md transition-all font-sans">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Presentability Hero Intro */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#0e1116] text-white shadow-md shrink-0">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0e1116] tracking-tight">
                PROJECT VAYU AVIATION INTELLIGENCE
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2e7def]/10 text-[#2e7def]">
                LIVE BRIEFING DEMO
              </span>
            </div>
            <p className="text-xs text-[#5b6472]">
              Select a global hub below or toggle Full Screen Presentation Mode for flight crew briefings.
            </p>
          </div>
        </div>

        {/* Global Hub Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {hubs.map((hub) => {
            const isSelected = activeIcao === hub.code;
            return (
              <button
                key={hub.code}
                onClick={() => onSelectIcao(hub.code)}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium transition cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  isSelected
                    ? 'bg-[#0e1116] text-white border-[#0e1116]'
                    : 'bg-white text-[#0e1116] border-[#e3e8ee] hover:border-[#2e7def]'
                }`}
              >
                <span className="font-bold">{hub.code}</span>
                <span className="text-[10px] opacity-70 font-sans">{hub.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${hub.statusBg}`}>
                  {hub.status}
                </span>
              </button>
            );
          })}
        </div>

        {/* Full Screen Presentation Toggle */}
        <button
          onClick={onTogglePresentationMode}
          className={`px-4 py-2 rounded-full border text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer shadow-md ${
            isPresentationMode
              ? 'bg-amber-500 text-white border-amber-500 animate-pulse'
              : 'bg-white text-[#0e1116] border-[#e3e8ee] hover:bg-slate-50'
          }`}
        >
          <Tv className="w-4 h-4 text-[#2e7def]" />
          <span>{isPresentationMode ? 'Exit Deck' : 'Presentation Mode'}</span>
        </button>
      </div>
    </div>
  );
};
