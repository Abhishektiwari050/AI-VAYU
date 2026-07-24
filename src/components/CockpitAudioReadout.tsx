import React, { useState, useEffect } from 'react';
import { BriefingSummary } from '../types';
import { Volume2, VolumeX, Play, Pause, Radio, Sparkles, FastForward, Gauge } from 'lucide-react';

interface CockpitAudioReadoutProps {
  briefing: BriefingSummary;
  theme?: string;
}

export const CockpitAudioReadout: React.FC<CockpitAudioReadoutProps> = ({ briefing }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const readoutScript =
    `Pre-flight intelligence summary for aerodrome ${briefing.icao}, ${briefing.airportName || ''}. ` +
    `Flight category is ${briefing.weather?.flightCategory || 'VFR'}. ` +
    `Weather summary: ${briefing.weather?.plainEnglishSummary || 'Clear'}. ` +
    `Critical alerts count: ${briefing.criticalCount || 0}. ` +
    (briefing.criticalAlerts?.map((c) => c.title + '. ' + c.plainEnglish).join('. ') || 'No critical runway or TFR hazards.') +
    `. Pilot takeaway: ${briefing.picTakeaway || 'Maintain standard vigilance.'}`;

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(readoutScript);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full cirrus-card p-5 sm:p-6 mb-6 font-sans border border-[#e3e8ee] shadow-md transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className={`p-3.5 rounded-full border transition cursor-pointer flex items-center justify-center shadow-lg ${
              isPlaying
                ? 'bg-red-500 border-red-400 text-white animate-pulse'
                : 'bg-[#0e1116] hover:bg-[#1c222c] border-[#0e1116] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2e7def]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0e1116]">
                HANDS-FREE COCKPIT AUDIO READOUT MODE
              </span>
              {isPlaying && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                  READING ALOUD
                </span>
              )}
            </div>
            <p className="text-xs text-[#5b6472] mt-0.5">
              Listen to pre-flight briefing aloud while performing exterior walkarounds or pre-taxi checks.
            </p>
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#5b6472] flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" /> Rate:
          </span>
          {[0.8, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              onClick={() => setSpeechRate(rate)}
              className={`px-2.5 py-1 rounded-full border text-xs transition cursor-pointer ${
                speechRate === rate ? 'bg-[#2e7def] text-white border-[#2e7def] font-bold' : 'bg-white text-[#5b6472] border-[#e3e8ee]'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
