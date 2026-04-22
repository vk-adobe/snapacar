import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
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
import { colors, radius } from '../theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen({ navigation }) {
  const { signUp, signInWithGoogleIdToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onGoogleErr = useCallback(
    (msg) => Alert.alert('Google sign-up', msg),
    []
  );

  const { hasGoogle, request, busy: googleBusy, promptAsync } = useGoogleAuth({
    onIdToken: signInWithGoogleIdToken,
    onError: onGoogleErr,
  });

  const onSubmit = async () => {
    setBusy(true);
    try {
      const result = await signUp(email, password, name);
      if (result?.needsEmailConfirmation) {
        Alert.alert(
          'Confirm your email',
          `We sent a link to ${result.email}. After you confirm, sign in with email and password.`,
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }
      Alert.alert('Welcome', 'Your account is ready. Start spotting!');
    } catch (e) {
      Alert.alert('Sign up failed', e.message || 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = () => {
    if (!hasGoogle) {
      Alert.alert(
        'Google',
        'Add EXPO_PUBLIC_GOOGLE_* and Supabase keys in .env, then restart Expo.'
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
          <AppLogo size={72} style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.tagline}>
            Join the community — track your spots and climb the credits leaderboard.
          </Text>

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
                <Text style={styles.googleLabel}>Sign up with Google</Text>
              </Pressable>
              <Text style={styles.or}>or register with email</Text>
            </>
          ) : null}

          <Text style={styles.label}>Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Alex"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

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

          <Text style={styles.label}>Password (6+ characters)</Text>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            autoComplete="password-new"
          />

          <View style={styles.gap}>
            <PrimaryButton
              title="Create account"
              onPress={onSubmit}
              loading={busy}
              disabled={busyAny}
            />
          </View>

          <Text style={styles.link} onPress={() => navigation.goBack()}>
            Already have an account? <Text style={styles.linkBold}>Sign in</Text>
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
    marginBottom: 16,
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 24,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 4,
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
