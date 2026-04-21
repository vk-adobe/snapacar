import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarCard } from '../components/CarCard';
import { AppLogo } from '../components/AppLogo';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';

export default function FeedScreen({ navigation }) {
  const { ready, filterSummaries, refreshRemoteFeed, isCloud } = useApp();
  const [q, setQ] = useState('');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(() => filterSummaries(q), [filterSummaries, q]);

  const onRefresh = useCallback(async () => {
    if (!isCloud) return;
    setRefreshing(true);
    try {
      await refreshRemoteFeed?.();
    } finally {
      setRefreshing(false);
    }
  }, [isCloud, refreshRemoteFeed]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topRow}>
        <AppLogo size={40} style={styles.smallLogo} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Spots</Text>
          <Text style={styles.sub}>
            {isCloud ? 'Photos from everyone' : 'Only on this device'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('PlateSearch')}
          style={({ pressed }) => [styles.plateBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="search" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Filter make, model…"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={setQ}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <FlatList
        style={styles.listFlex}
        data={rows}
        keyExtractor={(item) => item.carKey}
        refreshControl={
          isCloud ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          ) : undefined
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: tabBarHeight + 20,
          flexGrow: 1,
        }}
        renderItem={({ item }) => (
          <CarCard
            make={item.make}
            model={item.model}
            year={item.year}
            avgRating={item.avgRating}
            reviewCount={item.reviewCount}
            previewUrl={item.previewUrl}
            onPress={() =>
              navigation.navigate('CarDetail', { carKey: item.carKey })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {q.trim()
              ? 'No matches.'
              : isCloud
                ? 'Nothing yet — open Spot and publish a car.'
                : 'Nothing here yet.\nConfigure Supabase for a shared feed, or add local spots.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  smallLogo: { marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  plateBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 16, marginBottom: 8 },
  search: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 48,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
