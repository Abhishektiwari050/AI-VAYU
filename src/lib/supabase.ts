import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://kgbgjskpadonrlntzdqc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_VGXp0PLbkjDpM_CYyEi9Fg_YsZYNxl-';

export let supabase: SupabaseClient | null = null;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('[Supabase] Initialized in local offline fallback mode:', err);
}

export interface UserProfile {
  id: string;
  email: string;
  subscription_tier: 'free' | 'pro' | 'fleet';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  daily_query_count: number;
  last_query_date: string;
}

export interface BriefingAudit {
  id?: string;
  user_id?: string;
  icao: string;
  generated_at_utc: string;
  critical_count: number;
  warning_count: number;
  flight_category: string;
  raw_payload?: any;
}

// In-memory profiles database for fast local execution & integration testing
export const mockProfilesDb = new Map<string, UserProfile>();

export async function getUserProfile(userId: string, email: string): Promise<UserProfile> {
  if (mockProfilesDb.has(userId)) {
    return mockProfilesDb.get(userId)!;
  }

  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        mockProfilesDb.set(userId, data as UserProfile);
        return data as UserProfile;
      }
    } catch (err) {}
  }

  const today = new Date().toISOString().split('T')[0];
  const newProfile: UserProfile = {
    id: userId,
    email,
    subscription_tier: 'free',
    daily_query_count: 0,
    last_query_date: today,
  };
  mockProfilesDb.set(userId, newProfile);
  return newProfile;
}

export async function updateUserSubscriptionTier(
  identifier: { userId?: string; customerId?: string; email?: string },
  newTier: 'free' | 'pro' | 'fleet',
  stripeSubId?: string
): Promise<boolean> {
  let updatedInMock = false;

  for (const [id, profile] of mockProfilesDb.entries()) {
    if (
      (identifier.userId && id === identifier.userId) ||
      (identifier.email && profile.email === identifier.email) ||
      (identifier.customerId && profile.stripe_customer_id === identifier.customerId)
    ) {
      profile.subscription_tier = newTier;
      if (stripeSubId) profile.stripe_subscription_id = stripeSubId;
      mockProfilesDb.set(id, profile);
      updatedInMock = true;
      console.log(`[Supabase Auth] Profile ${profile.email || id} updated subscription tier -> ${newTier}`);
    }
  }

  if (!updatedInMock && identifier.userId) {
    mockProfilesDb.set(identifier.userId, {
      id: identifier.userId,
      email: identifier.email || `${identifier.userId}@vayu.aero`,
      subscription_tier: newTier,
      stripe_subscription_id: stripeSubId,
      daily_query_count: 0,
      last_query_date: new Date().toISOString().split('T')[0],
    });
  }

  if (supabase) {
    try {
      let query = supabase.from('profiles').update({
        subscription_tier: newTier,
        stripe_subscription_id: stripeSubId || null,
      });

      if (identifier.userId) query = query.eq('id', identifier.userId);
      else if (identifier.email) query = query.eq('email', identifier.email);
      else if (identifier.customerId) query = query.eq('stripe_customer_id', identifier.customerId);

      await query;
      return true;
    } catch (err) {
      console.warn('[Supabase] Profile update exception:', err);
    }
  }
  return true;
}

export async function recordBriefingAudit(userId: string | undefined, audit: BriefingAudit): Promise<boolean> {
  if (!supabase) return false;

  try {
    const payload = {
      user_id: userId || 'anonymous_pilot',
      icao: audit.icao,
      generated_at_utc: audit.generated_at_utc,
      critical_count: audit.critical_count,
      warning_count: audit.warning_count,
      flight_category: audit.flight_category,
      raw_payload: audit.raw_payload || {},
    };

    await supabase.from('briefing_audits').insert([payload]);
    return true;
  } catch (err) {
    return false;
  }
}

export async function getClientAuthSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getServerAuthSession(token?: string) {
  if (!supabase || !token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user;
}
