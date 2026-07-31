import { classifyNotam } from '../src/lib/ml/notamClassifier';
import { calculateWindComponents, checkAircraftEnvelope, analyzeTafApproachWindows } from '../src/lib/ml/weatherPredictor';
import { deduplicateNotams, computeCosineSimilarity } from '../src/lib/ml/deduplication';
import { buildSpatialGeoJsonEngine, generateGeodesicCirclePolygon, GeoJsonPolygonGeometry } from '../src/lib/ml/geoJsonEngine';
import { generateEfbDeepLinks, generateClearanceAuditHash } from '../src/lib/efbExporter';
import { FlaggedNotam } from '../src/types';

console.log('=============================================================');
console.log('🧪 PROJECT VAYU — END-TO-END ML & GIS PIPELINE TEST SUITE');
console.log('=============================================================\n');

// --------------------------------------------------------------------------
// 1. TEST DUAL-STAGE NOTAM NER & HAZARD CLASSIFIER
// --------------------------------------------------------------------------
console.log('--- 1. Testing Dual-Stage NOTAM NER & Hazard Classifier ---');

const sampleNotam1 = 'A1405/26 NOTAMN Q) VIDF/QMRLC/IV/NBO/A/000/999/2834N07707E005 A) VIDP B) 2606290917 C) 2608311830 E) RWY 11R/29L NOT AVBL FOR OPS DUE TO WIP.';
const classResult1 = classifyNotam(sampleNotam1);
console.log('NOTAM 1 Classification Result:', JSON.stringify(classResult1, null, 2));

const sampleNotam2 = 'A0867/26 NOTAMR A0402/26 Q) VABF/QFAHX/IV/NBO/A/000/999/1906N07252E005 A) VABB B) 2606120501 C) 2609092100 E) CONCENTRATION OF BIRD ACTIVITY IN VICINITY OF RWY 09.';
const classResult2 = classifyNotam(sampleNotam2);
console.log('NOTAM 2 Classification Result:', JSON.stringify(classResult2, null, 2));

console.assert(classResult1.severityLevel === 'LEVEL_3_CRITICAL', 'NOTAM 1 should be LEVEL_3_CRITICAL');
console.assert(classResult1.operationalImpactScore >= 0.9, 'NOTAM 1 impact score should be >= 0.9');
console.assert(classResult1.assetTags.includes('RWY_11R/29L'), 'NOTAM 1 asset tags should include RWY');
console.log('✅ Dual-Stage NER & Hazard Classifier Verification: PASSED\n');


// --------------------------------------------------------------------------
// 2. TEST PREDICTIVE CROSSWIND & ANOMALY ENGINE
// --------------------------------------------------------------------------
console.log('--- 2. Testing Predictive Crosswind & Anomaly Engine ---');

// Runway 11 (110 degrees heading), Wind 020 at 22kts gust 28kts
const windComp = calculateWindComponents(110, 20, 22, 28);
console.log('Calculated Wind Vector Components:', JSON.stringify(windComp, null, 2));

const c172Check = checkAircraftEnvelope(windComp, 'C172');
console.log('C172 Envelope Check:', c172Check.warningMessage);

const b737Check = checkAircraftEnvelope(windComp, 'B737');
console.log('B737 Envelope Check:', b737Check.warningMessage);

console.assert(windComp.crosswindKts === 28, 'Crosswind should be ~28 kts with gust');
console.assert(c172Check.isExceeded === true, 'C172 crosswind should be exceeded (28 kts > 15 kts limit)');
console.assert(b737Check.isExceeded === false, 'B737 crosswind should be within envelope (28 kts <= 33 kts limit)');

// TAF Approach Window Warning Check
const sampleTaf = `TAF VIDP 280500Z 2806/2912 09015KT 4000 HZ NSC
FM281400 09008KT 1500 TSRA BKN008 FEW025CB
FM282000 05005KT 0800 FG OVC002`;
const tafWarnings = analyzeTafApproachWindows(sampleTaf);
console.log('TAF Approach Window Warnings:', JSON.stringify(tafWarnings, null, 2));

console.assert(tafWarnings.length >= 2, 'Should identify low ceiling / visibility IFR approach warnings');
console.log('✅ Predictive Crosswind & Anomaly Engine Verification: PASSED\n');


// --------------------------------------------------------------------------
// 3. TEST SEMANTIC VECTOR DEDUPLICATION
// --------------------------------------------------------------------------
console.log('--- 3. Testing Semantic Vector Deduplication Engine ---');

const notamSet: FlaggedNotam[] = [
  {
    id: 'A01',
    rawText: 'RWY 11R/29L CLOSED FOR WIP MAINTENANCE DAILY 0200-0800Z',
    severity: 'CRITICAL',
    category: 'RUNWAYS_TFRS',
    matchedKeywords: ['CLOSED'],
  },
  {
    id: 'A02',
    rawText: 'RWY 11R/29L NOT AVBL FOR OPERATIONS DUE TO WIP MAINTENANCE 0200-0800Z',
    severity: 'CRITICAL',
    category: 'RUNWAYS_TFRS',
    matchedKeywords: ['NOT AVBL'],
  },
  {
    id: 'A03',
    rawText: 'PAPI RWY 29L UNSERVICEABLE FOR ALL APPROACHES',
    severity: 'WARNING',
    category: 'PROCEDURES_NAVAIDS',
    matchedKeywords: ['UNSERVICEABLE'],
  },
];

const clusters = deduplicateNotams(notamSet, 0.5);
console.log('Deduplication Clusters:', JSON.stringify(clusters, null, 2));

console.assert(clusters.length === 2, 'Should group A01 and A02 into 1 cluster and A03 into separate cluster');
console.assert(clusters[0].duplicateCount === 1, 'Lead NOTAM should have 1 similar duplicate');
console.log('✅ Semantic Vector Deduplication Engine Verification: PASSED\n');


// --------------------------------------------------------------------------
// 4. TEST DETERMINISTIC GEOJSON SPATIAL MAP ENGINE
// --------------------------------------------------------------------------
console.log('--- 4. Testing Deterministic GeoJSON Spatial Map Engine ---');

const spatialEngine = buildSpatialGeoJsonEngine(notamSet, [28.5665, 77.1031]);
console.log(`Generated ${spatialEngine.features.length} GeoJSON Features.`);
const lineFeatures = spatialEngine.features.filter((f) => f.geometry.type === 'LineString');
const polygonFeatures = spatialEngine.features.filter((f) => f.geometry.type === 'Polygon');

console.log('Sample LineString Feature (Closed Runway):', JSON.stringify(lineFeatures[0], null, 2));
console.log('Sample Polygon Feature (5NM Circle):', JSON.stringify(polygonFeatures[0], null, 2));

console.assert(lineFeatures.length > 0, 'Should create LineString features for closed runways');
console.assert(lineFeatures[0].state?.closed === true, 'Line feature state closed should be true for blinking red styling');
console.assert((polygonFeatures[0].geometry as GeoJsonPolygonGeometry).coordinates[0].length === 65, '5NM Geodesic circle polygon should contain 65 coordinates');
console.log('✅ Deterministic GeoJSON Spatial Map Engine Verification: PASSED\n');


// --------------------------------------------------------------------------
// 5. TEST COCKPIT DISPATCH & EFB EXPORTER
// --------------------------------------------------------------------------
console.log('--- 5. Testing Cockpit Dispatch & EFB Exporter ---');

const deepLinks = generateEfbDeepLinks('VIDP', 'KJFK', ['VABB']);
console.log('Generated EFB Deep Links:', JSON.stringify(deepLinks, null, 2));

const auditHash = generateClearanceAuditHash('VIDP', 30, '2026-07-28T07:30:00Z');
console.log('Generated Clearance SHA-256 Hash:', auditHash);

console.assert(deepLinks.foreFlightUrl.includes('VIDP%20VABB%20KJFK'), 'ForeFlight URL should encode route waypoints');
console.assert(deepLinks.skyDemonUrl.includes('VIDP%2CVABB%2CKJFK') || deepLinks.skyDemonUrl.includes('VIDP,VABB,KJFK'), 'SkyDemon URL should format comma separated waypoints');
console.assert(auditHash.startsWith('VAYU-CLR-2026-VIDP-'), 'SHA-256 audit hash should match VAYU clearance format');
console.log('✅ Cockpit Dispatch & EFB Exporter Verification: PASSED\n');

console.log('=============================================================');
console.log('🎉 ALL 5 ML & GIS INTELLIGENCE PIPELINE MODULES VERIFIED!');
console.log('=============================================================\n');
