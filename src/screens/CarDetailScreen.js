import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReviewCard } from '../components/ReviewCard';
import { StarText } from '../components/StarRow';
import { useApp } from '../context/AppContext';
import { parseCarKey } from '../utils/carKey';
import { colors, radius } from '../theme';
import { shareCarSummary, sharePhoto } from '../utils/share';

export default function CarDetailScreen({ route, navigation }) {
  const { carKey } = route.params;
  const insets = useSafeAreaInsets();
  const { getReviewsForCarKey, averageRatingForCarKey, prefetchCarDetail, isCloud } = useApp();

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

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
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
            .map((r) => <ReviewCard key={r.id} review={r} />)
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
  avgRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16, flexWrap: 'wrap' },
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
