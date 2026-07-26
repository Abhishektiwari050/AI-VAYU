import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, FileText, Send, X, UserCheck, Clock, Award, AlertCircle } from 'lucide-react';
import { BriefingSummary } from '../types';
import { DisplayTheme } from './Header';

interface CfiApprovalHubProps {
  isOpen: boolean;
  onClose: () => void;
  currentBriefing?: BriefingSummary | null;
  theme: DisplayTheme;
}

interface StudentSubmission {
  id: string;
  studentName: string;
  icao: string;
  submittedAt: string;
  flightCategory: string;
  criticalCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  cfiNotes?: string;
}

export const CfiApprovalHub: React.FC<CfiApprovalHubProps> = ({
  isOpen,
  onClose,
  currentBriefing,
  theme,
}) => {
  const [cfiName, setCfiName] = useState('Captain R. Sharma (CFI #48921)');
  const [studentName, setStudentName] = useState('Cadet Pilot A. Verma');
  const [tailNumber, setTailNumber] = useState('VT-VAYU');
  const [dispatchNotes, setDispatchNotes] = useState('Cleared for solo cross-country. Wind within limits. Verify NOTAM for Rwy 27 braking.');
  const [signedSuccess, setSignedSuccess] = useState(false);

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([
    {
      id: 'sub-101',
      studentName: 'Cadet Pilot A. Verma',
      icao: currentBriefing?.icao || 'VIDP',
      submittedAt: '10 mins ago',
      flightCategory: currentBriefing?.weather?.flightCategory || 'VFR',
      criticalCount: currentBriefing?.criticalCount || 1,
      status: 'PENDING',
    },
    {
      id: 'sub-102',
      studentName: 'Cadet Pilot S. Rao',
      icao: 'VABB',
      submittedAt: '35 mins ago',
      flightCategory: 'MVFR',
      criticalCount: 2,
      status: 'PENDING',
    },
  ]);

  if (!isOpen) return null;

  const isNight = theme === 'NIGHT_RED';
  const isDay = theme === 'DAY_FLIGHT';

  const handleApprove = (id: string) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, status: 'APPROVED', cfiNotes: dispatchNotes } : sub))
    );
    setSignedSuccess(true);
    setTimeout(() => setSignedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className={`w-full max-w-3xl rounded-3xl border p-6 shadow-2xl transition-all ${
        isNight
          ? 'bg-red-950/90 border-red-800 text-red-100'
          : isDay
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-zinc-900 border-zinc-700 text-white'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-3 font-mono">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-wider font-sans">
                CFI PRE-FLIGHT APPROVAL HUB
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Flight Instructor Dispatch Release & Student Audit Authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition cursor-pointer text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {signedSuccess && (
          <div className="mb-5 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>✓ Dispatch Release signed & encrypted SHA-256 stamp sent to student pilot!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Left Column: CFI Controls */}
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                INSTRUCTOR & AIRCRAFT METADATA
              </span>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">CFI NAME & LICENSE #</label>
                <input
                  type="text"
                  value={cfiName}
                  onChange={(e) => setCfiName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">STUDENT PILOT</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">AIRCRAFT TAIL #</label>
                <input
                  type="text"
                  value={tailNumber}
                  onChange={(e) => setTailNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">DISPATCH & RISK INSTRUCTIONS</label>
                <textarea
                  rows={3}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-white leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Pending Student Submissions */}
          <div className="space-y-3 font-mono">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              PENDING STUDENT BRIEFING SUBMISSIONS ({submissions.filter((s) => s.status === 'PENDING').length})
            </span>

            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <strong className="text-sm font-sans">{sub.studentName}</strong>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    sub.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-950 border-emerald-400' : 'bg-amber-100 text-amber-950 border-amber-400'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span>AIRPORT: <strong>{sub.icao}</strong></span>
                  <span>WX: <strong className="text-emerald-400">{sub.flightCategory}</strong></span>
                  <span>HAZARDS: <strong>{sub.criticalCount}</strong></span>
                </div>

                {sub.status === 'PENDING' && (
                  <button
                    onClick={() => handleApprove(sub.id)}
                    className="w-full mt-2 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Award className="w-4 h-4" />
                    <span>Approve & Sign Dispatch Release</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
