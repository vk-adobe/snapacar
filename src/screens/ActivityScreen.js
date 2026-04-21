import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StarText } from '../components/StarRow';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import { shareCarSummary } from '../utils/share';

export default function ActivityScreen({ navigation }) {
  const { getMyReviews, ready } = useApp();
  const mine = getMyReviews();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your activity</Text>
        <Text style={styles.sub}>Reviews saved on this device</Text>
      </View>
      {!ready ? null : mine.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>You have not submitted a review yet.</Text>
          <Text style={styles.emptyHint}>Use the Add tab to photograph a car and leave a rating.</Text>
        </View>
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                onPress={() =>
                  navigation.navigate('Catalog', {
                    screen: 'CarDetail',
                    params: { carId: item.carId },
                  })
                }
              >
                {item.photoUri ? (
                  <Image source={{ uri: item.photoUri }} style={styles.photo} />
                ) : null}
                <View style={styles.cardBody}>
                  <Text style={styles.carTitle}>
                    {item.car.year} {item.car.make} {item.car.model}
                  </Text>
                  <StarText rating={item.rating} />
                  {item.comment ? (
                    <Text style={styles.comment} numberOfLines={3}>
                      {item.comment}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
              <Pressable
                onPress={() => shareCarSummary(item.car, item.comment || undefined)}
                style={styles.shareBar}
              >
                <Text style={styles.shareText}>Share to social</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  list: { padding: 16, paddingBottom: 32 },
  emptyBox: { padding: 24 },
  empty: { fontSize: 16, color: colors.text, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textMuted, marginTop: 10, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: '100%', height: 140, backgroundColor: colors.bg },
  cardBody: { padding: 14 },
  carTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  comment: { marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  shareBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  shareText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
});
