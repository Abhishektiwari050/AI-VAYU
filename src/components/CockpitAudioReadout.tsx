import React, { useState, useEffect } from 'react';
import { BriefingSummary } from '../types';
import { DisplayTheme } from './Header';
import { Volume2, VolumeX, Play, Pause, Radio, Sparkles } from 'lucide-react';

interface CockpitAudioReadoutProps {
  briefing: BriefingSummary;
  theme: DisplayTheme;
}

export const CockpitAudioReadout: React.FC<CockpitAudioReadoutProps> = ({ briefing, theme }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  // Construct hands-free pre-flight briefing script for audio readout
  const readoutScript =
    `Pre-flight intelligence summary for aerodrome ${briefing.icao}, ${briefing.airportName}. ` +
    `Flight category is ${briefing.weather.flightCategory}. ` +
    `Weather summary: ${briefing.weather.plainEnglishSummary}. ` +
    `Critical alerts count: ${briefing.criticalCount}. ` +
    (briefing.criticalAlerts.map((c) => c.title + '. ' + c.plainEnglish).join('. ') || 'No critical runway or TFR hazards.') +
    `. Pilot takeaway: ${briefing.picTakeaway}.`;

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

    // Try server-side TTS endpoint first, fallback to Web Speech API
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: readoutScript }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/pcm'};base64,${data.audioBase64}`);
          audio.onended = () => setIsPlaying(false);
          await audio.play();
          setIsPlaying(true);
          return;
        }
      }
    } catch (e) {}

    // Web Speech API Fallback
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(readoutScript);
      utterance.rate = 0.95; // Clear aviation cadence
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setSpeechUtterance(utterance);
      setIsPlaying(true);
    }
  };

  const containerClass = isNight
    ? 'bg-red-950/40 border-red-900/60 text-red-100'
    : isDay
    ? 'bg-sky-50 border-sky-300 text-sky-950'
    : 'bg-zinc-900/80 border-zinc-800 text-zinc-100';

  return (
    <div className={`p-4 rounded-2xl border mb-6 transition-all ${containerClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-center shadow-md ${
              isPlaying
                ? 'bg-red-600 border-red-400 text-white animate-pulse'
                : 'bg-sky-600 hover:bg-sky-500 border-sky-400 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                HANDS-FREE COCKPIT AUDIO READOUT MODE
              </span>
              {isPlaying && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-200 border border-red-800 animate-pulse">
                  READING ALOUD
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-70 font-sans mt-0.5">
              Listen to executive briefing aloud while performing exterior walkarounds or pre-taxi checks.
            </p>
          </div>
        </div>

        {/* Audio Waveform Animation when playing */}
        {isPlaying && (
          <div className="flex items-center gap-1 h-6 px-3 py-1 rounded-xl bg-black/40 border border-sky-500/30">
            <span className="w-1 bg-sky-400 animate-bounce h-3 rounded-full" style={{ animationDelay: '0.1s' }} />
            <span className="w-1 bg-sky-400 animate-bounce h-5 rounded-full" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 bg-sky-400 animate-bounce h-2 rounded-full" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 bg-sky-400 animate-bounce h-6 rounded-full" style={{ animationDelay: '0.4s' }} />
            <span className="w-1 bg-sky-400 animate-bounce h-4 rounded-full" style={{ animationDelay: '0.15s' }} />
          </div>
        )}
      </div>
    </div>
  );
};
