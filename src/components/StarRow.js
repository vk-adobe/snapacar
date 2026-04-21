import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function StarRow({ value, onChange, size = 28, readonly = false }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={readonly ? undefined : () => onChange?.(n)}
          disabled={readonly}
          hitSlop={8}
        >
          <Text style={[styles.star, { fontSize: size, opacity: n <= value ? 1 : 0.25 }]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function StarText({ rating }) {
  const r = Number(rating);
  return (
    <Text style={styles.starCompact}>
      {'★'.repeat(Math.round(r))}
      <Text style={styles.muted}> ({r.toFixed(1)})</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { color: colors.star, fontWeight: '600' },
  starCompact: { color: colors.star, fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 13 },
});
