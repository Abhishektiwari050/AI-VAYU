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
      id: `NOTAM-${code}-004`,
      icao: code,
      rawText: `!${code} 07/104 ${code} AD MIGRATORY BIRD ACTIVITY REPORTED SFC-1000FT`,
      type: 'INFO',
    },
  ];
}
