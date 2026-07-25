// Vercel Serverless Function — /api/export-pdf
// Generates publication-ready HTML dispatch log with SHA-256 integrity hash

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

  const { briefing, operatorName = 'VAYU Global Flight Operations', picName = 'PIC Pilot', tailNumber = 'VT-VAYU', dispatchNotes } = req.body || {};

  if (!briefing || !briefing.icao) {
    return res.status(400).json({ error: 'Briefing payload required for PDF export.' });
  }

  try {
    const timestamp = new Date().toISOString();
    const rawPayloadToHash = JSON.stringify({ briefing, operatorName, picName, tailNumber, timestamp });
    const auditHash = createHash('sha256').update(rawPayloadToHash).digest('hex');

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
    .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px; margin-bottom: 8px; font-size: 12px; }
    .card { border: 1px solid #ddd; padding: 8px; margin-bottom: 8px; border-radius: 4px; }
    .critical { border-left: 4px solid #d9534f; background: #fff8f8; }
    .warning { border-left: 4px solid #f0ad4e; background: #fffdf5; }
    .footer { margin-top: 25px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #666; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">PROJECT VAYU EFB DISPATCH</div>
      <div class="sub-header">FAR Part 91 / 121 / 135 Pre-Flight Awareness Summary</div>
    </div>
    <div style="text-align: right;">
      <div><strong>AIRCRAFT:</strong> ${tailNumber}</div>
      <div><strong>PIC:</strong> ${picName}</div>
      <div><strong>DATE:</strong> ${timestamp}</div>
    </div>
  </div>

  <div class="title-box">
    <div style="font-size: 16px; font-weight: bold;">AIRFIELD: ${briefing.icao} - ${briefing.airportName || briefing.icao}</div>
    <div>WEATHER CATEGORY: <strong>${briefing.weather.flightCategory}</strong> | RAW METAR: ${briefing.weather.rawMetar}</div>
  </div>

  <div class="section-title">PIC TAKEAWAY</div>
  <div class="card critical">
    <strong>⚠️ TAKEOUT:</strong> ${briefing.picTakeaway}
  </div>

  <div class="section-title">CRITICAL SAFETY NOTAMS (${briefing.criticalCount})</div>
  ${(briefing.criticalAlerts || []).map((c: any) => `
    <div class="card critical">
      <div><strong>${c.title}</strong></div>
      <div>${c.plainEnglish}</div>
      <div style="font-size: 9px; color: #555; margin-top: 3px;">RAW: ${c.rawSnippet}</div>
    </div>
  `).join('') || '<div class="card">None reported.</div>'}

  <div class="footer">
    <div>CRYPTOGRAPHIC SHA-256 AUDIT HASH: ${auditHash}</div>
    <div>FAR PART 91.3 DISCLAIMER: Informational pre-flight awareness utility. Pilot retain sole operational authority.</div>
  </div>
</body>
</html>`;

    return res.status(200).json({ html, hash: auditHash, generatedAtUtc: timestamp });
  } catch (err: any) {
    console.error('[VAYU /api/export-pdf] Error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF dispatch log.' });
  }
}
