import React, { useState } from 'react';
import { Clipboard, Sparkles, AlertTriangle, FileText, Check, ArrowRight } from 'lucide-react';
import { DisplayTheme } from './Header';

interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessPaste: (pastedText: string) => void;
  theme: DisplayTheme;
}

export const SmartPasteModal: React.FC<SmartPasteModalProps> = ({
  isOpen,
  onClose,
  onProcessPaste,
  theme,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      onProcessPaste(pastedText);
      setIsProcessing(false);
      setPastedText('');
      onClose();
    }, 400);
  };

  const handleClipboardRead = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setPastedText(text);
    } catch {
      // Browser permission fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className={`w-full max-w-2xl rounded-3xl border p-6 shadow-2xl transition-all ${
        isNight
          ? 'glass-card-night border-red-900 text-red-100'
          : isDay
          ? 'bg-white border-slate-200 text-slate-900'
          : 'glass-card-dark border-zinc-800 text-white'
      }`}>
        {/* HEADER */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>SMART PASTE & AI NOTAM DECODER</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-mono font-bold">
                  $0 API COST
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Paste raw METAR, TAF, or NOTAM text from DGCA eGCA, AAI, or official portals for instant AI parsing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* INPUT TEXTAREA */}
        <div className="relative mb-4">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste raw text here... Example:
METAR VIDP 250230Z 28008KT 4000 HZ NSC 28/18 A2988
A0123/26 NOTAMN Q) VIDF/QMRLC/IV/NBO/A/000/999/2833N07706E005
A) VIDP B) 2603010000 C) 2603051200 E) RWY 09/27 CLOSED FOR MAINT"
            className={`w-full h-48 p-4 rounded-2xl border font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isNight
                ? 'bg-red-950/40 border-red-900 text-red-200 placeholder:text-red-700'
                : isDay
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 placeholder:text-zinc-600'
            }`}
          />
          <button
            type="button"
            onClick={handleClipboardRead}
            className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[11px] font-mono font-bold border border-blue-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste Clipboard</span>
          </button>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Gemini 3.6 Flash + Deterministic Safety Scan</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim() || isProcessing}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Decoding...</span>
                </>
              ) : (
                <>
                  <span>Decode & Synthesize</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
