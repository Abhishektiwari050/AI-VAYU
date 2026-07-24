import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable lookup with safe fallbacks
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vayu-aviation.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheXUtYXZpYXRpb24iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjUxMjAwMCwiZXhwIjoy03ODc4NDAwMH0.dummy_anon_key_for_vayu_local';

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

/**
 * Fetch or initialize a user profile in Supabase
 */
export async function getUserProfile(userId: string, email: string): Promise<UserProfile> {
  if (!supabase) {
    return {
      id: userId,
      email,
      subscription_tier: 'pro',
      daily_query_count: 0,
      last_query_date: new Date().toISOString().split('T')[0],
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      const today = new Date().toISOString().split('T')[0];
      const newProfile: UserProfile = {
        id: userId,
        email,
        subscription_tier: 'free',
        daily_query_count: 0,
        last_query_date: today,
      };

      await supabase.from('profiles').insert([newProfile]);
      return newProfile;
    }

    return data as UserProfile;
  } catch (err) {
    console.warn('[Supabase] Profile lookup error:', err);
    return {
      id: userId,
      email,
      subscription_tier: 'pro',
      daily_query_count: 0,
      last_query_date: new Date().toISOString().split('T')[0],
    };
  }
}

/**
 * Persists briefing audit log to Supabase table `briefing_audits`
 */
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

    const { error } = await supabase.from('briefing_audits').insert([payload]);
    if (error) {
      console.warn('[Supabase] Failed to write briefing_audit entry:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Audit recording exception:', err);
    return false;
  }
}
