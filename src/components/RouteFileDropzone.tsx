import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Compass, ArrowRight, X } from 'lucide-react';
import { parseFlightPlanFile, ParsedFlightPlan } from '../lib/routeParser';
import { DisplayTheme } from './Header';

interface RouteFileDropzoneProps {
  onRouteParsed: (origin: string, destination: string, waypoints: string[]) => void;
  theme: DisplayTheme;
}

export const RouteFileDropzone: React.FC<RouteFileDropzoneProps> = ({ onRouteParsed, theme }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedPlan, setParsedPlan] = useState<ParsedFlightPlan | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const containerBg = isNight
    ? 'glass-card-night border-red-900/60 text-red-100'
    : isDay
    ? 'bg-white border-slate-300 text-slate-900 shadow-sm'
    : 'glass-card-dark border-zinc-800 text-white';

  const handleFileProcess = async (file: File) => {
    setParseError(null);
    try {
      const text = await file.text();
      const plan = parseFlightPlanFile(text, file.name);

      if (!plan.originIcao || !plan.destinationIcao) {
        setParseError('Failed to detect valid origin/destination ICAOs in route file.');
        return;
      }

      setParsedPlan(plan);
    } catch (err: any) {
      setParseError(`Error parsing route file: ${err.message || 'Invalid format'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleApplyRoute = () => {
    if (!parsedPlan) return;
    onRouteParsed(parsedPlan.originIcao, parsedPlan.destinationIcao, parsedPlan.waypointIcaos);
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all font-mono ${containerBg}`}>
      <div className="flex items-center justify-between mb-3 border-b pb-2.5 border-current/10">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
          <Compass className="w-4 h-4 text-amber-400" />
          <span>FLIGHT PLAN IMPORTER (.FPL / .GPX)</span>
        </div>
        <span className="text-[10px] opacity-60">ForeFlight & Garmin Compatible</span>
      </div>

      {parseError && (
        <div className="mb-3 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{parseError}</span>
          </div>
          <button onClick={() => setParseError(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {parsedPlan ? (
        <div className="space-y-3 p-4 rounded-xl bg-black/20 border border-current/15">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>PARSED FILE: {parsedPlan.fileName}</span>
            </div>
            <button
              onClick={() => setParsedPlan(null)}
              className="text-[10px] underline opacity-70 hover:opacity-100"
            >
              Upload Different File
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-base font-black">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {parsedPlan.originIcao}
            </span>
            <ArrowRight className="w-4 h-4 opacity-50" />
            {parsedPlan.waypointIcaos.map((wp) => (
              <React.Fragment key={wp}>
                <span className="px-2 py-0.5 rounded-md bg-current/10 text-xs font-bold">{wp}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </React.Fragment>
            ))}
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {parsedPlan.destinationIcao}
            </span>
          </div>

          <button
            onClick={handleApplyRoute}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-lg"
          >
            <Compass className="w-4 h-4" />
            <span>GENERATE CORRIDOR BRIEFING ({parsedPlan.originIcao} → {parsedPlan.destinationIcao})</span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-500/10'
              : 'border-current/20 hover:border-amber-400/60 hover:bg-current/5'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".fpl,.gpx,.xml,.txt"
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-60 text-amber-400 animate-pulse" />
          <div className="text-xs font-bold">DRAG & DROP FOREFLIGHT .FPL OR .GPX ROUTE FILE</div>
          <div className="text-[10px] opacity-60 mt-1">Or click to select flight plan file from device</div>
        </div>
      )}
    </div>
  );
};
