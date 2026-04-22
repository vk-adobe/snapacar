import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReviewCard } from '../components/ReviewCard';
import { StarText } from '../components/StarRow';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { parseCarKey } from '../utils/carKey';
import { colors, radius } from '../theme';
import { shareCarSummary, sharePhoto } from '../utils/share';

export default function CarDetailScreen({ route, navigation }) {
  const { carKey } = route.params;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { getReviewsForCarKey, averageRatingForCarKey, prefetchCarDetail, isCloud } = useApp();
  const uid = session?.mode === 'cloud' ? session?.userId : null;

  useFocusEffect(
    useCallback(() => {
      if (isCloud && carKey) prefetchCarDetail?.(carKey);
    }, [carKey, isCloud, prefetchCarDetail])
  );
  const reviews = getReviewsForCarKey(carKey);
  const meta = reviews[0] || parseCarKey(carKey);
  const avg = averageRatingForCarKey(carKey);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: meta.model || 'Car',
      headerRight: () => (
        <Pressable
          onPress={() => shareCarSummary(meta)}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.headerBtnText}>Share</Text>
        </Pressable>
      ),
    });
  }, [navigation, meta]);

  const photos = reviews.filter((r) => r.photoUri).map((r) => r.photoUri);
  const heroPhoto = photos[0] || null;

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero — photo if available, else text card */}
        {heroPhoto ? (
          <View style={styles.heroPhotoWrap}>
            <Image source={{ uri: heroPhoto }} style={styles.heroPhoto} resizeMode="cover" />
            <View style={styles.heroOverlayAll} />
            <View style={styles.heroOverlayBottom} />
            <View style={styles.heroInfoOverlay}>
              {meta.year ? <Text style={styles.heroYear}>{meta.year}</Text> : null}
              <Text style={styles.heroMake}>{meta.make}</Text>
              <Text style={styles.heroModel}>{meta.model}</Text>
              {avg != null ? (
                <View style={styles.avgRow}>
                  <StarText rating={avg} />
                  <Text style={styles.avgHint}> · {reviews.length} spots</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.hero}>
            {meta.year ? (
              <Text style={styles.year}>{meta.year}</Text>
            ) : null}
            <Text style={styles.make}>{meta.make}</Text>
            <Text style={styles.model}>{meta.model}</Text>
            {avg != null ? (
              <View style={styles.avgRow}>
                <StarText rating={avg} />
                <Text style={styles.avgHint}> · {reviews.length} spots</Text>
              </View>
            ) : (
              <Text style={styles.noRev}>No spots yet.</Text>
            )}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
          onPress={() =>
            navigation.navigate('Add', {
              screen: 'SpotForm',
              params: {
                prefilledMake: meta.make,
                prefilledModel: meta.model,
                prefilledYear: meta.year,
              },
            })
          }
        >
          <Text style={styles.ctaText}>Add another spot</Text>
        </Pressable>

        {photos.length > 0 && (
          <>
            <Text style={styles.section}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((uri, i) => (
                <Pressable key={`${uri}_${i}`} onLongPress={() => sharePhoto(uri)}>
                  <Image source={{ uri }} style={styles.thumb} />
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.hint}>Long-press to share a photo</Text>
          </>
        )}

        <Text style={styles.section}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.empty}>No spots yet.</Text>
        ) : (
          reviews
            .slice()
            .reverse()
            .map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                social={{
                  enabled: isCloud && !!uid,
                  currentUserId: uid,
                }}
              />
            ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 4 },
  headerBtnText: { color: colors.accent, fontWeight: '600', fontSize: 16 },
  heroPhotoWrap: {
    width: '100%',
    height: 240,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  heroPhoto: { width: '100%', height: '100%', backgroundColor: colors.bgElevated },
  heroOverlayAll: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  heroOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(10,12,16,0.88)',
  },
  heroInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  heroYear: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 4, letterSpacing: 0.5 },
  heroMake: { fontSize: 11, fontWeight: '700', color: 'rgba(240,243,249,0.55)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  heroModel: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 10 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  year: { fontSize: 13, fontWeight: '700', color: colors.primary },
  make: { fontSize: 13, color: colors.textMuted, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  model: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 4 },
  avgRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4, flexWrap: 'wrap' },
  avgHint: { fontSize: 13, color: colors.textMuted },
  noRev: { marginTop: 16, color: colors.textMuted, fontSize: 14 },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  thumb: {
    width: 140,
    height: 100,
    borderRadius: radius.sm,
    marginRight: 10,
    backgroundColor: colors.border,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 16 },
  empty: { color: colors.textMuted, fontSize: 15 },
});
