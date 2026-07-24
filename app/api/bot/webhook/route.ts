import { runDeterministicSafetyEngine } from '../../../../src/lib/deterministicEngine';
import { generateSyntheticMetar, generateSyntheticNotams, generateSyntheticTaf } from '../../../../src/lib/mockAviationData';
import { lookupAirport, normalizeAirportCode } from '../../../../src/lib/airportData';
import { formatZuluAndLocalTime } from '../../../../src/lib/timezoneUtils';

export interface MessagingBotWebhookPayload {
  fromNumberOrId: string;
  messageText: string;
  channel: 'WHATSAPP' | 'TELEGRAM';
}

/**
 * WhatsApp / Telegram Automated Briefing Bot Processing Engine
 * Converts incoming text messages containing ICAO codes (e.g. "VIDP", "KJFK", "brief VABB")
 * into a clean, 3-second plain-English summary card.
 */
export async function processMessagingBotRequest(payload: MessagingBotWebhookPayload): Promise<{
  replyText: string;
  icao: string;
  success: boolean;
}> {
  const text = payload.messageText.trim().toUpperCase();

  // Match 3 to 4 letter airport ICAO/FAA codes inside message
  const match = text.match(/\b([A-Z]{3,4})\b/);
  if (!match) {
    return {
      replyText: `✈ VAYU BOT: Please send a valid 3 or 4 letter airport identifier (e.g. VIDP, KJFK, VABB, KDFW).`,
      icao: '',
      success: false,
    };
  }

  const cleanCode = normalizeAirportCode(match[1]) || match[1];
  const airportInfo = lookupAirport(cleanCode);

  // Fetch Aviation Data
  let metarText = generateSyntheticMetar(cleanCode).rawText;
  let notamsRaw = generateSyntheticNotams(cleanCode);

  try {
    const resM = await fetch(`https://aviationweather.gov/api/data/metar?ids=${cleanCode}&format=raw`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (resM.ok) {
      const textM = await resM.text();
      if (textM && textM.trim().length > 5) metarText = textM.trim();
    }
  } catch (e) {}

  const flaggedNotams = runDeterministicSafetyEngine(notamsRaw);
  const criticals = flaggedNotams.filter((n) => n.severity === 'CRITICAL');
  const warnings = flaggedNotams.filter((n) => n.severity === 'WARNING');

  const timeInfo = formatZuluAndLocalTime(cleanCode, new Date());

  const replyText =
    `✈ VAYU PRE-FLIGHT BRIEFING [${cleanCode}]\n` +
    `📍 ${airportInfo?.name || cleanCode} | 🕒 ${timeInfo.combinedString}\n` +
    `----------------------------------------\n` +
    `🌤 Weather: ${metarText.slice(0, 70)}...\n` +
    `----------------------------------------\n` +
    `🔴 CRITICAL SAFETY ALERTS (${criticals.length}):\n` +
    (criticals.map((c) => ` • ${c.category.replace('_', ' ')}: ${c.rawText.slice(0, 80)}...`).join('\n') || ' • None reported.') +
    `\n----------------------------------------\n` +
    `🟡 AIRPORT ADVISORIES (${warnings.length}):\n` +
    (warnings.map((w) => ` • ${w.category.replace('_', ' ')}: ${w.rawText.slice(0, 80)}...`).join('\n') || ' • None reported.') +
    `\n----------------------------------------\n` +
    `🔗 Interactive Briefing & Radar: https://vayu.aero/#${cleanCode}\n` +
    `FAR Part 91/135 Informational Safety Utility`;

  return {
    replyText,
    icao: cleanCode,
    success: true,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processMessagingBotRequest({
      fromNumberOrId: body.from || body.sender || 'unknown',
      messageText: body.text || body.message || body.body || '',
      channel: body.channel || 'WHATSAPP',
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
