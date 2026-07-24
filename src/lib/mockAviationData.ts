import { MetarData, RawNotam } from '../types';

export function generateSyntheticMetar(icao: string): MetarData {
  const code = icao.toUpperCase();
  const date = new Date();
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const zTime = `${day}${hour}${min}Z`;

  // Specific high-realism templates for popular airports
  if (code === 'KJFK') {
    return {
      icao: 'KJFK',
      rawText: `KJFK ${zTime} 18012G20KT 10SM FEW030 SCT250 24/18 A3002 RMK AO2 SLP164 T02390183`,
      timestamp: zTime,
      flightCategory: 'VFR',
      windDirDeg: 180,
      windSpeedKts: 12,
      visibilitySm: 10,
      tempC: 24,
      dewpointC: 18,
      altimeterInHg: 30.02,
      clouds: 'FEW at 3,000ft, SCT at 25,000ft',
    };
  }

  if (code === 'KLAX') {
    return {
      icao: 'KLAX',
      rawText: `KLAX ${zTime} 25008KT 6SM HZ BKN012 19/15 A2998 RMK AO2 SLP152`,
      timestamp: zTime,
      flightCategory: 'MVFR',
      windDirDeg: 250,
      windSpeedKts: 8,
      visibilitySm: 6,
      tempC: 19,
      dewpointC: 15,
      altimeterInHg: 29.98,
      clouds: 'BKN at 1,200ft (Marine layer haze)',
    };
  }

  if (code === 'KORD') {
    return {
      icao: 'KORD',
      rawText: `KORD ${zTime} 02015G24KT 2SM -SN OVC008 M02/M06 A2985 RMK AO2 P0001`,
      timestamp: zTime,
      flightCategory: 'IFR',
      windDirDeg: 20,
      windSpeedKts: 15,
      visibilitySm: 2,
      tempC: -2,
      dewpointC: -6,
      altimeterInHg: 29.85,
      clouds: 'OVC at 800ft (Light Snow & Low Ceiling)',
    };
  }

  if (code === 'VIDP') {
    return {
      icao: 'VIDP',
      rawText: `VIDP ${zTime} 28006KT 3000 HZ FEW020 OVC090 34/26 Q1002 NOSIG`,
      timestamp: zTime,
      flightCategory: 'VFR',
      windDirDeg: 280,
      windSpeedKts: 6,
      visibilitySm: 2,
      tempC: 34,
      dewpointC: 26,
      altimeterInHg: 29.59,
      clouds: 'FEW at 2,000ft, OVC at 9,000ft (Haze)',
    };
  }

  if (code === 'VABB') {
    return {
      icao: 'VABB',
      rawText: `VABB ${zTime} 24018G28KT 2000 +SHRA FEW010 SCT020 OVC080 27/26 Q1006 TEMPO 1200 +TSRA`,
      timestamp: zTime,
      flightCategory: 'IFR',
      windDirDeg: 240,
      windSpeedKts: 18,
      visibilitySm: 1.2,
      tempC: 27,
      dewpointC: 26,
      altimeterInHg: 29.71,
      clouds: 'Heavy Monsoon Rain, FEW at 1,000ft, OVC at 8,000ft',
    };
  }

  if (code === 'VOBL') {
    return {
      icao: 'VOBL',
      rawText: `VOBL ${zTime} 09010KT 6000 SCT025 BKN100 25/19 Q1014 NOSIG`,
      timestamp: zTime,
      flightCategory: 'VFR',
      windDirDeg: 90,
      windSpeedKts: 10,
      visibilitySm: 4,
      tempC: 25,
      dewpointC: 19,
      altimeterInHg: 29.94,
      clouds: 'SCT at 2,500ft, BKN at 10,000ft',
    };
  }

  if (code === 'VDGO') {
    return {
      icao: 'VDGO',
      rawText: `VDGO ${zTime} 26012KT 8000 FEW020 BKN090 29/25 Q1008 NOSIG`,
      timestamp: zTime,
      flightCategory: 'VFR',
      windDirDeg: 260,
      windSpeedKts: 12,
      visibilitySm: 5,
      tempC: 29,
      dewpointC: 25,
      altimeterInHg: 29.77,
      clouds: 'FEW at 2,000ft, BKN at 9,000ft',
    };
  }

  // Dynamic realistic fallback METAR for any requested airport code
  return {
    icao: code,
    rawText: `${code} ${zTime} 27010KT 5000 HZ FEW025 SCT080 30/22 Q1006 NOSIG`,
    timestamp: zTime,
    flightCategory: 'VFR',
    windDirDeg: 270,
    windSpeedKts: 10,
    visibilitySm: 3.5,
    tempC: 30,
    dewpointC: 22,
    altimeterInHg: 29.71,
    clouds: 'FEW at 2,500ft, SCT at 8,000ft (Haze)',
  };
}

export function generateSyntheticTaf(icao: string): string {
  const code = icao.toUpperCase();
  const date = new Date();
  const day = String(date.getUTCDate()).padStart(2, '0');
  const nextDay = String((date.getUTCDate() % 28) + 1).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const issueTime = `${day}${hour}00Z`;
  const validPeriod = `${day}06/${nextDay}06`;

  if (code === 'KJFK') {
    return `TAF KJFK ${issueTime} ${validPeriod} 20010KT P6SM FEW030 BKN250 FM241400 18012G20KT P6SM SCT040 TEMPO 2418/2422 5SM TSRA BKN030CB BECMG 2501/2503 24008KT P6SM SKC`;
  }

  if (code === 'KLAX') {
    return `TAF KLAX ${issueTime} ${validPeriod} 25008KT 6SM HZ BKN012 FM241800 24012KT P6SM SCT025 BECMG 2503/2505 22006KT 4SM BR OVC010`;
  }

  if (code === 'KORD') {
    return `TAF KORD ${issueTime} ${validPeriod} 02015G25KT 2SM -SN OVC008 FM241600 36012KT 4SM -SN OVC015 TEMPO 2420/2500 1SM SN BLSN OVC005 BECMG 2502/2504 33008KT P6SM SCT025`;
  }

  if (code === 'VIDP') {
    return `TAF VIDP ${issueTime} ${validPeriod} 28008KT 3000 HZ SCT020 BKN090 BECMG 2412/2414 2000 HZ FEW020 BKN080 TEMPO 2416/2420 1500 TSRA SCT015CB BECMG 2501/2503 26006KT 4000 HZ`;
  }

  if (code === 'VABB') {
    return `TAF VABB ${issueTime} ${validPeriod} 24018G28KT 2000 +SHRA FEW010 OVC080 TEMPO 2408/2414 1200 +TSRA BKN008CB BECMG 2418/2420 22012KT 3000 RA BKN015`;
  }

  if (code === 'VOBL') {
    return `TAF VOBL ${issueTime} ${validPeriod} 09010KT 6000 SCT025 BKN100 TEMPO 2414/2418 3000 TSRA SCT015CB BECMG 2500/2502 08006KT 5000 HZ`;
  }

  if (code === 'VDGO') {
    return `TAF VDGO ${issueTime} ${validPeriod} 26012KT 8000 FEW020 BKN090 TEMPO 2411/2415 4000 -RA BKN030 BECMG 2502/2504 24008KT 9000`;
  }

  return `TAF ${code} ${issueTime} ${validPeriod} 27010KT 6000 FEW025 SCT080 TEMPO 2414/2418 3000 -TSRA BKN020CB BECMG 2500/2502 24006KT P6SM SKC`;
}

export function generateSyntheticNotams(icao: string): RawNotam[] {
  const code = icao.toUpperCase();

  if (code === 'KJFK') {
    return [
      {
        id: 'NOTAM-JFK-001',
        icao: 'KJFK',
        rawText: '!JFK 07/012 JFK RWY 13R/31L CLSD DAILY 1200-1800 FOR SFC MAINT. WEF 2607221200-2607291800',
        effectiveStart: '2026-07-22T12:00Z',
        effectiveEnd: '2026-07-29T18:00Z',
        type: 'RWY',
      },
      {
        id: 'NOTAM-JFK-002',
        icao: 'KJFK',
        rawText: '!JFK 07/015 ZNY AIRSPACE TEMPORARY FLIGHT RESTRICTION TFR 5NM RADIUS SFC-5000FT MSL VIP MOVEMENT WEF 2607221500-2607222100',
        effectiveStart: '2026-07-22T15:00Z',
        effectiveEnd: '2026-07-22T21:00Z',
        type: 'TFR',
      },
      {
        id: 'NOTAM-JFK-003',
        icao: 'KJFK',
        rawText: '!JFK 07/021 JFK NAV ILS RWY 04L GLIDE PATH U/S OUT OF SERVICE WEF 2607200000-2607282359',
        effectiveStart: '2026-07-20T00:00Z',
        effectiveEnd: '2026-07-28T23:59Z',
        type: 'NAV',
      },
      {
        id: 'NOTAM-JFK-004',
        icao: 'KJFK',
        rawText: '!JFK 07/028 JFK TWY B RESTRICTED ACFT MAX GROSS WT 50000LBS WIP CONST WEF 2607210600-2608011200',
        effectiveStart: '2026-07-21T06:00Z',
        effectiveEnd: '2026-08-01T12:00Z',
        type: 'TWY',
      },
      {
        id: 'NOTAM-JFK-005',
        icao: 'KJFK',
        rawText: '!JFK 07/032 JFK OBST CRANE ERECTED 2.1NM NE 240FT MSL (227FT AGL) FLGG LGTD WEF 2607150000-2608152359',
        effectiveStart: '2026-07-15T00:00Z',
        effectiveEnd: '2026-08-15T23:59Z',
        type: 'OBST',
      },
      {
        id: 'NOTAM-JFK-FIR-001',
        icao: 'KZNY',
        rawText: '!ZNY 07/099 ZNY FIR GPS UNRELIABLE EN-ROUTE AIRSPACE FL180-FL400 DUE TACTICAL JAMMING WEF 2607241200-2607242000',
        effectiveStart: '2026-07-24T12:00Z',
        effectiveEnd: '2026-07-24T20:00Z',
        type: 'FIR',
        isFir: true,
        firIcao: 'KZNY',
      },
      {
        id: 'NOTAM-JFK-006',
        icao: 'KJFK',
        rawText: '!JFK 07/040 JFK AD BIRD ACTIVITY IN VICINITY OF RWY 22L/04R WEF 2607010000-2608312359',
        effectiveStart: '2026-07-01T00:00Z',
        effectiveEnd: '2026-08-31T23:59Z',
        type: 'INFO',
      },
    ];
  }

  if (code === 'KLAX') {
    return [
      {
        id: 'NOTAM-LAX-001',
        icao: 'KLAX',
        rawText: '!LAX 07/004 LAX TWY C6 AND TWY C7 CLOSED DUE TO SURFACE RESURFACING WIP WEF 2607220400-2607252200',
        effectiveStart: '2026-07-22T04:00Z',
        effectiveEnd: '2026-07-25T22:00Z',
        type: 'TWY',
      },
      {
        id: 'NOTAM-LAX-002',
        icao: 'KLAX',
        rawText: '!LAX 07/011 LAX NAV PAPI RWY 25L OTS OUT OF SERVICE WEF 2607201000-2607271800',
        effectiveStart: '2026-07-20T10:00Z',
        effectiveEnd: '2026-07-27T18:00Z',
        type: 'NAV',
      },
      {
        id: 'NOTAM-LAX-003',
        icao: 'KLAX',
        rawText: '!LAX 07/018 LAX OBST DRILLING RIG 1.4NM SW 180FT MSL UNLGTD WEF 2607180000-2607302359',
        type: 'OBST',
      },
      {
        id: 'NOTAM-LAX-FIR-001',
        icao: 'KZLA',
        rawText: '!ZLA 07/050 ZLA FIR DANGER AREA RESTRICTED MILITARY GUNNERY FL190-FL350 ACTIVE WEF 2607240000-2607241800',
        effectiveStart: '2026-07-24T00:00Z',
        effectiveEnd: '2026-07-24T18:00Z',
        type: 'FIR',
        isFir: true,
        firIcao: 'KZLA',
      },
    ];
  }

  if (code === 'VIDP') {
    return [
      {
        id: 'NOTAM-VIDP-001',
        icao: 'VIDP',
        rawText: 'A0412/26 NOTAMN Q) VIDF/QRTCA/IV/BO/W/000/050/2833N07706E005 A) VIDP B) 2607231000 C) 2607231400 E) VIP MOVEMENT TEMPORARY RESTRICTED AREA RADIUS 5NM SFC TO 5000FT MSL OVER DEL VIP CORRIDOR. AIRSPACE CLOSED TO CIVIL TRAFFIC EXCEPT VVIP FLTS.',
        effectiveStart: '2026-07-23T10:00Z',
        effectiveEnd: '2026-07-23T14:00Z',
        type: 'TFR',
      },
      {
        id: 'NOTAM-VIDP-002',
        icao: 'VIDP',
        rawText: 'A0418/26 NOTAMN Q) VIDF/QMRXX/IV/NBO/A/000/999/2833N07706E005 A) VIDP B) 2607200000 C) 2607302359 E) RWY 11/29 FRICTION CHARACTERISTICS REDUCED DUE TO MONSOON WATER LOGGING. SKIDDING HAZARD REPORTED DURING HEAVY PRECIPITATION.',
        effectiveStart: '2026-07-20T00:00Z',
        effectiveEnd: '2026-07-30T23:59Z',
        type: 'RWY',
      },
      {
        id: 'NOTAM-VIDP-003',
        icao: 'VIDP',
        rawText: 'A0422/26 NOTAMN Q) VIDF/QOBCE/IV/M/A/000/999/2833N07706E005 A) VIDP B) 2607150000 C) 2608152359 E) CRANE ERECTED HGT 185FT AGL 1.2NM SOUTH OF RWY 28 THRESHOLD LGTD.',
        type: 'OBST',
      },
      {
        id: 'NOTAM-VIDF-FIR-001',
        icao: 'VIDF',
        rawText: 'A0505/26 NOTAMN Q) VIDF/QGWXX/IV/NBO/E/000/999/2833N07706E100 A) VIDF B) 2607220000 C) 2607282359 E) DELHI FIR GPS UNRELIABLE / JAMMING REPORTED OVER NORTHERN SECTOR DUE TACTICAL EXERCISES.',
        effectiveStart: '2026-07-22T00:00Z',
        effectiveEnd: '2026-07-28T23:59Z',
        type: 'FIR',
        isFir: true,
        firIcao: 'VIDF',
      },
    ];
  }

  if (code === 'VABB') {
    return [
      {
        id: 'NOTAM-VABB-001',
        icao: 'VABB',
        rawText: 'A0810/26 NOTAMN Q) VABF/QMRCL/IV/NBO/A/000/999/1905N07252E005 A) VABB B) 2607230600 C) 2607231000 E) RWY 09/27 CLSD FOR PRE-MONSOON SURFACE REPAIR AND WIP. ALL OPS ON RWY 14/32.',
        effectiveStart: '2026-07-23T06:00Z',
        effectiveEnd: '2026-07-23T10:00Z',
        type: 'RWY',
      },
      {
        id: 'NOTAM-VABB-002',
        icao: 'VABB',
        rawText: 'A0815/26 NOTAMN Q) VABF/QFAXX/IV/NBO/A/000/999/1905N07252E005 A) VABB B) 2607220000 C) 2607292359 E) MONSOON HEAVY RAINFALL. WATER LOGGING ON TWY N AND TWY M. BRAKING ACTION POOR / SKIDDING HAZARD REPORTED. PILOTS EXERCISE CAUTION.',
        effectiveStart: '2026-07-22T00:00Z',
        effectiveEnd: '2026-07-29T23:59Z',
        type: 'RWY',
      },
      {
        id: 'NOTAM-VABB-003',
        icao: 'VABB',
        rawText: 'A0820/26 NOTAMN Q) VABF/QNVAS/IV/BO/A/000/999/1905N07252E005 A) VABB B) 2607200000 C) 2607272359 E) BBB VOR FREQ 116.6MHZ U/S UNSERVICEABLE DUE DOME MAINTENANCE.',
        type: 'NAV',
      },
      {
        id: 'NOTAM-VABF-FIR-001',
        icao: 'VABF',
        rawText: 'A0901/26 NOTAMN Q) VABF/QWVLW/IV/NBO/E/000/999/1905N07252E100 A) VABF B) 2607230000 C) 2607262359 E) MUMBAI FIR VOLCANIC ASH ADVISORY / SEVERE MONSOON CONVECTIVE SIGMET ACTIVE IN ARABIAN SEA EN-ROUTE SECTOR.',
        effectiveStart: '2026-07-23T00:00Z',
        effectiveEnd: '2026-07-26T23:59Z',
        type: 'FIR',
        isFir: true,
        firIcao: 'VABF',
      },
    ];
  }

  if (code === 'VOBL') {
    return [
      {
        id: 'NOTAM-VOBL-001',
        icao: 'VOBL',
        rawText: 'A0201/26 NOTAMN Q) VOMF/QMXLC/IV/M/A/000/999/1312N07742E005 A) VOBL B) 2607220200 C) 2607251800 E) TWY K2 CLOSED FOR WIP CABLING WORK. FLTS RE-ROUTED VIA TWY L.',
        effectiveStart: '2026-07-22T02:00Z',
        effectiveEnd: '2026-07-25T18:00Z',
        type: 'TWY',
      },
      {
        id: 'NOTAM-VOBL-002',
        icao: 'VOBL',
        rawText: 'A0208/26 NOTAMN Q) VOMF/QFAHW/IV/NBO/A/000/999/1312N07742E005 A) VOBL B) 2607010000 C) 2608312359 E) BIRD ACTIVITY AND DOG MENACE REPORTED AROUND RWY 09R/27L SFC TO 1000FT MSL. PILOTS EXERCISE EXTREME CAUTION.',
        effectiveStart: '2026-07-01T00:00Z',
        effectiveEnd: '2026-08-31T23:59Z',
        type: 'INFO',
      },
    ];
  }

  if (code === 'VDGO') {
    return [
      {
        id: 'NOTAM-VDGO-001',
        icao: 'VDGO',
        rawText: 'A0105/26 NOTAMN Q) VABF/QRTCA/IV/BO/W/000/100/1546N07351E010 A) VDGO B) 2607230400 C) 2607230900 E) MIXED CIVIL MILITARY EXERCISE ACTIVE IN MOPA TERMINAL CONTROL AREA. TEMPORARY RESTRICTED AREA ACTIVE 2000FT TO 10000FT MSL.',
        effectiveStart: '2026-07-23T04:00Z',
        effectiveEnd: '2026-07-23T09:00Z',
        type: 'TFR',
      },
    ];
  }

  // Generic realistic default NOTAM set for any airport
  return [
    {
      id: `NOTAM-${code}-001`,
      icao: code,
      rawText: `!${code} 07/101 ${code} RWY 09/27 CLSD FOR MAINTENANCE WEF 2607221200-2607231200`,
      effectiveStart: '2026-07-22T12:00Z',
      effectiveEnd: '2026-07-23T12:00Z',
      type: 'RWY',
    },
    {
      id: `NOTAM-${code}-002`,
      icao: code,
      rawText: `!${code} 07/102 ${code} NAV VOR/DME OTS OUT OF SERVICE WEF 2607210000-2607282359`,
      type: 'NAV',
    },
    {
      id: `NOTAM-${code}-003`,
      icao: code,
      rawText: `!${code} 07/103 ${code} OBST CRANE ERECTED 1.0NM NORTH 150FT AGL LGTD WEF 2607150000-2608152359`,
      type: 'OBST',
    },
    {
      id: `NOTAM-${code}-FIR-001`,
      icao: `${code.slice(0, 1)}FIR`,
      rawText: `!FIR 07/500 ${code} FIR EN-ROUTE AIRSPACE GPS UNRELIABLE FL200-FL380 WEF 2607241000-2607241800`,
      type: 'FIR',
      isFir: true,
      firIcao: `${code.slice(0, 1)}FIR`,
    },
    {
      id: `NOTAM-${code}-004`,
      icao: code,
      rawText: `!${code} 07/104 ${code} AD MIGRATORY BIRD ACTIVITY REPORTED SFC-1000FT`,
      type: 'INFO',
    },
  ];
}
