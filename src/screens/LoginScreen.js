import * as WebBrowser from 'expo-web-browser';
import React, { useCallback } from 'react';
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
import { PasswordField } from '../components/PasswordField';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { isSupabaseConfigured } from '../config';
import { colors, radius } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login, signInWithGoogleIdToken, cloud } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const onGoogleErr = useCallback(
    (msg) => Alert.alert('Google sign-in', msg),
    []
  );

  const { hasGoogle, request, busy: googleBusy, promptAsync } = useGoogleAuth({
    onIdToken: signInWithGoogleIdToken,
    onError: onGoogleErr,
  });

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
        'Add EXPO_PUBLIC_GOOGLE_* client IDs and Supabase keys in .env, then restart Expo.'
      );
      return;
    }
    promptAsync();
  };

  const busyAny = busy || googleBusy;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={[styles.flex, { paddingTop: insets.top + 8 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 20) + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroStripe} />
          <AppLogo size={88} style={styles.logoImg} />
          <Text style={styles.logo}>SnapACar</Text>
          <Text style={styles.tagline}>
            Spot cool cars in the wild. Snap, rate, and flex your finds.
          </Text>

          {!isSupabaseConfigured() ? (
            <Text style={styles.warn}>
              Offline mode: add Supabase keys in .env for the shared feed and sign-in.
            </Text>
          ) : null}

          {hasGoogle ? (
            <>
              <Pressable
                onPress={onGoogle}
                disabled={busyAny || !request}
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && { opacity: 0.92 },
                  (busyAny || !request) && { opacity: 0.55 },
                ]}
              >
                <Text style={styles.googleLabel}>Continue with Google</Text>
              </Pressable>
              <Text style={styles.or}>or sign in with email</Text>
            </>
          ) : cloud ? (
            <Text style={styles.mutedSmall}>
              Add Google OAuth client IDs to .env to enable “Continue with Google”.
            </Text>
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
          <PasswordField value={password} onChangeText={setPassword} />

          <View style={styles.gap}>
            <PrimaryButton
              title="Sign in"
              onPress={onSubmit}
              loading={busy}
              disabled={busyAny}
            />
          </View>

          <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
            New here? <Text style={styles.linkBold}>Create an account</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 22 },
  heroStripe: {
    alignSelf: 'center',
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glowLine,
    marginBottom: 20,
    opacity: 0.9,
  },
  logoImg: { marginBottom: 12 },
  logo: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 26,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  warn: {
    fontSize: 13,
    color: colors.star,
    marginBottom: 16,
    lineHeight: 18,
    textAlign: 'center',
  },
  mutedSmall: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 17,
  },
  googleBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  googleLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  or: { textAlign: 'center', color: colors.textMuted, marginVertical: 18, fontSize: 13 },
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
