import React, { useLayoutEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReviewCard } from '../components/ReviewCard';
import { StarText } from '../components/StarRow';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import { shareCarSummary, sharePhoto } from '../utils/share';

export default function CarDetailScreen({ route, navigation }) {
  const { carId } = route.params;
  const { getCarById, getReviewsForCar, averageRatingForCar } = useApp();
  const car = getCarById(carId);
  const reviews = getReviewsForCar(carId);
  const avg = averageRatingForCar(carId);

  useLayoutEffect(() => {
    if (!car) return;
    navigation.setOptions({
      title: car.model,
      headerRight: () => (
        <Pressable
          onPress={() => shareCarSummary(car)}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.headerBtnText}>Share</Text>
        </Pressable>
      ),
    });
  }, [navigation, car]);

  if (!car) {
    return (
      <View style={styles.center}>
        <Text>Car not found.</Text>
      </View>
    );
  }

  const photos = reviews.filter((r) => r.photoUri).map((r) => r.photoUri);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.year}>{car.year}</Text>
          <Text style={styles.make}>{car.make}</Text>
          <Text style={styles.model}>{car.model}</Text>
          <Text style={styles.cat}>{car.category}</Text>
          {avg != null ? (
            <View style={styles.avgRow}>
              <StarText rating={avg} />
              <Text style={styles.avgHint}> from {reviews.length} reviews</Text>
            </View>
          ) : (
            <Text style={styles.noRev}>No reviews yet — be the first.</Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
          onPress={() =>
            navigation.navigate('Add', { screen: 'CaptureForm', params: { carId } })
          }
        >
          <Text style={styles.ctaText}>Add photo & review</Text>
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
            <Text style={styles.hint}>Long-press a photo to share it</Text>
          </>
        )}

        <Text style={styles.section}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.empty}>No reviews yet.</Text>
        ) : (
          reviews
            .slice()
            .reverse()
            .map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  headerBtn: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 4 },
  headerBtnText: { color: colors.accent, fontWeight: '600', fontSize: 16 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  year: { fontSize: 13, fontWeight: '700', color: colors.primary },
  make: { fontSize: 14, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase' },
  model: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 2 },
  cat: { fontSize: 14, color: colors.textMuted, marginTop: 8 },
  avgRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16, flexWrap: 'wrap' },
  avgHint: { fontSize: 13, color: colors.textMuted },
  noRev: { marginTop: 16, color: colors.textMuted, fontSize: 14 },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
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
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: colors.border,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 16 },
  empty: { color: colors.textMuted, fontSize: 15 },
});
