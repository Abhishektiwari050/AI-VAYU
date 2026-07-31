import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kgbgjskpadonrlntzdqc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VGXp0PLbkjDpM_CYyEi9Fg_YsZYNxl-';

async function testSupabaseConnection() {
  console.log('Testing Supabase Connection to:', SUPABASE_URL);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const res1 = await supabase.from('indian_notam_cache').select('*', { count: 'exact' }).limit(2);
    console.log('indian_notam_cache query result:', { count: res1.count, rows: res1.data?.length, error: res1.error });
  } catch (err) {
    console.error('Error querying indian_notam_cache:', err);
  }

  try {
    const res2 = await supabase.from('profiles').select('*', { count: 'exact' }).limit(2);
    console.log('profiles query result:', { count: res2.count, rows: res2.data?.length, error: res2.error });
  } catch (err) {
    console.error('Error querying profiles:', err);
  }
}

testSupabaseConnection();
