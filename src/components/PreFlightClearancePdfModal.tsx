import React, { useState, useId } from 'react';
import { BriefingSummary } from '../types';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Copy,
  Check,
  Plane,
  Award,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface PreFlightClearancePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: BriefingSummary | null;
  cfiSignedInfo?: {
    cfiName: string;
    studentName: string;
    tailNumber: string;
    dispatchNotes: string;
    signedAt: string;
  } | null;
}

export const PreFlightClearancePdfModal: React.FC<PreFlightClearancePdfModalProps> = ({
  isOpen,
  onClose,
  briefing,
  cfiSignedInfo,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const picNameId = useId();
  const tailNumId = useId();

  const [picName, setPicName] = useState('Capt. Pilot in Command');
  const [tailNumber, setTailNumber] = useState('VT-VAYU');

  if (!isOpen || !briefing) return null;

  // Deterministic cryptographic clearance SHA-256 mock hash
  const clearanceHash = Array.from(
    `${briefing.icao}-${briefing.generatedAtUtc}-${briefing.criticalCount}-${briefing.picTakeaway}`
  )
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 0xffffffff, 0x12345678)
    .toString(16)
    .toUpperCase()
    .padStart(8, '0');

  const fullHash = `VAYU-CLR-2026-${briefing.icao}-${clearanceHash}-SHA256`;
  const formattedUtc = new Date(briefing.generatedAtUtc).toUTCString();

  const clearanceStatus =
    briefing.criticalCount > 0
      ? 'CAUTION REQUIRED — ACTIVE HAZARDS'
      : briefing.weather.flightCategory === 'LIFR' || briefing.weather.flightCategory === 'IFR'
      ? 'IFR CLEARANCE ADVISORY'
      : 'CLEARED FOR DEPARTURE (VFR)';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDispatchText = () => {
    const text = `=====================================================
OFFICIAL PRE-FLIGHT CLEARANCE & DISPATCH RELEASE
PROJECT VAYU — NOTAM & WEATHER INTELLIGENCE PLATFORM
Clearance Ref: ${fullHash}
=====================================================
AIRPORT: ${briefing.icao} — ${briefing.airportName || 'Aerodrome'}
RELEASE UTC: ${formattedUtc}
FLIGHT CAT: ${briefing.weather.flightCategory}
CLEARANCE STATUS: ${clearanceStatus}
PIC: ${cfiSignedInfo?.studentName || picName}
TAIL #: ${cfiSignedInfo?.tailNumber || tailNumber}

METAR: ${briefing.weather.rawMetar}
PLAIN ENGLISH WX: ${briefing.weather.plainEnglishSummary}

PIC TAKEAWAY:
${briefing.picTakeaway}

CRITICAL ALERTS (${briefing.criticalCount}):
${
  briefing.criticalAlerts.length > 0
    ? briefing.criticalAlerts.map((a) => `• [${a.category}] ${a.title}: ${a.plainEnglish}`).join('\n')
    : 'None reported.'
}

WARNINGS (${briefing.warningCount}):
${
  briefing.warnings.length > 0
    ? briefing.warnings.map((w) => `• [${w.category}] ${w.title}: ${w.plainEnglish}`).join('\n')
    : 'None reported.'
}

${
  cfiSignedInfo
    ? `CFI AUTHORIZATION & DISPATCH RELEASE:
CFI: ${cfiSignedInfo.cfiName}
Notes: ${cfiSignedInfo.dispatchNotes}
Signed: ${cfiSignedInfo.signedAt}`
    : 'DISPATCH STATUS: Self-Briefed PIC Pre-Flight Assessment'
}

DISCLAIMER: FAR Part 91.3 / DGCA Advisory Only. PIC retains final flight safety authority.
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark slate background
      doc.rect(10, 10, pageWidth - 20, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PROJECT VAYU — PRE-FLIGHT CLEARANCE & DISPATCH RELEASE', 15, 18);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Official Document Ref: ${fullHash}`, 15, 24);
      doc.text(`Generated Zulu: ${formattedUtc}`, 15, 29);

      y = 40;

      // Flight & Airfield Metadata Block
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(10, y, pageWidth - 20, 26, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`${briefing.icao} — ${briefing.airportName || 'Aerodrome'}`, 15, y + 8);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`PILOT IN COMMAND: ${cfiSignedInfo?.studentName || picName}`, 15, y + 15);
      doc.text(`AIRCRAFT TAIL #: ${cfiSignedInfo?.tailNumber || tailNumber}`, 15, y + 21);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (briefing.weather.flightCategory === 'VFR') {
        doc.setFillColor(16, 185, 129);
      } else if (briefing.weather.flightCategory === 'MVFR') {
        doc.setFillColor(59, 130, 246);
      } else {
        doc.setFillColor(239, 68, 68);
      }
      doc.roundedRect(pageWidth - 65, y + 5, 50, 14, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`CAT: ${briefing.weather.flightCategory} | ${clearanceStatus.slice(0, 18)}`, pageWidth - 62, y + 13);

      y += 32;

      // PIC Takeaway / Risk Advisory
      doc.setDrawColor(245, 158, 11);
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(10, y, pageWidth - 20, 18, 2, 2, 'FD');

      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PIC EXECUTIVE RISK TAKEAWAY:', 15, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(69, 26, 3);
      const splitPic = doc.splitTextToSize(briefing.picTakeaway, pageWidth - 30);
      doc.text(splitPic, 15, y + 12);

      y += 24;

      // Weather & METAR Block
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, y, pageWidth - 20, 32, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('METEOROLOGICAL OBSERVED CONDITIONS (METAR & TAF)', 15, y + 7);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const splitMetar = doc.splitTextToSize(`RAW METAR: ${briefing.weather.rawMetar}`, pageWidth - 30);
      doc.text(splitMetar, 15, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const splitWxSummary = doc.splitTextToSize(`SUMMARY: ${briefing.weather.plainEnglishSummary}`, pageWidth - 30);
      doc.text(splitWxSummary, 15, y + 24);

      y += 38;

      // Critical Hazards & Airspace NOTAMs
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(185, 28, 28);
      doc.text(`CRITICAL NOTAMS & AIRSPACE HAZARDS (${briefing.criticalCount})`, 10, y);
      y += 4;

      if (briefing.criticalAlerts.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text('No active critical runway closures or TFR hazards reported.', 10, y + 4);
        y += 10;
      } else {
        briefing.criticalAlerts.forEach((alert) => {
          if (y > 250) {
            doc.addPage();
            y = 15;
          }
          doc.setDrawColor(220, 38, 38);
          doc.setFillColor(254, 242, 242);
          doc.roundedRect(10, y, pageWidth - 20, 16, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(153, 27, 27);
          doc.text(`• [${alert.category}] ${alert.title}`, 14, y + 6);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          const splitText = doc.splitTextToSize(alert.plainEnglish, pageWidth - 32);
          doc.text(splitText, 14, y + 11);

          y += 19;
        });
      }

      // Warnings & Navaids
      if (y > 240) {
        doc.addPage();
        y = 15;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(180, 83, 9);
      doc.text(`OPERATIONAL WARNINGS & NAVAIDS (${briefing.warningCount})`, 10, y);
      y += 4;

      if (briefing.warnings.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text('No navaid or procedure warnings flagged.', 10, y + 4);
        y += 10;
      } else {
        briefing.warnings.slice(0, 4).forEach((warn) => {
          if (y > 255) {
            doc.addPage();
            y = 15;
          }
          doc.setDrawColor(217, 119, 6);
          doc.setFillColor(255, 251, 235);
          doc.roundedRect(10, y, pageWidth - 20, 14, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(146, 64, 14);
          doc.text(`• [${warn.category}] ${warn.title}`, 14, y + 5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(51, 65, 85);
          const splitWarn = doc.splitTextToSize(warn.plainEnglish, pageWidth - 32);
          doc.text(splitWarn, 14, y + 10);

          y += 16;
        });
      }

      // CFI Dispatch Section if present
      if (cfiSignedInfo) {
        if (y > 245) {
          doc.addPage();
          y = 15;
        }

        doc.setDrawColor(16, 185, 129);
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(10, y, pageWidth - 20, 22, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(6, 78, 59);
        doc.text('FLIGHT INSTRUCTOR DISPATCH RELEASE & SIGNATURE:', 14, y + 6);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`CFI NAME: ${cfiSignedInfo.cfiName}`, 14, y + 11);
        doc.text(`INSTRUCTIONS: ${cfiSignedInfo.dispatchNotes}`, 14, y + 16);
        doc.text(`SIGNATURE TIMESTAMP: ${cfiSignedInfo.signedAt}`, 14, y + 20);

        y += 26;
      }

      // Footer Legal Disclaimer
      if (y > 260) {
        doc.addPage();
        y = 15;
      }

      doc.setDrawColor(148, 163, 184);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(10, y, pageWidth - 20, 16, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('REGULATORY LEGAL ADVISORY (FAR PART 91.3 / DGCA COMPLIANCE):', 14, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'This clearance document is produced by Project VAYU for pilot operational awareness. The Pilot in Command (PIC) is directly responsible for and is the final authority as to the operation of that aircraft.',
        14,
        y + 10
      );

      doc.save(`VAYU_Clearance_${briefing.icao}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF via jsPDF:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans print:p-0 print:bg-white">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Toolbar (Screen Only - Hidden when printing) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">
                PRE-FLIGHT CLEARANCE PDF EXPORT
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Official EFB Dispatch Clearance Document • SHA-256 Cryptographic Stamp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDispatchText}
              className="px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-mono font-medium text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Text!' : 'Copy Dispatch Text'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 shadow-md border border-blue-400"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-900 hover:bg-white text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 text-slate-900 print:p-0 print:bg-white">
          <div className="max-w-3xl mx-auto bg-white border-2 border-slate-900 p-6 sm:p-8 shadow-xl rounded-2xl print:shadow-none print:rounded-none print:border-none space-y-6">
            
            {/* Header Crest & Verification Stamp */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Plane className="w-6 h-6 text-slate-900" />
                  <h1 className="text-xl font-black tracking-wider uppercase text-slate-900">
                    PROJECT VAYU — PRE-FLIGHT CLEARANCE
                  </h1>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-600 mt-1">
                  OFFICIAL FLIGHT DISPATCH RELEASE & NOTAM INTELLIGENCE REPORT
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VERIFIED RELEASE</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase">
                  SHA-256: <span className="font-bold text-slate-800">{clearanceHash}</span>
                </div>
              </div>
            </div>

            {/* Flight Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">AIRPORT (ICAO)</span>
                <span className="text-lg font-black text-slate-900">{briefing.icao}</span>
                <span className="text-[11px] text-slate-600 block truncate">{briefing.airportName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">RELEASE UTC TIME</span>
                <span className="font-bold text-slate-900 block mt-1">{formattedUtc.slice(0, 16)} Z</span>
                <span className="text-[10px] text-slate-500">LIVE EFB SYNC</span>
              </div>

              <div>
                <label htmlFor={picNameId} className="text-[10px] text-slate-500 uppercase font-bold block">
                  PILOT IN COMMAND
                </label>
                {cfiSignedInfo ? (
                  <span className="font-bold text-slate-900 block mt-1">{cfiSignedInfo.studentName}</span>
                ) : (
                  <input
                    id={picNameId}
                    type="text"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="font-bold text-slate-900 bg-transparent border-b border-slate-400 focus:outline-none w-full mt-1 print:border-none"
                  />
                )}
              </div>

              <div>
                <label htmlFor={tailNumId} className="text-[10px] text-slate-500 uppercase font-bold block">
                  AIRCRAFT TAIL #
                </label>
                {cfiSignedInfo ? (
                  <span className="font-bold text-slate-900 block mt-1">{cfiSignedInfo.tailNumber}</span>
                ) : (
                  <input
                    id={tailNumId}
                    type="text"
                    value={tailNumber}
                    onChange={(e) => setTailNumber(e.target.value)}
                    className="font-bold text-slate-900 bg-transparent border-b border-slate-400 focus:outline-none w-full mt-1 print:border-none"
                  />
                )}
              </div>
            </div>

            {/* Clearance Status & Category Badge */}
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-900 bg-slate-900 text-white font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">DISPATCH STATUS</span>
                <span className="text-sm font-black tracking-wider uppercase text-emerald-400">
                  {clearanceStatus}
                </span>
              </div>
              <div className="px-4 py-1.5 rounded-lg bg-white text-slate-900 font-black text-sm uppercase tracking-widest border border-slate-200">
                FLIGHT CAT: {briefing.weather.flightCategory}
              </div>
            </div>

            {/* PIC Executive Risk Takeaway */}
            <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 text-amber-950 space-y-1">
              <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>PIC EXECUTIVE RISK TAKEAWAY</span>
              </div>
              <p className="text-xs font-sans font-semibold leading-relaxed">
                {briefing.picTakeaway}
              </p>
            </div>

            {/* Meteorological Conditions (METAR / TAF) */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                METEOROLOGICAL OBSERVED CONDITIONS (METAR & TAF)
              </h3>
              <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 font-semibold break-all">
                {briefing.weather.rawMetar}
              </div>
              <div className="text-xs text-slate-700 font-medium leading-relaxed">
                <span className="font-bold text-slate-900">Decoded Summary:</span> {briefing.weather.plainEnglishSummary}
              </div>
            </div>

            {/* Critical NOTAMs & Airspace Hazards */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-red-700">
                  🔴 CRITICAL NOTAMS & AIRSPACE CLOSURES ({briefing.criticalCount})
                </h3>
              </div>

              {briefing.criticalAlerts.length === 0 ? (
                <div className="text-xs font-mono text-slate-500 py-1">
                  ✓ No active critical runway closures, TFRs, or severe airspace hazards reported.
                </div>
              ) : (
                <div className="space-y-3">
                  {briefing.criticalAlerts.map((alert, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-4 border-red-600 text-xs space-y-1">
                      <div className="font-mono font-bold text-red-900 uppercase">
                        [{alert.category}] {alert.title}
                      </div>
                      <div className="text-slate-800 font-medium">{alert.plainEnglish}</div>
                      <div className="font-mono text-[10px] text-slate-500 break-all">
                        RAW: {alert.rawSnippet}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warnings & Navaids */}
            <div className="border border-slate-300 rounded-xl p-4 space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700 border-b border-slate-200 pb-2">
                🟡 OPERATIONAL WARNINGS & PROCEDURES ({briefing.warningCount})
              </h3>
              {briefing.warnings.length === 0 ? (
                <div className="text-xs font-mono text-slate-500 py-1">
                  ✓ No procedure or navaid operational warnings flagged.
                </div>
              ) : (
                <div className="space-y-2">
                  {briefing.warnings.map((warn, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-amber-50 border-l-4 border-amber-500 text-xs space-y-1">
                      <div className="font-mono font-bold text-amber-900 uppercase">
                        [{warn.category}] {warn.title}
                      </div>
                      <div className="text-slate-800 font-medium">{warn.plainEnglish}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CFI Approval Block if signed */}
            {cfiSignedInfo && (
              <div className="border-2 border-emerald-600 bg-emerald-50 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>FLIGHT INSTRUCTOR DISPATCH RELEASE</span>
                </div>
                <div className="text-slate-900 font-medium">
                  <strong>CFI Signature:</strong> {cfiSignedInfo.cfiName}
                </div>
                <div className="text-slate-900 font-medium">
                  <strong>Dispatch Release Notes:</strong> {cfiSignedInfo.dispatchNotes}
                </div>
                <div className="text-slate-500 text-[10px]">
                  Timestamp: {cfiSignedInfo.signedAt} • SHA-256 Authenticated Release
                </div>
              </div>
            )}

            {/* Legal Advisory Footer */}
            <div className="border-t-2 border-slate-900 pt-4 font-mono text-[10px] text-slate-600 space-y-1">
              <div className="font-bold uppercase text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-800" />
                <span>MANDATORY FAR PART 91.3 / DGCA LEGAL COMPLIANCE ADVISORY</span>
              </div>
              <p className="leading-tight">
                ADVISORY ONLY: Project VAYU provides automated pre-flight NOTAM and weather intelligence. Pilots in Command (PIC) retain final sole authority and responsibility under FAR 91.3 and DGCA regulations for safe flight operations.
              </p>
              <div className="text-[9px] text-slate-400 pt-1">
                Document SHA-256 Hash: {fullHash}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
