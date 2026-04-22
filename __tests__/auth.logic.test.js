/**
 * Auth context — local (offline) mode tests.
 * Supabase is disabled so all operations go through AsyncStorage + local hashing.
 */

jest.mock('../src/lib/supabase', () => ({ getSupabase: () => null }));
jest.mock('../src/config', () => ({ isSupabaseConfigured: () => false }));
// Deterministic hash so login/signUp comparisons work predictably
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: jest.fn((_algo, payload) => Promise.resolve(`hash:${payload}`)),
}));

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const wrapper = ({ children }) => React.createElement(AuthProvider, null, children);

/** Flush microtasks so the AuthProvider useEffect (loadLegacy) resolves. */
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

// ─── signUp ──────────────────────────────────────────────────────────────────

describe('signUp — local mode', () => {
  beforeEach(() => AsyncStorage.clear());

  it('registers a new account and signs the user in immediately', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    let out;
    await act(async () => {
      out = await result.current.signUp('alice@test.com', 'password123', 'Alice');
    });

    expect(out).toEqual({ needsEmailConfirmation: false });
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.session.email).toBe('alice@test.com');
    expect(result.current.session.name).toBe('Alice');
    expect(result.current.session.mode).toBe('local');
  });

  it('uses the email prefix as display name when name is blank', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => {
      await result.current.signUp('prefix@test.com', 'password123', '');
    });

    expect(result.current.session.name).toBe('prefix');
  });

  it('normalises the email to lowercase and trims whitespace', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => {
      await result.current.signUp('  UPPER@Test.COM  ', 'password123', 'Upper');
    });

    expect(result.current.session.email).toBe('upper@test.com');
  });

  it('throws when the password is shorter than 6 characters', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    let error;
    await act(async () => {
      try { await result.current.signUp('x@test.com', '123', 'X'); }
      catch (e) { error = e; }
    });

    expect(error?.message).toMatch(/at least 6/i);
  });

  it('throws when the email is already registered', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('dup@test.com', 'pass123', 'Dup'); });

    let error;
    await act(async () => {
      try { await result.current.signUp('dup@test.com', 'other123', 'Dup2'); }
      catch (e) { error = e; }
    });

    expect(error?.message).toMatch(/already exists/i);
  });

  it('persists the account record in AsyncStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('stored@test.com', 'pass123', 'Stored'); });

    const raw = await AsyncStorage.getItem('@snapacar_accounts_v2');
    const accounts = JSON.parse(raw);
    expect(accounts['stored@test.com']).toBeDefined();
    expect(accounts['stored@test.com'].name).toBe('Stored');
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('login — local mode', () => {
  beforeEach(() => AsyncStorage.clear());

  it('signs in with correct credentials after sign-up', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('bob@test.com', 'mysecret', 'Bob'); });
    await act(async () => { await result.current.logout(); });
    expect(result.current.isSignedIn).toBe(false);

    await act(async () => { await result.current.login('bob@test.com', 'mysecret'); });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.session.email).toBe('bob@test.com');
    expect(result.current.session.mode).toBe('local');
  });

  it('is case-insensitive for the email on login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('carol@test.com', 'pass456', 'Carol'); });
    await act(async () => { await result.current.logout(); });

    await act(async () => { await result.current.login('CAROL@TEST.COM', 'pass456'); });

    expect(result.current.isSignedIn).toBe(true);
  });

  it('throws when no account exists for the given email', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    let error;
    await act(async () => {
      try { await result.current.login('ghost@test.com', 'any'); }
      catch (e) { error = e; }
    });

    expect(error?.message).toMatch(/No account found/i);
  });

  it('throws on an incorrect password', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('pw@test.com', 'correct', 'PW'); });
    await act(async () => { await result.current.logout(); });

    let error;
    await act(async () => {
      try { await result.current.login('pw@test.com', 'wrong'); }
      catch (e) { error = e; }
    });

    expect(error?.message).toMatch(/Incorrect password/i);
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────

describe('logout — local mode', () => {
  beforeEach(() => AsyncStorage.clear());

  it('clears the in-memory session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('dave@test.com', 'pass789', 'Dave'); });
    expect(result.current.isSignedIn).toBe(true);

    await act(async () => { await result.current.logout(); });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it('removes the persisted session key from AsyncStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('eve@test.com', 'pass789', 'Eve'); });
    await act(async () => { await result.current.logout(); });

    const stored = await AsyncStorage.getItem('@snapacar_session_v2');
    expect(stored).toBeNull();
  });

  it('can sign in again after logging out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await settle();

    await act(async () => { await result.current.signUp('frank@test.com', 'pass789', 'Frank'); });
    await act(async () => { await result.current.logout(); });
    await act(async () => { await result.current.login('frank@test.com', 'pass789'); });

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.session.email).toBe('frank@test.com');
  });
});
