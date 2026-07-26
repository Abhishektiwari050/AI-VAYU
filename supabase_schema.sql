-- ==============================================================================
-- PROJECT VAYU — SUPABASE PRODUCTION DATABASE SCHEMA & RLS SETUP
-- Execute this script directly in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. PROFILES TABLE (Tied to Supabase Auth `auth.users`)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'fleet')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  daily_query_count INT NOT NULL DEFAULT 0,
  last_query_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user profile lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile row upon Supabase Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier)
  VALUES (new.id, new.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. BRIEFING AUDITS TABLE (FAR Part 91 / DGCA CAR Audit Trail)
CREATE TABLE IF NOT EXISTS public.briefing_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous_pilot',
  icao VARCHAR(4) NOT NULL,
  generated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  critical_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  flight_category VARCHAR(10) NOT NULL DEFAULT 'VFR',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefing_audits_icao ON public.briefing_audits(icao);
CREATE INDEX IF NOT EXISTS idx_briefing_audits_user ON public.briefing_audits(user_id);

ALTER TABLE public.briefing_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for briefing audits" ON public.briefing_audits
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert briefing audit logs" ON public.briefing_audits
  FOR INSERT WITH CHECK (true);

-- 3. INDIAN NOTAM CACHE TABLE (Series A, C, G Cache)
CREATE TABLE IF NOT EXISTS public.indian_notam_cache (
  icao VARCHAR(4) PRIMARY KEY,
  series_a_json JSONB DEFAULT '[]'::jsonb,
  series_c_json JSONB DEFAULT '[]'::jsonb,
  series_g_json JSONB DEFAULT '[]'::jsonb,
  raw_notams_text TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.indian_notam_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for Indian NOTAM cache" ON public.indian_notam_cache
  FOR SELECT USING (true);

CREATE POLICY "Service role write for Indian NOTAM cache" ON public.indian_notam_cache
  FOR ALL USING (true);

-- 4. CFI DISPATCH RELEASES TABLE (Flight Instructor Sign-Off Hub)
CREATE TABLE IF NOT EXISTS public.cfi_dispatch_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cfi_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  tail_number TEXT NOT NULL,
  icao VARCHAR(4) NOT NULL,
  sha256_audit_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  dispatch_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cfi_releases_hash ON public.cfi_dispatch_releases(sha256_audit_hash);

ALTER TABLE public.cfi_dispatch_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for CFI dispatch releases" ON public.cfi_dispatch_releases
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert CFI dispatch releases" ON public.cfi_dispatch_releases
  FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- END OF SUPABASE SCHEMA SETUP SCRIPT
-- ==============================================================================
