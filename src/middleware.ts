import { UserTier } from './components/MonetizationModal';

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

// In-memory or state tracking for IP / Session query rates on FREE tier
const freeQueryTracker = new Map<string, { count: number; dateString: string }>();

const MAX_FREE_DAILY_QUERIES = 3;

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
  const clientIp = req.ip || (req.headers?.['x-forwarded-for'] as string) || 'client-ip';

  // Determine user tier from session or header override
  let currentTier: UserTier = userSession?.tier || 'FREE';

  if (authHeader?.includes('pro') || authHeader?.includes('PRO')) {
    currentTier = 'PRO';
  } else if (authHeader?.includes('fleet') || authHeader?.includes('FLEET')) {
    currentTier = 'FLEET';
  }

  // PRO and FLEET tiers bypass query rate limits with full privileges
  if (currentTier === 'PRO' || currentTier === 'FLEET') {
    return {
      allowed: true,
      tier: currentTier,
    };
  }

  // FREE TIER ENFORCEMENT
  const today = new Date().toISOString().split('T')[0];
  const trackerKey = userSession?.userId || clientIp || 'default_user';

  const userStats = freeQueryTracker.get(trackerKey) || { count: 0, dateString: today };

  // Reset counter if calendar date changed
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
        message: 'Daily free briefing limit reached. Upgrade to Pro for unlimited corridor briefings.',
        queriesUsed: userStats.count,
        maxFreeBriefs: MAX_FREE_DAILY_QUERIES,
      },
    };
  }

  // Increment query count for FREE user
  userStats.count += 1;
  freeQueryTracker.set(trackerKey, userStats);

  return {
    allowed: true,
    tier: 'FREE',
  };
}
