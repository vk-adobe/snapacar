import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo } from '../components/AppLogo';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { getExtra, isSupabaseConfigured } from '../config';
import { colors, radius } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login, signInWithGoogleIdToken, cloud } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const extra = getExtra();
  const webId = (extra.googleWebClientId || '').trim();
  const androidId = (extra.googleAndroidClientId || '').trim();
  const iosId = (extra.googleIosClientId || '').trim();
  // expo-auth-session uses platform client id first, then falls back to `clientId` (see Google.js).
  const googleClientIdFallback = webId || androidId || iosId;
  const hasGoogle =
    cloud &&
    !!googleClientIdFallback &&
    (Platform.OS === 'web'
      ? !!webId
      : Platform.OS === 'android'
        ? !!(androidId || webId)
        : !!(iosId || webId));

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: webId || undefined,
    iosClientId: iosId || webId || undefined,
    androidClientId: androidId || webId || undefined,
    // Native: expo-auth-session resolves android/ios id as `platformId ?? clientId`; if all are missing,
    // pass '' so invariant doesn't throw (Google UI is hidden when `hasGoogle` is false).
    clientId:
      googleClientIdFallback || (Platform.OS === 'web' ? undefined : ''),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken;
      if (idToken) {
        setBusy(true);
        signInWithGoogleIdToken(idToken)
          .catch((e) => Alert.alert('Google sign-in failed', e.message || 'Try again.'))
          .finally(() => setBusy(false));
      }
    } else if (response?.type === 'error') {
      Alert.alert('Google sign-in', response.error?.message || 'Cancelled or failed.');
    }
  }, [response, signInWithGoogleIdToken]);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Sign in failed', e.message || 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = () => {
    if (!hasGoogle) {
      Alert.alert(
        'Google sign-in',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and Supabase keys in .env, then restart Expo.'
      );
      return;
    }
    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
      >
        <AppLogo size={88} style={styles.logoImg} />
        <Text style={styles.logo}>SnapACar</Text>
        <Text style={styles.tagline}>Spot cars in traffic. Share photos & ratings.</Text>

        {!isSupabaseConfigured() ? (
          <Text style={styles.warn}>
            Offline mode: add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to use the
            shared feed, Google sign-in, and plate search.
          </Text>
        ) : null}

        {hasGoogle ? (
          <>
            <Pressable
              onPress={onGoogle}
              disabled={busy || !request}
              style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.googleLabel}>Continue with Google</Text>
            </Pressable>
            <Text style={styles.or}>or email</Text>
          </>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="you@email.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.gap}>
          <PrimaryButton title="Sign in" onPress={onSubmit} loading={busy} disabled={busy} />
        </View>

        <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
          New here? <Text style={styles.linkBold}>Create an account</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 22 },
  logoImg: { marginBottom: 16 },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagline: { fontSize: 15, color: colors.textMuted, marginBottom: 24, lineHeight: 22, textAlign: 'center' },
  warn: {
    fontSize: 13,
    color: colors.star,
    marginBottom: 16,
    lineHeight: 18,
    textAlign: 'center',
  },
  googleBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  googleLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  or: { textAlign: 'center', color: colors.textMuted, marginVertical: 16, fontSize: 13 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  gap: { marginTop: 8, marginBottom: 24 },
  link: { textAlign: 'center', color: colors.textMuted, fontSize: 15 },
  linkBold: { color: colors.primary, fontWeight: '700' },
});
