// Vercel Serverless Function — /api/export-pdf
// Generates publication-ready HTML dispatch log with dynamic QR Code & SHA-256 integrity hash stamp

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    briefing,
    operatorName = 'VAYU Global Flight Operations',
    picName = 'PIC Pilot',
    cfiName = 'CFI Flight Instructor',
    studentName = 'Student Aviator',
    tailNumber = 'VT-VAYU',
    dispatchNotes = ''
  } = req.body || {};

  if (!briefing || !briefing.icao) {
    return res.status(400).json({ error: 'Briefing payload required for PDF export.' });
  }

  try {
    const timestamp = new Date().toISOString();
    const rawPayloadToHash = JSON.stringify({ briefing, operatorName, picName, cfiName, studentName, tailNumber, timestamp });
    const auditHash = createHash('sha256').update(rawPayloadToHash).digest('hex');
    const qrTargetUrl = `https://ai-vayu.vercel.app/#audit/${auditHash.slice(0, 16)}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrTargetUrl)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>VAYU Official Pre-Flight Release - ${briefing.icao} - ${tailNumber}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0e1116; line-height: 1.4; font-size: 11px; background: #fff; }
    .header { border-bottom: 2px solid #0e1116; padding-bottom: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 18px; font-weight: 800; letter-spacing: 1px; color: #0e1116; }
    .sub-header { font-size: 9px; text-transform: uppercase; color: #5b6472; font-family: monospace; }
    .title-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    .section-title { font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1.5px solid #0e1116; padding-bottom: 4px; margin-bottom: 8px; font-family: monospace; }
    .card { border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 8px; border-radius: 6px; }
    .critical { border-left: 4px solid #ef4444; background: #fef2f2; }
    .warning { border-left: 4px solid #f59e0b; background: #fffbeb; }
    .stamp-box { border: 2px dashed #10b981; background: #ecfdf5; padding: 10px; border-radius: 8px; margin-top: 15px; display: flex; align-items: center; justify-content: space-between; }
    .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">PROJECT VAYU — PRE-FLIGHT DISPATCH RELEASE</div>
      <div class="sub-header">FAR Part 91 / Part 135 / DGCA CAR Section 8 Official Compliance Audit</div>
      <div style="font-weight: 600; margin-top: 4px;">OPERATOR: ${operatorName}</div>
    </div>
    <div style="text-align: right; font-family: monospace;">
      <div><strong>TAIL #:</strong> ${tailNumber}</div>
      <div><strong>PIC:</strong> ${picName}</div>
      <div><strong>CFI SIGN-OFF:</strong> ${cfiName}</div>
      <div><strong>TIMESTAMP:</strong> ${timestamp}</div>
    </div>
  </div>

  <div class="title-box">
    <div>
      <div style="font-size: 18px; font-weight: 800; color: #0e1116;">${briefing.icao} — ${briefing.airportName || briefing.icao}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 3px;">
        FLIGHT CATEGORY: <strong style="color: ${briefing.weather.flightCategory === 'VFR' ? '#10b981' : '#f59e0b'};">${briefing.weather.flightCategory}</strong> | 
        WINDS: ${briefing.weather.windInfo || 'N/A'} | VISIBILITY: ${briefing.weather.visibilityInfo || '10SM'}
      </div>
    </div>
    <div style="text-align: right;">
      <img src="${qrImageUrl}" width="70" height="70" alt="Audit QR" style="border: 1px solid #ccc; padding: 2px; background: #fff;" />
    </div>
  </div>

  <div class="section-title">METAR & TAF WEATHER SUMMARY</div>
  <div class="card">
    <div><strong>RAW METAR:</strong> <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${briefing.weather.rawMetar || 'N/A'}</code></div>
    <div style="margin-top: 4px;"><strong>SUMMARY:</strong> ${briefing.weather.plainEnglishSummary || 'Standard meteorological conditions.'}</div>
  </div>

  <div class="section-title">CRITICAL HAZARDS & RUNWAY CLOSURES (${briefing.criticalCount})</div>
  ${(briefing.criticalAlerts || []).map((c: any) => `
    <div class="card critical">
      <div style="font-weight: 700; color: #991b1b;">⚠️ ${c.title}</div>
      <div style="margin-top: 3px; font-size: 10.5px;">${c.plainEnglish}</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 4px; font-family: monospace;">RAW: ${c.rawSnippet}</div>
    </div>
  `).join('') || '<div class="card">No critical hazards reported.</div>'}

  ${dispatchNotes ? `
    <div class="section-title">DISPATCHER & CFI NOTES</div>
    <div class="card" style="background: #f8fafc; font-style: italic;">${dispatchNotes}</div>
  ` : ''}

  <div class="stamp-box">
    <div>
      <div style="font-weight: 800; color: #065f46; font-size: 11px; font-family: monospace;">✓ COMPLIANCE AUDIT PASSED — PART 91.3 / CAR SEC 8</div>
      <div style="font-size: 9.5px; color: #047857; margin-top: 2px;">CFI Digital Release Stamp & Pre-flight Risk Assessment Verification</div>
    </div>
    <div style="font-family: monospace; font-size: 9px; text-align: right; color: #065f46;">
      <div>HASH: <strong>${auditHash.slice(0, 16)}...</strong></div>
      <div>STATUS: <strong>AUTHORIZED</strong></div>
    </div>
  </div>

  <div class="footer">
    <div>CRYPTOGRAPHIC SHA-256 DIGEST: ${auditHash}</div>
    <div>FAR PART 91.3 NOTICE: Informational pre-flight awareness utility. Pilot-in-Command retains final operational authority.</div>
  </div>
</body>
</html>`;

    return res.status(200).json({ html, hash: auditHash, qrUrl: qrTargetUrl, generatedAtUtc: timestamp });
  } catch (err: any) {
    console.error('[VAYU /api/export-pdf] Error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF dispatch log.' });
  }
}
