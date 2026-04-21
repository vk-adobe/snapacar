import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile, upsertProfile } from '../services/remotePosts';
import { isSupabaseConfigured } from '../config';
import { getSupabase } from '../lib/supabase';

const SESSION_KEY = '@snapacar_session_v2';
const ACCOUNTS_KEY = '@snapacar_accounts_v2';

const AuthContext = createContext(null);

async function hashPassword(email, password) {
  const payload = `${email.trim().toLowerCase()}|${password}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

export function AuthProvider({ children }) {
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [legacySession, setLegacySession] = useState(null);
  const [ready, setReady] = useState(false);
  const cloud = isSupabaseConfigured();

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabase();

    async function loadLegacy() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.email) {
            if (!cancelled) {
              setLegacySession({
                email: parsed.email,
                name: parsed.name || parsed.email.split('@')[0],
                mode: 'local',
              });
            }
          }
        }
      } catch (e) {
        console.warn('Auth legacy load', e);
      }
    }

    async function init() {
      if (cloud && sb) {
        const { data: { session } } = await sb.auth.getSession();
        if (!cancelled) setSupabaseSession(session ?? null);
        if (session?.user?.id) {
          const p = await fetchProfile(session.user.id);
          if (!cancelled) setProfile(p);
        }
      } else {
        await loadLegacy();
      }
      if (!cancelled) setReady(true);
    }

    init();

    let sub;
    if (cloud && sb) {
      const { data } = sb.auth.onAuthStateChange(async (event, session) => {
        setSupabaseSession(session ?? null);
        if (session?.user?.id) {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
      });
      sub = data.subscription;
    }

    return () => {
      cancelled = true;
      sub?.unsubscribe?.();
    };
  }, [cloud]);

  const refreshProfile = useCallback(async () => {
    const uid = supabaseSession?.user?.id;
    if (!uid || !cloud) return;
    const p = await fetchProfile(uid);
    setProfile(p);
  }, [supabaseSession?.user?.id, cloud]);

  const signInWithGoogleIdToken = useCallback(async (idToken) => {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured.');
    const { data, error } = await sb.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    if (cloud && getSupabase()) {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      return;
    }
    const em = email.trim().toLowerCase();
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? JSON.parse(raw) : {};
    const acc = accounts[em];
    if (!acc) throw new Error('No account found for that email.');
    const h = await hashPassword(em, password);
    if (h !== acc.passwordHash) throw new Error('Incorrect password.');
    const sess = { email: em, name: acc.name || em.split('@')[0], mode: 'local' };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setLegacySession(sess);
    setSupabaseSession(null);
  }, [cloud]);

  const signUp = useCallback(async (email, password, displayName) => {
    if (cloud && getSupabase()) {
      const { error } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: displayName || email.split('@')[0] } },
      });
      if (error) throw error;
      return;
    }
    const em = email.trim().toLowerCase();
    if (!em || !password || password.length < 6) {
      throw new Error('Use a valid email and a password of at least 6 characters.');
    }
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? JSON.parse(raw) : {};
    if (accounts[em]) throw new Error('An account with this email already exists.');
    const passwordHash = await hashPassword(em, password);
    accounts[em] = {
      passwordHash,
      name: (displayName || em.split('@')[0]).trim() || em.split('@')[0],
    };
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    const sess = { email: em, name: accounts[em].name, mode: 'local' };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setLegacySession(sess);
  }, [cloud]);

  const logout = useCallback(async () => {
    if (cloud && getSupabase()) {
      await getSupabase().auth.signOut();
      setSupabaseSession(null);
      setProfile(null);
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    setLegacySession(null);
  }, [cloud]);

  const updateProfileFields = useCallback(
    async (fields) => {
      const uid = supabaseSession?.user?.id;
      if (!uid || !cloud) return;
      await upsertProfile(uid, fields);
      await refreshProfile();
    },
    [supabaseSession?.user?.id, cloud, refreshProfile]
  );

  const session = useMemo(() => {
    if (cloud && supabaseSession?.user) {
      const u = supabaseSession.user;
      return {
        mode: 'cloud',
        userId: u.id,
        email: u.email,
        name: profile?.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'You',
        profile,
      };
    }
    if (legacySession) {
      return {
        mode: 'local',
        userId: legacySession.email,
        email: legacySession.email,
        name: legacySession.name,
        profile: null,
      };
    }
    return null;
  }, [cloud, supabaseSession, legacySession, profile]);

  const value = useMemo(
    () => ({
      ready,
      session,
      isSignedIn: !!session,
      cloud,
      signInWithGoogleIdToken,
      login,
      signUp,
      logout,
      refreshProfile,
      updateProfileFields,
    }),
    [
      ready,
      session,
      cloud,
      signInWithGoogleIdToken,
      login,
      signUp,
      logout,
      refreshProfile,
      updateProfileFields,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
