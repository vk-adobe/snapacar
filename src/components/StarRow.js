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
          style={n > 1 ? { marginLeft: 6 } : null}
        >
          <Text style={[styles.star, { fontSize: size, opacity: n <= value ? 1 : 0.28 }]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function StarText({ rating }) {
  const r = Number(rating) || 0;
  return (
    <Text style={styles.starCompact}>
      {'★'.repeat(Math.min(5, Math.round(r)))}
      <Text style={styles.muted}> ({r.toFixed(1)})</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { color: colors.star, fontWeight: '600' },
  starCompact: { color: colors.star, fontSize: 14, fontWeight: '600' },
  muted: { color: colors.textMuted, fontWeight: '400', fontSize: 13 },
});
