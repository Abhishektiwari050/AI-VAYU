import { UserTier } from './components/MonetizationModal';
import { mockProfilesDb } from './lib/supabase';

export interface PaywallMiddlewareResult {
  allowed: boolean;
  statusCode?: number;
  tier?: UserTier;
  errorPayload?: {
    error: string;
    message: string;
    queriesUsed?: number;
    maxFreeBriefs?: number;
  };
}

// In-memory tracking for IP / Session query rates on FREE tier
export const freeQueryTracker = new Map<string, { count: number; dateString: string }>();

const MAX_FREE_DAILY_QUERIES = 3;

export function resetPaywallTracker() {
  freeQueryTracker.clear();
}

/**
 * Stripe & Supabase Usage Paywall Interceptor
 * Enforces 3 free queries / 24h rolling window for FREE tier users,
 * and passes unlimited access to PRO / FLEET pilots.
 */
export async function checkBriefingUsageMiddleware(
  req: { headers?: Record<string, any>; body?: any; ip?: string },
  userSession?: { userId?: string; userEmail?: string; tier?: UserTier }
): Promise<PaywallMiddlewareResult> {
  const authHeader = (req.headers?.authorization as string) || (req.headers?.['x-vayu-tier'] as string);
  const clientIp = req.ip || (req.headers?.['x-forwarded-for'] as string) || (req.headers?.['x-client-ip'] as string) || 'client-ip-127-0-0-1';

  let currentTier: UserTier = userSession?.tier || 'FREE';

  if (authHeader?.toLowerCase().includes('pro')) {
    currentTier = 'PRO';
  } else if (authHeader?.toLowerCase().includes('fleet')) {
    currentTier = 'FLEET';
  } else if (userSession?.userId && mockProfilesDb.has(userSession.userId)) {
    const p = mockProfilesDb.get(userSession.userId);
    if (p?.subscription_tier === 'pro') currentTier = 'PRO';
    if (p?.subscription_tier === 'fleet') currentTier = 'FLEET';
  }

  // PRO and FLEET tiers bypass query rate limits completely
  if (currentTier === 'PRO' || currentTier === 'FLEET') {
    return {
      allowed: true,
      tier: currentTier,
    };
  }

  // FREE TIER ENFORCEMENT (3 queries / 24h)
  const today = new Date().toISOString().split('T')[0];
  const trackerKey = userSession?.userId || authHeader || clientIp || 'default_user';

  const userStats = freeQueryTracker.get(trackerKey) || { count: 0, dateString: today };

  if (userStats.dateString !== today) {
    userStats.count = 0;
    userStats.dateString = today;
  }

  if (userStats.count >= MAX_FREE_DAILY_QUERIES) {
    return {
      allowed: false,
      statusCode: 402, // 402 Payment Required
      tier: 'FREE',
      errorPayload: {
        error: 'LIMIT_REACHED',
        message: 'Daily free briefing limit reached (3/3). Upgrade to VAYU Pro for unlimited corridor briefings.',
        queriesUsed: userStats.count,
        maxFreeBriefs: MAX_FREE_DAILY_QUERIES,
      },
    };
  }

  userStats.count += 1;
  freeQueryTracker.set(trackerKey, userStats);

  return {
    allowed: true,
    tier: 'FREE',
  };
}
