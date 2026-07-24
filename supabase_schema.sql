-- Project VAYU SQL Schema Migration for Supabase Auth & Billing
-- Run this migration in the Supabase SQL Editor to set up user profiles and briefing audit logging

-- 1. Create PROFILES Table
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

-- Row Level Security (RLS) Policies for PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Create BRIEFING_AUDITS Table
CREATE TABLE IF NOT EXISTS public.briefing_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  icao TEXT NOT NULL,
  generated_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  critical_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  flight_category TEXT NOT NULL,
  raw_payload JSONB DEFAULT '{}'::jsonb
);

-- Row Level Security (RLS) Policies for BRIEFING_AUDITS
ALTER TABLE public.briefing_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own briefing audits"
  ON public.briefing_audits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert briefing audits"
  ON public.briefing_audits FOR INSERT
  WITH CHECK (true);

-- 3. Automatic Profile Creation Trigger on Auth User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier, daily_query_count, last_query_date)
  VALUES (new.id, new.email, 'free', 0, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
