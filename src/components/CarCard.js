import React, { useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export function CarCard({ make, model, year, avgRating, reviewCount, previewUrl, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.965, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 5 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>

        {/* Image area with overlays */}
        <View style={styles.imgContainer}>
          {previewUrl ? (
            <Image source={{ uri: previewUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="car-sport-outline" size={56} color={colors.textMuted} />
            </View>
          )}

          {/* Subtle full-image darkening */}
          <View style={styles.overlayAll} />
          {/* Heavy dark fade at bottom for text readability */}
          <View style={styles.overlayBottom} />

          {/* Rating badge — top right */}
          {avgRating != null ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={11} color={colors.star} />
              <Text style={styles.ratingText}>{Number(avgRating).toFixed(1)}</Text>
            </View>
          ) : null}

          {/* Car info floating over bottom of image */}
          <View style={styles.infoOverlay}>
            <View style={styles.infoLeft}>
              {year ? <Text style={styles.yearTag}>{year}</Text> : null}
              <Text style={styles.makeText}>{make}</Text>
              <Text style={styles.modelText} numberOfLines={1}>{model}</Text>
            </View>
            {reviewCount > 0 ? (
              <View style={styles.spotsBadge}>
                <Ionicons name="camera-outline" size={11} color={colors.primary} />
                <Text style={styles.spotsText}> {reviewCount}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Accent strip at bottom */}
        <View style={styles.accentStrip} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  imgContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgElevated,
  },
  imgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayAll: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(10, 12, 16, 0.86)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,201,61,0.35)',
  },
  ratingText: {
    color: colors.star,
    fontSize: 12,
    fontWeight: '800',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  infoLeft: { flex: 1, marginRight: 10 },
  yearTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  makeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(240,243,249,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  modelText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  spotsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,61,92,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,61,92,0.32)',
  },
  spotsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  accentStrip: {
    height: 3,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
});
