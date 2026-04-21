import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarCard } from '../components/CarCard';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

export default function CatalogScreen({ navigation }) {
  const { cars, ready, averageRatingForCar, getReviewsForCar } = useApp();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cars;
    return cars.filter(
      (c) =>
        `${c.make} ${c.model} ${c.year} ${c.category}`.toLowerCase().includes(s)
    );
  }, [cars, q]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Catalog</Text>
        <Text style={styles.sub}>{cars.length} vehicles</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Search make, model, year…"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const reviews = getReviewsForCar(item.id);
          const avg = averageRatingForCar(item.id);
          return (
            <CarCard
              car={item}
              avgRating={avg}
              reviewCount={reviews.length}
              onPress={() =>
                navigation.navigate('CarDetail', { carId: item.id })
              }
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No matches. Try another search.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  list: { padding: 16, paddingTop: 0, paddingBottom: 24 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32, fontSize: 15 },
});
