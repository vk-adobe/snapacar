import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard, refreshLeaderboardCache } from '../services/social';
import { colors, radius } from '../theme';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { session, cloud } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const load = useCallback(async () => {
    if (!cloud) {
      setRows([]);
      setLoading(false);
      return;
    }
    const list = await fetchLeaderboard('all_time');
    setRows(list);
    setLoading(false);
  }, [cloud]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const onRebuild = async () => {
    setRebuilding(true);
    try {
      await refreshLeaderboardCache('all_time');
      await load();
    } catch (e) {
      Alert.alert('Leaderboard', e.message || 'Run migration 003 or try again.');
    } finally {
      setRebuilding(false);
    }
  };

  const myId = session?.mode === 'cloud' ? session?.userId : null;

  if (!cloud) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.offline}>
          Connect Supabase in .env to see the leaderboard.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.sub}>Top spotters by credits</Text>
        </View>
        <Pressable
          onPress={onRebuild}
          disabled={rebuilding}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.85 }]}
        >
          {rebuilding ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.refreshLabel}>Update ranks</Text>
            </>
          )}
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.user_id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No rankings yet. Tap “Update ranks” after posting, or run migration 003 in Supabase.
            </Text>
          }
          renderItem={({ item }) => {
            const isYou = myId && item.user_id === myId;
            return (
              <View style={[styles.row, isYou && styles.rowYou]}>
                <Text style={styles.rank}>#{item.rank}</Text>
                <View style={styles.rowMid}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.displayName}
                    {isYou ? ' · you' : ''}
                  </Text>
                  <Text style={styles.meta}>
                    {item.score} credits · {item.lifetime_posts_snapshot} spots
                  </Text>
                </View>
                <Ionicons name="trophy-outline" size={22} color={colors.star} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  offline: { color: colors.textMuted, textAlign: 'center', marginHorizontal: 24, lineHeight: 22 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshLabel: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 40, lineHeight: 22, paddingHorizontal: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowYou: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  rank: { width: 44, fontSize: 18, fontWeight: '800', color: colors.text },
  rowMid: { flex: 1, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
