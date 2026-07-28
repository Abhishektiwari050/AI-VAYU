/**
 * Temporal Active Status Evaluator
 * Evaluates current Zulu time against ICAO Item B (WEF) and Item C (TIL) timestamps.
 */

export interface TemporalEvaluationResult {
  status: 'ACTIVE_NOW' | 'SCHEDULED_FUTURE' | 'EXPIRED' | 'PERMANENT';
  statusBadgeText: string;
  relativeTimeText: string;
  startFormatted?: string;
  endFormatted?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Parses ICAO / FAA Aviation Timestamp (YYMMDDHHMM or YYYYMMDDHHMM)
 * e.g., "2607270200" -> 27 Jul 2026 02:00 UTC
 */
export function parseAviationTimestamp(code?: string): Date | null {
  if (!code) return null;
  const str = code.trim();

  // 1. Try standard JS date parse first (e.g. ISO string or ISO timestamp)
  const directDate = new Date(str);
  if (!isNaN(directDate.getTime()) && str.includes('-')) {
    return directDate;
  }

  // 2. FAA Slash Format: MM/DD/YYYY HH:MM (e.g., "07/01/2026 04:30")
  const faaMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):?(\d{2})/);
  if (faaMatch) {
    const mm = parseInt(faaMatch[1], 10) - 1;
    const dd = parseInt(faaMatch[2], 10);
    const yyyy = parseInt(faaMatch[3], 10);
    const hh = parseInt(faaMatch[4], 10);
    const min = parseInt(faaMatch[5], 10);
    const d = new Date(Date.UTC(yyyy, mm, dd, hh, min));
    return isNaN(d.getTime()) ? null : d;
  }

  // 3. ICAO Compact Format: YYMMDDHHMM (10 digits) or YYYYMMDDHHMM (12 digits)
  const cleaned = str.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    const yy = parseInt(cleaned.substring(0, 2), 10) + 2000;
    const mm = parseInt(cleaned.substring(2, 4), 10) - 1;
    const dd = parseInt(cleaned.substring(4, 6), 10);
    const hh = parseInt(cleaned.substring(6, 8), 10);
    const min = parseInt(cleaned.substring(8, 10), 10);
    const d = new Date(Date.UTC(yy, mm, dd, hh, min));
    return isNaN(d.getTime()) ? null : d;
  } else if (cleaned.length === 12 && !str.includes('/')) {
    const yyyy = parseInt(cleaned.substring(0, 4), 10);
    const mm = parseInt(cleaned.substring(4, 6), 10) - 1;
    const dd = parseInt(cleaned.substring(6, 8), 10);
    const hh = parseInt(cleaned.substring(8, 10), 10);
    const min = parseInt(cleaned.substring(10, 12), 10);
    const d = new Date(Date.UTC(yyyy, mm, dd, hh, min));
    return isNaN(d.getTime()) ? null : d;
  }

  return isNaN(directDate.getTime()) ? null : directDate;
}

/**
 * Formats date into standard aviation Zulu string e.g., "27 Jul 2026 02:00Z"
 */
export function formatAviationUtc(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const monthStr = months[d.getUTCMonth()];
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${dd} ${monthStr} ${yyyy} ${hh}:${min}Z`;
}

/**
 * Calculates human readable relative time difference
 */
function getRelativeTimeString(diffMs: number): string {
  const absDiff = Math.abs(diffMs);
  const totalMinutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Compares current Zulu time against Item B (Start) and Item C (End)
 */
export function evaluateTemporalStatus(
  startInput?: string | Date,
  endInput?: string | Date,
  rawText?: string
): TemporalEvaluationResult {
  const text = (rawText || '').toUpperCase();

  // Check for PERM / PERMANENT
  if (text.includes('PERM') || text.includes('PERMANENT') || endInput === 'PERM') {
    return {
      status: 'PERMANENT',
      statusBadgeText: '⚪ PERMANENT',
      relativeTimeText: 'Permanent operational change',
      endFormatted: 'PERM',
    };
  }

  const startDate: Date | null =
    startInput instanceof Date
      ? startInput
      : parseAviationTimestamp(startInput) || (startInput ? new Date(startInput) : null);

  const endDate: Date | null =
    endInput instanceof Date
      ? endInput
      : parseAviationTimestamp(endInput) || (endInput && endInput !== 'PERM' ? new Date(endInput) : null);

  const now = new Date();
  const startFormatted = startDate ? formatAviationUtc(startDate) : undefined;
  const endFormatted = endDate ? formatAviationUtc(endDate) : undefined;

  if (startDate && endDate) {
    if (now >= startDate && now <= endDate) {
      const remainingMs = endDate.getTime() - now.getTime();
      return {
        status: 'ACTIVE_NOW',
        statusBadgeText: '🔴 ACTIVE NOW',
        relativeTimeText: `Expires in ${getRelativeTimeString(remainingMs)} (${endFormatted})`,
        startFormatted,
        endFormatted,
        startDate,
        endDate,
      };
    } else if (now < startDate) {
      const untilStartMs = startDate.getTime() - now.getTime();
      return {
        status: 'SCHEDULED_FUTURE',
        statusBadgeText: `🟡 FUTURE (Starts in ${getRelativeTimeString(untilStartMs)})`,
        relativeTimeText: `WEF ${startFormatted} → TIL ${endFormatted}`,
        startFormatted,
        endFormatted,
        startDate,
        endDate,
      };
    } else {
      const expiredMs = now.getTime() - endDate.getTime();
      return {
        status: 'EXPIRED',
        statusBadgeText: '⚪ EXPIRED',
        relativeTimeText: `Expired ${getRelativeTimeString(expiredMs)} ago (${endFormatted})`,
        startFormatted,
        endFormatted,
        startDate,
        endDate,
      };
    }
  } else if (startDate) {
    if (now >= startDate) {
      return {
        status: 'ACTIVE_NOW',
        statusBadgeText: '🔴 ACTIVE NOW',
        relativeTimeText: `Active since ${startFormatted}`,
        startFormatted,
        startDate,
      };
    } else {
      const untilStartMs = startDate.getTime() - now.getTime();
      return {
        status: 'SCHEDULED_FUTURE',
        statusBadgeText: `🟡 FUTURE (Starts in ${getRelativeTimeString(untilStartMs)})`,
        relativeTimeText: `Starts ${startFormatted}`,
        startFormatted,
        startDate,
      };
    }
  }

  return {
    status: 'ACTIVE_NOW',
    statusBadgeText: '🔴 ACTIVE NOW',
    relativeTimeText: 'Effective immediately / active status',
  };
}
