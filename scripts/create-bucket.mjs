/**
 * Creates the car-images storage bucket using the Supabase JS client.
 * Reads credentials from .env — no SSL workarounds needed.
 *
 * Run:  node scripts/create-bucket.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env');

const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const SUPABASE_URL      = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('🔍  Connecting to', SUPABASE_URL);

  // Check if bucket already exists
  const { data: existing, error: listErr } = await sb.storage.getBucket('car-images');
  if (existing) {
    console.log('✅  Bucket "car-images" already exists — nothing to do.');
  } else {
    console.log('🪣  Creating bucket "car-images"...');
    const { data, error } = await sb.storage.createBucket('car-images', { public: true });
    if (error) {
      console.error('❌  Failed to create bucket:', error.message);
      console.error('   Manually: Supabase Dashboard → Storage → New bucket → "car-images" → Public');
      process.exit(1);
    }
    console.log('✅  Bucket "car-images" created successfully.');
  }

  // Verify profiles table
  const { error: profErr } = await sb.from('profiles').select('id').limit(0);
  if (profErr) {
    console.error('❌  profiles table error:', profErr.message);
    console.error('   Run: supabase/migrations/001_snapacar.sql in SQL Editor');
  } else {
    console.log('✅  profiles table OK');
  }

  // Verify posts table
  const { error: postsErr } = await sb.from('posts').select('id').limit(0);
  if (postsErr) {
    console.error('❌  posts table error:', postsErr.message);
  } else {
    console.log('✅  posts table OK');
  }

  console.log('\n🚀  Done. Now:');
  console.log('   1. npx expo start --clear');
  console.log('   2. Sign out and sign back in inside the app');
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });
