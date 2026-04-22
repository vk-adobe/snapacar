import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../theme';

export function PasswordField({
  value,
  onChangeText,
  placeholder = '••••••••',
  autoComplete = 'password',
  style,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoComplete={autoComplete}
        textContentType="password"
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        style={({ pressed }) => [styles.eye, pressed && { opacity: 0.7 }]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  eye: { paddingRight: 14, paddingVertical: 10 },
});
