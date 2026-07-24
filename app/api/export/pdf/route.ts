import { crypto } from 'node:crypto';
import { BriefingSummary } from '../../../../src/types';

export interface PdfExportRequestPayload {
  briefing: BriefingSummary;
  operatorName?: string;
  picName?: string;
  tailNumber?: string;
  dispatchNotes?: string;
}

export function generateSha256Digest(data: string): string {
  return require('crypto').createHash('sha256').update(data).digest('hex');
}

/**
 * Enterprise Dispatch PDF Generator Route / Utility
 * Constructs publication-quality HTML document formatted for PDF printing/saving
 * with cryptographic SHA-256 integrity hash & Part 91/121/135 legal disclaimers.
 */
export async function generateDispatchHtml(payload: PdfExportRequestPayload): Promise<{ html: string; hash: string }> {
  const { briefing, operatorName = 'VAYU Global Flight Operations', picName = 'PIC Pilot', tailNumber = 'VT-VAYU', dispatchNotes } = payload;

  const timestamp = new Date().toISOString();
  const rawPayloadToHash = JSON.stringify({ briefing, operatorName, picName, tailNumber, timestamp });
  
  // Compute Cryptographic SHA-256 Audit Hash
  const auditHash = generateSha256Digest(rawPayloadToHash);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VAYU Pre-Flight Dispatch Briefing - ${briefing.icao} - ${tailNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Courier New', Courier, monospace; color: #111; line-height: 1.4; font-size: 11px; background: #fff; }
    .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
    .sub-header { font-size: 10px; text-transform: uppercase; color: #555; }
    .title-box { background: #f0f0f0; border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 8px; font-size: 12px; }
    .card { border: 1px solid #ddd; padding: 8px; margin-bottom: 8px; border-radius: 4px; }
    .critical { border-left: 4px solid #d9534f; background: #fff8f8; }
    .warning { border-left: 4px solid #f0ad4e; background: #fffdf5; }
    .info { border-left: 4px solid #5bc0de; background: #f4fbfd; }
    .tag { display: inline-block; padding: 2px 5px; font-size: 9px; font-weight: bold; border-radius: 2px; text-transform: uppercase; }
    .tag-red { background: #d9534f; color: #fff; }
    .tag-yellow { background: #f0ad4e; color: #000; }
    .pre { background: #f8f9fa; border: 1px solid #e9ecef; padding: 6px; font-size: 10px; white-space: pre-wrap; word-break: break-all; }
    .footer { margin-top: 25px; border-top: 1px dashed #666; padding-top: 10px; font-size: 9px; color: #444; }
    .hash { font-family: monospace; font-size: 9px; background: #eee; padding: 4px; word-break: break-all; margin-top: 5px; }
  </style>
</head>
<body>

  <!-- HEADER SECTION -->
  <div class="header">
    <div>
      <div class="logo">✈ PROJECT VAYU DISPATCH LOG</div>
      <div class="sub-header">FAR PART 91 / 121 / 135 PRE-FLIGHT INTELLIGENCE AUDIT RECORD</div>
    </div>
    <div style="text-align: right;">
      <div><strong>OPERATOR:</strong> ${operatorName}</div>
      <div><strong>AIRCRAFT TAIL #:</strong> ${tailNumber}</div>
      <div><strong>PIC:</strong> ${picName}</div>
    </div>
  </div>

  <!-- HERO METADATA -->
  <div class="title-box">
    <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold;">
      <span>AIRPORT: ${briefing.icao} (${briefing.airportName})</span>
      <span>FLIGHT CAT: ${briefing.weather.flightCategory}</span>
    </div>
    <div style="margin-top: 5px; font-size: 10px;">
      <span><strong>GENERATED (UTC):</strong> ${briefing.generatedAtUtc}</span> | 
      <span><strong>TOTAL NOTAMS:</strong> ${briefing.totalNotamsIngested}</span> | 
      <span><strong>CRITICAL HAZARDS:</strong> ${briefing.criticalCount}</span>
    </div>
  </div>

  <!-- METAR & TAF SECTION -->
  <div class="section-title">METEOROLOGICAL REPORT (METAR & TAF)</div>
  <div class="grid">
    <div>
      <strong>RAW METAR:</strong>
      <div class="pre">${briefing.weather.rawMetar}</div>
      <div style="margin-top: 4px;"><strong>SUMMARY:</strong> ${briefing.weather.plainEnglishSummary}</div>
    </div>
    <div>
      <strong>NOAA TAF FORECAST:</strong>
      <div class="pre">${briefing.weather.rawTaf || 'No terminal forecast available.'}</div>
      <div style="margin-top: 4px;"><strong>TRENDS:</strong> ${briefing.weather.tafDecodedSummary || 'Normal'}</div>
    </div>
  </div>

  <!-- CRITICAL NOTAM ALERTS -->
  <div class="section-title">CRITICAL SAFETY ALERTS (${briefing.criticalCount})</div>
  ${
    briefing.criticalAlerts.length > 0
      ? briefing.criticalAlerts
          .map(
            (c) => `
    <div class="card critical">
      <div style="display: flex; justify-content: space-between;">
        <strong>${c.title}</strong>
        <span class="tag tag-red">${c.category.replace('_', ' ')}</span>
      </div>
      <div style="margin-top: 4px;">${c.plainEnglish}</div>
      <div class="pre" style="margin-top: 4px;">${c.rawSnippet}</div>
    </div>`
          )
          .join('')
      : '<div class="card">No critical runway closures, TFR airspace, or braking action hazards.</div>'
  }

  <!-- OPERATIONAL ADVISORIES -->
  <div class="section-title">AIRPORT ADVISORIES (${briefing.warningCount})</div>
  ${
    briefing.warnings.length > 0
      ? briefing.warnings
          .map(
            (w) => `
    <div class="card warning">
      <div style="display: flex; justify-content: space-between;">
        <strong>${w.title}</strong>
        <span class="tag tag-yellow">${w.category.replace('_', ' ')}</span>
      </div>
      <div style="margin-top: 4px;">${w.plainEnglish || 'Operational advisory active.'}</div>
      <div class="pre" style="margin-top: 4px;">${w.rawSnippet}</div>
    </div>`
          )
          .join('')
      : '<div class="card">No NavAid outages or taxiway advisories.</div>'
  }

  <!-- UNFILTERED DISPATCH LEDGER -->
  <div class="section-title">UNFILTERED NOTAM LEDGER (${briefing.allNotamsLedger?.length || 0})</div>
  <div class="pre" style="max-height: 250px; overflow-y: auto;">
${(briefing.allNotamsLedger || []).map((n, i) => `[${i + 1}] ID: ${n.id} | CAT: ${n.category} | ${n.rawText}`).join('\n\n')}
  </div>

  ${
    dispatchNotes
      ? `<div class="section-title" style="margin-top: 15px;">DISPATCHER / PIC REMARKS</div><div class="card">${dispatchNotes}</div>`
      : ''
  }

  <!-- FOOTER & LEGAL DISCLAIMER -->
  <div class="footer">
    <div><strong>PIC COMPLIANCE MANDATE:</strong> Per FAA FAR Part 91.3 and DGCA CAR Section 8, the Pilot-in-Command holds final operational authority. This pre-flight intelligence briefing is compiled deterministically for operational safety awareness.</div>
    <div style="margin-top: 6px;"><strong>SHA-256 AUDIT DIGEST:</strong></div>
    <div class="hash">${auditHash}</div>
  </div>

</body>
</html>`;

  return { html, hash: auditHash };
}
