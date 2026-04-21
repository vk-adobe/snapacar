import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchPostsByPlateNormalized } from '../services/remotePosts';
import { normalizePlate } from '../utils/plate';
import { colors, radius } from '../theme';
import { isSupabaseConfigured } from '../config';

export default function PlateSearchScreen({ navigation }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const search = async () => {
    const n = normalizePlate(q);
    if (!n || n.length < 4) {
      setResults([]);
      return;
    }
    if (!isSupabaseConfigured()) {
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchPostsByPlateNormalized(n);
      setResults(rows);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>
        Enter a plate number to find spots others posted (same normalized plate).
      </Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="e.g. KA 01 AB 1234"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          autoCapitalize="characters"
        />
        <Pressable style={[styles.go, styles.goBtn]} onPress={search}>
          <Text style={styles.goText}>Find</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {!isSupabaseConfigured()
                ? 'Connect Supabase to search by plate.'
                : 'No posts for that plate yet.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate('CarDetail', { carKey: item.car_key })
              }
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.img} />
              ) : null}
              <View style={styles.pad}>
                <Text style={styles.title}>
                  {item.year} {item.make} {item.model}
                </Text>
                <Text style={styles.meta}>
                  {item.author_name} · {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 16, paddingTop: 8 },
  hint: { color: colors.textMuted, marginBottom: 12, lineHeight: 20, fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 16 },
  inputFlex: { flex: 1, marginRight: 10 },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  go: {
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  goBtn: { alignSelf: 'stretch', justifyContent: 'center' },
  goText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  img: { width: '100%', height: 160, backgroundColor: colors.bgElevated },
  pad: { padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32 },
});
