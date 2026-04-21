import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { colors, radius } from '../theme';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await signUp(email, password, name);
    } catch (e) {
      Alert.alert('Sign up failed', e.message || 'Try again.');
    } finally {
      setBusy(false);
    }
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
        <AppLogo size={72} style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.tagline}>
          With Supabase, your account syncs — otherwise data stays on device only.
        </Text>

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
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <View style={styles.gap}>
          <PrimaryButton title="Create account" onPress={onSubmit} loading={busy} disabled={busy} />
        </View>

        <Text style={styles.link} onPress={() => navigation.goBack()}>
          Already have an account? <Text style={styles.linkBold}>Sign in</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 22 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  tagline: { fontSize: 14, color: colors.textMuted, marginBottom: 28, lineHeight: 20 },
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
