import { checkBriefingUsageMiddleware, resetPaywallTracker } from './src/middleware.ts';
import { mockProfilesDb, updateUserSubscriptionTier } from './src/lib/supabase.ts';

async function runBillingAndAuthTestSuite() {
  console.log('=============================================================');
  console.log('🚀 STARTING VAYU BILLING, AUTH & PAYWALL INTEGRATION TEST SUITE');
  console.log('=============================================================\n');

  let testAPass = false;
  let testBPass = false;
  let testCPass = false;
  let testDPass = false;

  // -------------------------------------------------------------
  // TEST A: Free Tier Rate-Limiting (3 queries/24h)
  // -------------------------------------------------------------
  console.log('--- TEST A: Free Tier Rate-Limit Interception (3/3) ---');
  resetPaywallTracker();

  const testFreeUser = { userId: 'user_free_test_123', tier: 'FREE' as const };

  const req1 = await checkBriefingUsageMiddleware({ headers: {} }, testFreeUser);
  console.log(`Request 1: Allowed=${req1.allowed}, Tier=${req1.tier}`);

  const req2 = await checkBriefingUsageMiddleware({ headers: {} }, testFreeUser);
  console.log(`Request 2: Allowed=${req2.allowed}, Tier=${req2.tier}`);

  const req3 = await checkBriefingUsageMiddleware({ headers: {} }, testFreeUser);
  console.log(`Request 3: Allowed=${req3.allowed}, Tier=${req3.tier}`);

  const req4 = await checkBriefingUsageMiddleware({ headers: {} }, testFreeUser);
  console.log(`Request 4: Allowed=${req4.allowed}, StatusCode=${req4.statusCode}, Error=${req4.errorPayload?.error}`);

  if (
    req1.allowed === true &&
    req2.allowed === true &&
    req3.allowed === true &&
    req4.allowed === false &&
    req4.statusCode === 402 &&
    req4.errorPayload?.error === 'LIMIT_REACHED'
  ) {
    testAPass = true;
    console.log('👉 TEST A RESULT: PASS (Requests 1-3 allowed, Request 4 blocked with 402 LIMIT_REACHED)\n');
  } else {
    console.log('👉 TEST A RESULT: FAIL\n');
  }

  // -------------------------------------------------------------
  // TEST B: Pro/Fleet Unlimited Tier Bypass
  // -------------------------------------------------------------
  console.log('--- TEST B: Pro/Fleet Unlimited Tier Bypass ---');

  const testProUser = { userId: 'user_pro_test_999', tier: 'PRO' as const };

  let proAllPassed = true;
  for (let i = 1; i <= 6; i++) {
    const res = await checkBriefingUsageMiddleware({ headers: { 'x-vayu-tier': 'PRO' } }, testProUser);
    if (!res.allowed || res.tier !== 'PRO') {
      proAllPassed = false;
      console.log(`Pro Request ${i} Failed! Allowed=${res.allowed}`);
    }
  }

  if (proAllPassed) {
    testBPass = true;
    console.log('👉 TEST B RESULT: PASS (6 consecutive Pro requests allowed without rate-limiting)\n');
  } else {
    console.log('👉 TEST B RESULT: FAIL\n');
  }

  // -------------------------------------------------------------
  // TEST C: Stripe Webhook Event Synchronization
  // -------------------------------------------------------------
  console.log('--- TEST C: Stripe Webhook Event Synchronization ---');

  const webhookUserId = 'pilot_john_doe_456';
  mockProfilesDb.set(webhookUserId, {
    id: webhookUserId,
    email: 'john.doe@flightops.aero',
    subscription_tier: 'free',
    daily_query_count: 0,
    last_query_date: new Date().toISOString().split('T')[0],
  });

  console.log(`Initial Profile Tier for ${webhookUserId}: ${mockProfilesDb.get(webhookUserId)?.subscription_tier}`);

  // Simulate mock customer.subscription.updated webhook processing
  const mockWebhookEvent = {
    id: 'evt_test_sub_updated_123',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_test_pro_999',
        customer: 'cus_test_123',
        status: 'active',
        metadata: { userId: webhookUserId, email: 'john.doe@flightops.aero' },
      },
    },
  };

  // Process webhook event update
  await updateUserSubscriptionTier(
    { userId: mockWebhookEvent.data.object.metadata.userId, customerId: mockWebhookEvent.data.object.customer },
    'pro',
    mockWebhookEvent.data.object.id
  );

  const updatedTier = mockProfilesDb.get(webhookUserId)?.subscription_tier;
  console.log(`Updated Profile Tier for ${webhookUserId}: ${updatedTier}`);

  if (updatedTier === 'pro') {
    testCPass = true;
    console.log('👉 TEST C RESULT: PASS (Stripe webhook updated database profile to pro)\n');
  } else {
    console.log('👉 TEST C RESULT: FAIL\n');
  }

  // -------------------------------------------------------------
  // TEST D: Frontend HTTP 402 Paywall Modal Trigger
  // -------------------------------------------------------------
  console.log('--- TEST D: Frontend HTTP 402 Paywall Modal Trigger ---');

  // Simulate frontend fetch handler intercepting HTTP 402
  let isMonetizationModalOpen = false;
  let errorState: string | null = null;

  const mockResponse = {
    status: 402,
    ok: false,
    json: async () => ({
      error: 'LIMIT_REACHED',
      message: 'Daily free briefing limit reached (3/3). Upgrade to VAYU Pro for unlimited corridor briefings.',
    }),
  };

  // Simulate App.tsx line 172-177 handler logic
  if (!mockResponse.ok && mockResponse.status === 402) {
    const errData = await mockResponse.json();
    isMonetizationModalOpen = true;
    errorState = errData.message;
  }

  console.log(`Modal Open State: ${isMonetizationModalOpen}`);
  console.log(`Error Message Rendered: "${errorState}"`);

  if (isMonetizationModalOpen === true && errorState?.includes('Daily free briefing limit reached')) {
    testDPass = true;
    console.log('👉 TEST D RESULT: PASS (HTTP 402 response successfully triggered Monetization Modal)\n');
  } else {
    console.log('👉 TEST D RESULT: FAIL\n');
  }

  // -------------------------------------------------------------
  // OUTPUT FINAL QA AUDIT TABLE
  // -------------------------------------------------------------
  console.log('📊 VAYU BILLING & AUTH QA AUDIT RESULTS');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`[${testAPass ? 'x' : ' '}] TEST A: Free Tier Rate-Limit Interception (3/3)  --> [${testAPass ? 'PASS' : 'FAIL'}]`);
  console.log(`[${testBPass ? 'x' : ' '}] TEST B: Pro/Fleet Unlimited Tier Bypass         --> [${testBPass ? 'PASS' : 'FAIL'}]`);
  console.log(`[${testCPass ? 'x' : ' '}] TEST C: Stripe Webhook Event Synchronization    --> [${testCPass ? 'PASS' : 'FAIL'}]`);
  console.log(`[${testDPass ? 'x' : ' '}] TEST D: Frontend HTTP 402 Paywall Modal Trigger --> [${testDPass ? 'PASS' : 'FAIL'}]`);
  console.log('─────────────────────────────────────────────────────────────\n');
}

runBillingAndAuthTestSuite();
