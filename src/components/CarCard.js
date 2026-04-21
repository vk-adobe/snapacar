import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { StarText } from './StarRow';

export function CarCard({ car, avgRating, reviewCount, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{car.year}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.make}>{car.make}</Text>
          <Text style={styles.model}>{car.model}</Text>
          <Text style={styles.cat}>{car.category}</Text>
        </View>
        <View style={styles.right}>
          {avgRating != null ? (
            <StarText rating={avgRating} />
          ) : (
            <Text style={styles.noReviews}>No reviews</Text>
          )}
          {reviewCount > 0 && (
            <Text style={styles.count}>
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.92 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  badgeText: { fontWeight: '700', fontSize: 13, color: colors.text },
  body: { flex: 1 },
  make: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
  model: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  cat: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  noReviews: { fontSize: 12, color: colors.textMuted },
  count: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
