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

const MEDAL_COLOR = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_BG = [
  'rgba(255,215,0,0.12)',
  'rgba(192,192,192,0.1)',
  'rgba(205,127,50,0.1)',
];
const MEDAL_BORDER = [
  'rgba(255,215,0,0.35)',
  'rgba(192,192,192,0.3)',
  'rgba(205,127,50,0.28)',
];

function MedalIcon({ rank }) {
  if (rank === 1) return <Ionicons name="trophy" size={22} color={MEDAL_COLOR[0]} />;
  if (rank === 2) return <Ionicons name="medal-outline" size={22} color={MEDAL_COLOR[1]} />;
  if (rank === 3) return <Ionicons name="medal-outline" size={22} color={MEDAL_COLOR[2]} />;
  return <Ionicons name="ellipse-outline" size={16} color={colors.textMuted} />;
}

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
        <Ionicons name="trophy-outline" size={48} color={colors.border} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={styles.offline}>
          Connect Supabase in .env to see the leaderboard.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Leaderboard</Text>
          <Text style={styles.sub}>Top spotters by credits</Text>
        </View>
        <Pressable
          onPress={onRebuild}
          disabled={rebuilding}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.8 }]}
        >
          {rebuilding ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={colors.accent} />
              <Text style={styles.refreshLabel}>Update</Text>
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="trophy-outline" size={48} color={colors.border} />
              <Text style={styles.empty}>
                No rankings yet. Tap "Update" after posting, or run migration 003 in Supabase.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isYou = myId && item.user_id === myId;
            const rank = item.rank;
            const isMedal = rank <= 3;

            return (
              <View
                style={[
                  styles.row,
                  isMedal && {
                    backgroundColor: MEDAL_BG[rank - 1],
                    borderColor: MEDAL_BORDER[rank - 1],
                  },
                  isYou && styles.rowYou,
                ]}
              >
                {/* Rank number */}
                <View style={styles.rankWrap}>
                  <Text
                    style={[
                      styles.rank,
                      isMedal && { color: MEDAL_COLOR[rank - 1] },
                    ]}
                  >
                    #{rank}
                  </Text>
                </View>

                {/* Name + stats */}
                <View style={styles.rowMid}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                    {isYou ? (
                      <View style={styles.youChip}>
                        <Text style={styles.youText}>you</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.meta}>
                    {item.score} credits · {item.lifetime_posts_snapshot} spots
                  </Text>
                </View>

                {/* Medal / trophy icon */}
                <MedalIcon rank={rank} />
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
  offline: {
    color: colors.textMuted,
    textAlign: 'center',
    marginHorizontal: 24,
    lineHeight: 22,
    marginTop: 8,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshLabel: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 48,
    gap: 12,
    paddingHorizontal: 24,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
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
  rankWrap: { width: 48 },
  rank: { fontSize: 18, fontWeight: '800', color: colors.text },
  rowMid: { flex: 1, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  youChip: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,61,92,0.3)',
  },
  youText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  meta: { fontSize: 12, color: colors.textMuted },
});
