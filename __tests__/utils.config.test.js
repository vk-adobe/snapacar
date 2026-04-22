/**
 * Tests for src/config.js — verifies that isSupabaseConfigured() and getExtra()
 * read from EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY env vars.
 *
 * Each describe block uses jest.isolateModules() + manual env-var setup so that
 * the module is fresh-loaded with the desired environment.
 */

const VALID_URL = 'https://abcdefgh.supabase.co';
const VALID_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.SIGNATURE_STUB_LONG_ENOUGH';

function loadConfig(env = {}) {
  let mod;
  const saved = {};

  // Save & set
  ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'].forEach((k) => {
    saved[k] = process.env[k];
    if (k in env) {
      process.env[k] = env[k];
    } else {
      delete process.env[k];
    }
  });

  jest.isolateModules(() => {
    mod = require('../src/config');
  });

  // Restore
  Object.entries(saved).forEach(([k, v]) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  });

  return mod;
}

// ─── isSupabaseConfigured ────────────────────────────────────────────────────

describe('isSupabaseConfigured', () => {
  it('returns false when both env vars are absent', () => {
    const { isSupabaseConfigured } = loadConfig({});
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when URL is empty', () => {
    const { isSupabaseConfigured } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: VALID_KEY,
    });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when anon key is empty', () => {
    const { isSupabaseConfigured } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: VALID_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when URL does not start with https://', () => {
    const { isSupabaseConfigured } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'http://abcdefgh.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: VALID_KEY,
    });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when URL does not contain .supabase.co', () => {
    const { isSupabaseConfigured } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.com',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: VALID_KEY,
    });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns false when anon key is shorter than 20 characters', () => {
    const { isSupabaseConfigured } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: VALID_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'tooshort',
    });
    expect(isSupabaseConfigured()).toBe(false);
  });

  it('returns true when both URL and anon key are valid', () => {
    const { isSupabaseConfigured } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: VALID_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: VALID_KEY,
    });
    expect(isSupabaseConfigured()).toBe(true);
  });
});

// ─── getExtra ────────────────────────────────────────────────────────────────

describe('getExtra', () => {
  it('returns empty strings when env vars are not set', () => {
    const { getExtra } = loadConfig({});
    const extra = getExtra();
    expect(extra.supabaseUrl).toBe('');
    expect(extra.supabaseAnonKey).toBe('');
  });

  it('returns the values from the env vars when set', () => {
    const { getExtra } = loadConfig({
      EXPO_PUBLIC_SUPABASE_URL: VALID_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: VALID_KEY,
    });
    const extra = getExtra();
    expect(extra.supabaseUrl).toBe(VALID_URL);
    expect(extra.supabaseAnonKey).toBe(VALID_KEY);
  });
});
