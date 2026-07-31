import { fetchLiveNotams } from '../src/lib/fetchLiveNotams';
import { runDeterministicSafetyEngine } from '../src/lib/deterministicEngine';
import { parseIcaoNotam } from '../src/lib/notamParser';
import { evaluateTemporalStatus } from '../src/lib/temporalCheck';

async function verifyGlobalOnlineNotams() {
  console.log('=============================================================');
  console.log('🌐 LIVE ONLINE NOTAM CROSS-VERIFICATION & INSIGHTS BENCHMARK');
  console.log('=============================================================\n');

  const testAirports = ['VIDP', 'KJFK', 'VABB', 'EGLL', 'KDFW'];

  for (const icao of testAirports) {
    console.log(`-------------------------------------------------------------`);
    console.log(`📍 Testing Aerodrome: ${icao}`);
    console.log(`-------------------------------------------------------------`);

    const t0 = performance.now();
    const result = await fetchLiveNotams(icao);
    const t1 = performance.now();

    console.log(`Fetch Status: ${result.isLive ? 'LIVE ONLINE FEED' : 'OFFLINE/FALLBACK'}`);
    console.log(`Data Source: ${result.source}`);
    console.log(`Fetch Duration: ${(t1 - t0).toFixed(2)} ms`);
    console.log(`Total NOTAMs Ingested: ${result.notams.length}`);

    if (result.notams.length > 0) {
      const flagged = runDeterministicSafetyEngine(result.notams);

      const criticals = flagged.filter((f) => f.severity === 'CRITICAL');
      const warnings = flagged.filter((f) => f.severity === 'WARNING');
      const infos = flagged.filter((f) => f.severity === 'INFO');

      const activeNow = flagged.filter((f) => f.effectiveStatus === 'ACTIVE_NOW');
      const future = flagged.filter((f) => f.effectiveStatus === 'SCHEDULED_FUTURE');
      const permanent = flagged.filter((f) => f.effectiveStatus === 'PERMANENT');

      console.log(`  🔴 Critical Hazards: ${criticals.length}`);
      console.log(`  🟡 Operational Warnings: ${warnings.length}`);
      console.log(`  ⚪ Info Notices: ${infos.length}`);
      console.log(`  ⏰ Temporal Status Breakdown: Active Now=${activeNow.length}, Future=${future.length}, Permanent=${permanent.length}`);

      // Sample 1 Critical or Warning NOTAM parse details
      const sample = criticals[0] || warnings[0] || flagged[0];
      if (sample) {
        console.log(`\n  SAMPLE DECODED NOTAM (${sample.id}):`);
        console.log(`  Category: ${sample.category}`);
        console.log(`  Severity: ${sample.severity}`);
        console.log(`  Effective Status: ${sample.effectiveStatus || 'N/A'}`);
        console.log(`  Effective Window: ${sample.effectiveWindow || 'N/A'}`);
        console.log(`  Raw ASCII: ${sample.rawText.slice(0, 150)}...`);
      }
    } else {
      console.log(`  ⚠️ No active NOTAMs returned for ${icao}`);
    }
    console.log('\n');
  }

  console.log('=============================================================');
  console.log('✅ LIVE ONLINE NOTAM CROSS-VERIFICATION COMPLETE');
  console.log('=============================================================\n');
}

verifyGlobalOnlineNotams();
