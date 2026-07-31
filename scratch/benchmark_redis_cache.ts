import { fetchLiveNotams } from 'd:/Projects/VAYU/src/lib/fetchLiveNotams';
import { getCachedBriefing, setCachedBriefing, coalescedFetch } from 'd:/Projects/VAYU/src/lib/redisCache';
import { BriefingSummary } from 'd:/Projects/VAYU/src/types';

async function runRedisBenchmark() {
  console.log('=============================================================');
  console.log('⚡ STARTING VAYU REDIS CACHING & PERFORMANCE BENCHMARK');
  console.log('=============================================================\n');

  const testIcao = 'VIDP';

  // 1. Measure Cache Miss (Cold Lookup)
  console.log(`--- STEP 1: COLD LOOKUP (Cache Miss) for ${testIcao} ---`);
  const t0 = performance.now();
  const liveResult = await fetchLiveNotams(testIcao);
  const t1 = performance.now();
  const coldDuration = (t1 - t0).toFixed(2);
  console.log(`Cold Fetch Duration: ${coldDuration} ms`);
  console.log(`NOTAMs Fetched: ${liveResult.notams.length}`);
  console.log(`Source: ${liveResult.source}\n`);

  // Construct mock briefing payload for cache test
  const dummyBriefing: BriefingSummary = {
    icao: testIcao,
    airportName: 'DELHI INTL AIRPORT',
    generatedAtUtc: new Date().toISOString(),
    weather: {
      rawMetar: 'VIDP 280100Z 28005KT 4000 HZ FEW030 28/22 A2980',
      plainEnglishSummary: 'VFR condition',
      flightCategory: 'VFR',
    },
    criticalAlerts: [],
    warnings: [],
    infoItems: [],
    picTakeaway: 'Normal operations',
    totalNotamsIngested: liveResult.notams.length,
    criticalCount: 0,
    warningCount: 0,
    deterministicRulesTriggered: 0,
    allNotamsLedger: liveResult.notams.map((n) => ({
      id: n.id,
      rawText: n.rawText,
      severity: 'INFO',
      matchedKeywords: [],
      category: 'GENERAL',
    })),
  };

  // Populate Redis Cache
  await setCachedBriefing(testIcao, dummyBriefing, 300);

  // 2. Measure Cache Hit (Warm Lookup)
  console.log(`--- STEP 2: WARM LOOKUP (Cache Hit) for ${testIcao} ---`);
  const t2 = performance.now();
  const cachedBriefing = await getCachedBriefing(testIcao);
  const t3 = performance.now();
  const warmDuration = (t3 - t2).toFixed(2);

  console.log(`Warm Cache Fetch Duration: ${warmDuration} ms`);
  console.log(`Cached Airport: ${cachedBriefing?.airportName}`);
  console.log(`Cached NOTAMs: ${cachedBriefing?.allNotamsLedger.length}\n`);

  // Calculate Speedup Factor
  const speedup = (parseFloat(coldDuration) / parseFloat(warmDuration)).toFixed(1);
  console.log('=============================================================');
  console.log(`🚀 PERFORMANCE SPEEDUP: ${speedup}x FASTER WITH REDIS CACHE!`);
  console.log(`Cold Miss: ${coldDuration} ms  -->  Warm Hit: ${warmDuration} ms`);
  console.log('=============================================================\n');
}

runRedisBenchmark();
