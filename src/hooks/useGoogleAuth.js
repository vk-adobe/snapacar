import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getExtra, isSupabaseConfigured } from '../config';

/**
 * Shared Google ID-token flow for Login + SignUp (same Supabase sign-in).
 */
export function useGoogleAuth({ onIdToken, onError }) {
  const [busy, setBusy] = useState(false);
  const onIdTokenRef = useRef(onIdToken);
  const onErrorRef = useRef(onError);
  onIdTokenRef.current = onIdToken;
  onErrorRef.current = onError;

  const extra = getExtra();
  const cloud = isSupabaseConfigured();
  const { webId, androidId, iosId, clientId, hasGoogle } = useMemo(() => {
    const w = (extra.googleWebClientId || '').trim();
    const a = (extra.googleAndroidClientId || '').trim();
    const i = (extra.googleIosClientId || '').trim();
    const fallback = w || a || i;
    const idsOk =
      !!fallback &&
      (Platform.OS === 'web'
        ? !!w
        : Platform.OS === 'android'
          ? !!(a || w)
          : !!(i || w));
    return {
      webId: w,
      androidId: a,
      iosId: i,
      hasGoogle: cloud && idsOk,
      clientId:
        fallback || (Platform.OS === 'web' ? undefined : ''),
    };
  }, [
    cloud,
    extra.googleWebClientId,
    extra.googleAndroidClientId,
    extra.googleIosClientId,
  ]);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webId || undefined,
    iosClientId: iosId || webId || undefined,
    androidClientId: androidId || webId || undefined,
    clientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.params?.id_token || response.authentication?.idToken;
      if (idToken) {
        setBusy(true);
        Promise.resolve(onIdTokenRef.current(idToken))
          .catch((e) =>
            onErrorRef.current?.(e?.message || 'Google sign-in failed.')
          )
          .finally(() => setBusy(false));
      }
    } else if (response?.type === 'error') {
      onErrorRef.current?.(response.error?.message || 'Cancelled or failed.');
    }
  }, [response]);

  return {
    hasGoogle,
    request,
    busy,
    promptAsync: () => {
      promptAsync().catch((e) =>
        onErrorRef.current?.(e?.message || 'Google sign-in failed.')
      );
    },
  };
}
