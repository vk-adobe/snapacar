import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';
import { StarText } from './StarRow';

export function CarCard({ make, model, year, avgRating, reviewCount, previewUrl, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      {previewUrl ? (
        <Image source={{ uri: previewUrl }} style={styles.heroImg} resizeMode="cover" />
      ) : null}
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{year || '—'}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.make}>{make}</Text>
          <Text style={styles.model}>{model}</Text>
        </View>
        <View style={styles.right}>
          {avgRating != null ? (
            <StarText rating={avgRating} />
          ) : (
            <Text style={styles.noReviews}>—</Text>
          )}
          {reviewCount > 0 && (
            <Text style={styles.count}>
              {reviewCount} {reviewCount === 1 ? 'spot' : 'spots'}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  heroImg: { width: '100%', height: 120, backgroundColor: colors.bgElevated },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: 12 },
  badge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginRight: 12,
    minWidth: 52,
    alignItems: 'center',
  },
  badgeText: { fontWeight: '700', fontSize: 13, color: colors.text },
  body: { flex: 1 },
  make: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  model: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  noReviews: { fontSize: 12, color: colors.textMuted },
  count: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
