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
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';
import { isSupabaseConfigured } from '../config';

export default function FeedScreen({ navigation }) {
  const { session } = useAuth();
  const { ready, filterSummaries, refreshRemoteFeed, isCloud } = useApp();
  const [q, setQ] = useState('');
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(() => filterSummaries(q), [filterSummaries, q]);
  const credits =
    session?.mode === 'cloud' ? session?.profile?.credits ?? 0 : null;

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

  const supabaseOk = isSupabaseConfigured();
  const cloudSession = session?.mode === 'cloud';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      {/* Connection status banner */}
      {!supabaseOk ? (
        <View style={[styles.banner, styles.bannerError]}>
          <Ionicons name="warning-outline" size={14} color="#fff" />
          <Text style={styles.bannerText}>
            Supabase not connected — restart Metro after adding keys to .env
          </Text>
        </View>
      ) : !cloudSession ? (
        <View style={[styles.banner, styles.bannerWarn]}>
          <Ionicons name="information-circle-outline" size={14} color="#fff" />
          <Text style={styles.bannerText}>
            Local mode — sign out and sign in again to sync to Supabase
          </Text>
        </View>
      ) : null}
      {/* Header row */}
      <View style={styles.topRow}>
        <AppLogo size={40} style={styles.smallLogo} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Spots</Text>
          <Text style={styles.sub}>
            {isCloud ? 'Photos from everyone' : 'Only on this device'}
          </Text>
        </View>
        {credits != null && isCloud ? (
          <View style={styles.creditsChip}>
            <Ionicons name="flash" size={15} color={colors.star} />
            <Text style={styles.creditsChipText}>{credits}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => navigation.navigate('PlateSearch')}
          style={({ pressed }) => [styles.plateBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="barcode-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      {/* Search bar with icon + clear */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Filter make, model…"
            placeholderTextColor={colors.textMuted}
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ('')} hitSlop={10}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Results count row */}
      {rows.length > 0 ? (
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {rows.length} {rows.length === 1 ? 'car' : 'cars'}
          </Text>
          {isCloud ? (
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <FlatList
        style={styles.listFlex}
        data={rows}
        keyExtractor={(item) => item.carKey}
        refreshControl={
          isCloud ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
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
          <View style={styles.emptyWrap}>
            <Ionicons name="car-sport-outline" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>
              {q.trim() ? 'No matches' : 'No spots yet'}
            </Text>
            <Text style={styles.emptySub}>
              {q.trim()
                ? 'Try a different make or model.'
                : isCloud
                  ? 'Open Spot and be the first to publish a car.'
                  : 'Configure Supabase for a shared feed, or add local spots.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: radius.sm,
  },
  bannerError: { backgroundColor: colors.danger },
  bannerWarn:  { backgroundColor: '#b45309' },
  bannerText: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  listFlex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  smallLogo: { marginRight: 12 },
  headerText: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  creditsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: 'rgba(255,61,92,0.3)',
    marginRight: 8,
  },
  creditsChipText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  statsText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: { fontSize: 12, fontWeight: '600', color: colors.success },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
