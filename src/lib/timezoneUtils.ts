/**
 * Timezone normalization utilities for aviation intelligence.
 * Converts Zulu/UTC timestamps into local airport time representation.
 */

interface AirportTimezoneInfo {
  offsetHours: number; // Offset from UTC
  timeZoneCode: string; // e.g. EDT, CDT, MDT, PDT, BST, IST, UTC
}

const AIRPORT_TIMEZONES: Record<string, AirportTimezoneInfo> = {
  // Indian Airports (IST = UTC+5:30)
  VIDP: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VABB: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VOBL: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VOHS: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VOMM: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VECC: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VOGO: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VDGO: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VAAH: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VOCI: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VAPO: { offsetHours: 5.5, timeZoneCode: 'IST' },
  VOTV: { offsetHours: 5.5, timeZoneCode: 'IST' },

  // Eastern Time (UTC-4 in summer)
  KJFK: { offsetHours: -4, timeZoneCode: 'EDT' },
  KBOS: { offsetHours: -4, timeZoneCode: 'EDT' },
  KMIA: { offsetHours: -4, timeZoneCode: 'EDT' },
  KIAD: { offsetHours: -4, timeZoneCode: 'EDT' },
  KPVD: { offsetHours: -4, timeZoneCode: 'EDT' },

  // Central Time (UTC-5 in summer)
  KDFW: { offsetHours: -5, timeZoneCode: 'CDT' },
  KORD: { offsetHours: -5, timeZoneCode: 'CDT' },
  KIAH: { offsetHours: -5, timeZoneCode: 'CDT' },
  KMSY: { offsetHours: -5, timeZoneCode: 'CDT' },

  // Mountain Time (UTC-6 in summer)
  KDEN: { offsetHours: -6, timeZoneCode: 'MDT' },
  KSLC: { offsetHours: -6, timeZoneCode: 'MDT' },

  // Pacific Time (UTC-7 in summer)
  KLAX: { offsetHours: -7, timeZoneCode: 'PDT' },
  KSFO: { offsetHours: -7, timeZoneCode: 'PDT' },
  KSEA: { offsetHours: -7, timeZoneCode: 'PDT' },
  KSAN: { offsetHours: -7, timeZoneCode: 'PDT' },

  // Europe / UK
  EGLL: { offsetHours: 1, timeZoneCode: 'BST' },
  LFPG: { offsetHours: 2, timeZoneCode: 'CEST' },
};

/**
 * Format Zulu time and local airport time together.
 * Example: "14:32 ZULU (20:02 IST)" or "14:32 ZULU (10:32 AM EDT)"
 */
export function formatZuluAndLocalTime(icaoCode: string, utcDate: Date = new Date()): {
  zuluString: string;
  localString: string;
  combinedString: string;
} {
  const codeUpper = icaoCode.toUpperCase();
  const zuluHours = String(utcDate.getUTCHours()).padStart(2, '0');
  const zuluMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
  const zuluString = `${zuluHours}:${zuluMinutes} ZULU`;

  let tzInfo = AIRPORT_TIMEZONES[codeUpper];
  if (!tzInfo) {
    if (/^V[I|A|O|E]/.test(codeUpper)) {
      tzInfo = { offsetHours: 5.5, timeZoneCode: 'IST' };
    } else {
      tzInfo = { offsetHours: -4, timeZoneCode: 'LOCAL' };
    }
  }

  const localTime = new Date(utcDate.getTime() + tzInfo.offsetHours * 3600 * 1000);
  const localMinutes = String(localTime.getUTCMinutes()).padStart(2, '0');

  let localString: string;
  if (tzInfo.timeZoneCode === 'IST') {
    // 24-hour format for IST (e.g. 20:02 IST)
    const local24Hours = String(localTime.getUTCHours()).padStart(2, '0');
    localString = `${local24Hours}:${localMinutes} IST`;
  } else {
    let localHoursNum = localTime.getUTCHours();
    const ampm = localHoursNum >= 12 ? 'PM' : 'AM';
    localHoursNum = localHoursNum % 12 || 12;
    localString = `${localHoursNum}:${localMinutes} ${ampm} ${tzInfo.timeZoneCode}`;
  }

  const combinedString = `${zuluString} (${localString})`;

  return { zuluString, localString, combinedString };
}

/**
 * Determine NOTAM active status window
 */
export function evaluateNotamStatusWindow(
  effectiveStart?: string,
  effectiveEnd?: string,
  isDay?: boolean
): {
  status: 'ACTIVE NOW' | 'SCHEDULED (FUTURE)' | 'EXPIRED';
  label: string;
  badgeClass: string;
} {
  const activeClass = isDay
    ? 'bg-emerald-100 border border-emerald-400 text-emerald-950 font-bold shadow-sm'
    : 'glass-pill-green text-emerald-200 font-bold';
  const scheduledClass = isDay
    ? 'bg-amber-100 border border-amber-400 text-amber-950 font-bold shadow-sm'
    : 'glass-pill-yellow text-amber-200 font-bold';
  const expiredClass = isDay
    ? 'bg-slate-200 border border-slate-400 text-slate-800 font-bold'
    : 'bg-zinc-800/80 border border-zinc-700 text-zinc-400 font-bold';

  if (!effectiveStart || !effectiveEnd) {
    return {
      status: 'ACTIVE NOW',
      label: 'ACTIVE NOW',
      badgeClass: activeClass,
    };
  }

  const now = new Date();
  const start = new Date(effectiveStart);
  const end = new Date(effectiveEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      status: 'ACTIVE NOW',
      label: 'ACTIVE NOW',
      badgeClass: activeClass,
    };
  }

  if (now < start) {
    return {
      status: 'SCHEDULED (FUTURE)',
      label: 'SCHEDULED (FUTURE)',
      badgeClass: scheduledClass,
    };
  } else if (now > end) {
    return {
      status: 'EXPIRED',
      label: 'EXPIRED',
      badgeClass: expiredClass,
    };
  } else {
    return {
      status: 'ACTIVE NOW',
      label: 'ACTIVE NOW',
      badgeClass: activeClass,
    };
  }
}
