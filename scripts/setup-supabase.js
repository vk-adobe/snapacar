#!/usr/bin/env node
/**
 * One-time Supabase setup script.
 * Reads SUPABASE_SERVICE_ROLE_KEY from .env and:
 *   1. Verifies the project is reachable
 *   2. Creates the car-images storage bucket (public)
 *   3. Checks that the profiles + posts tables exist
 *
 * Usage:
 *   1. Add your service role key to .env:
 *        SUPABASE_SERVICE_ROLE_KEY=eyJhbGciO...
 *      (Supabase dashboard → Settings → API → service_role key)
 *   2. node scripts/setup-supabase.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Load .env ────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    });
}

const SUPABASE_URL      = env.EXPO_PUBLIC_SUPABASE_URL      || '';
const ANON_KEY          = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY     || '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌  EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.error('   Go to: Supabase dashboard → Settings → API → service_role (secret)');
  console.error('   Then add this line to .env:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciO...');
  process.exit(1);
}

// ── HTTP helper ──────────────────────────────────────────────────────────────
function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          apikey: token,
          Authorization: `Bearer ${token}`,
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍  Checking Supabase project:', SUPABASE_URL);

  // 1. Reachability
  const ping = await request('GET', `${SUPABASE_URL}/rest/v1/`, null, ANON_KEY);
  if (ping.status >= 500) {
    console.error('❌  Project unreachable — HTTP', ping.status);
    process.exit(1);
  }
  console.log('✅  Project reachable');

  // 2. Check tables
  for (const table of ['profiles', 'posts']) {
    const r = await request('GET', `${SUPABASE_URL}/rest/v1/${table}?limit=0`, null, SERVICE_ROLE_KEY);
    if (r.status === 404 || (r.body?.message || '').includes('does not exist')) {
      console.error(`❌  Table "${table}" does not exist — run the SQL migration first`);
      console.error('   SQL Editor → paste supabase/migrations/001_snapacar.sql');
    } else {
      console.log(`✅  Table "${table}" exists`);
    }
  }

  // 3. Create car-images bucket
  const bucketCheck = await request('GET', `${SUPABASE_URL}/storage/v1/bucket/car-images`, null, SERVICE_ROLE_KEY);
  if (bucketCheck.status === 200) {
    console.log('✅  Storage bucket "car-images" already exists');
  } else {
    console.log('🪣  Creating storage bucket "car-images"...');
    const create = await request(
      'POST',
      `${SUPABASE_URL}/storage/v1/bucket`,
      { id: 'car-images', name: 'car-images', public: true },
      SERVICE_ROLE_KEY
    );
    if (create.status === 200 || create.status === 201) {
      console.log('✅  Bucket "car-images" created');
    } else {
      console.error('❌  Could not create bucket:', JSON.stringify(create.body));
      console.error('   Fallback: Supabase dashboard → Storage → New bucket → "car-images" (public)');
    }
  }

  // 4. Check storage RLS policies
  console.log('\n📋  Setup complete. Make sure RLS policies are set up:');
  console.log('   Run supabase/migrations/002_storage_car_images.sql in the SQL editor');
  console.log('   Run supabase/migrations/003_snapacar_social_leaderboard.sql in the SQL editor');
  console.log('\n🚀  Restart Expo with:  npx expo start --clear');
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
