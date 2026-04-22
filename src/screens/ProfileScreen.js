import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { StarText } from '../components/StarRow';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { colors, radius } from '../theme';
import { fetchCreditLedger } from '../services/social';
import { shareCarSummary } from '../utils/share';

export default function ProfileScreen({ navigation }) {
  const { session, logout, updateProfileFields, cloud } = useAuth();
  const { getMyReviews, ready } = useApp();
  const mine = getMyReviews();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const p = session?.profile;
  const [phone, setPhone] = useState(p?.phone || '');
  const [city, setCity] = useState(p?.city || '');
  const [bio, setBio] = useState(p?.bio || '');
  const [saving, setSaving] = useState(false);
  const [ledger, setLedger] = useState([]);

  useEffect(() => {
    if (p) {
      setPhone(p.phone || '');
      setCity(p.city || '');
      setBio(p.bio || '');
    }
  }, [p?.phone, p?.city, p?.bio, p]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cloud || session?.mode !== 'cloud' || !session?.userId) {
        setLedger([]);
        return;
      }
      const rows = await fetchCreditLedger(session.userId, 30);
      if (!cancelled) setLedger(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [cloud, session?.mode, session?.userId, session?.profile?.credits]);

  const onSaveProfile = async () => {
    if (!cloud) {
      Alert.alert('Profile', 'Add Supabase to sync profile fields.');
      return;
    }
    setSaving(true);
    try {
      await updateProfileFields({
        phone: phone.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
      Alert.alert('Saved', 'Profile updated.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const headerBlock = useCallback(
    () => (
      <View style={styles.profile}>
        <Text style={styles.name}>{session?.name || 'You'}</Text>
        <Text style={styles.email}>{session?.email}</Text>
        {cloud ? (
          <View style={styles.creditsCard}>
            <View style={styles.creditsCardTop}>
              <Text style={styles.creditsLabel}>Spot credits</Text>
              <Ionicons name="flash" size={22} color={colors.star} />
            </View>
            <Text style={styles.creditsBig}>{session?.profile?.credits ?? 0}</Text>
            <Text style={styles.creditsSub}>
              You earn credits when your posts hit the feed (see Supabase trigger).{'\n'}
              <Text style={styles.creditsBold}>
                Lifetime spots: {session?.profile?.lifetime_posts ?? 0}
              </Text>
            </Text>
          </View>
        ) : null}

        {cloud && ledger.length > 0 ? (
          <View style={styles.ledgerSection}>
            <Text style={styles.secLabel}>Credit history</Text>
            {ledger.map((row) => (
              <View key={row.id} style={styles.ledgerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ledgerReason}>
                    {row.delta > 0 ? '+' : ''}
                    {row.delta} · {row.reason}
                  </Text>
                  {row.balance_after != null ? (
                    <Text style={styles.ledgerBalance}>Balance {row.balance_after}</Text>
                  ) : null}
                </View>
                <Text style={styles.ledgerDate}>
                  {row.created_at
                    ? new Date(row.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {cloud ? (
          <>
            <Text style={styles.secLabel}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1…"
              placeholderTextColor={colors.textMuted}
              style={styles.field}
              keyboardType="phone-pad"
            />
            <Text style={styles.secLabel}>City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Where you usually drive"
              placeholderTextColor={colors.textMuted}
              style={styles.field}
            />
            <Text style={styles.secLabel}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="A line about you & cars"
              placeholderTextColor={colors.textMuted}
              style={[styles.field, styles.bio]}
              multiline
            />
            <PrimaryButton
              title="Save profile"
              onPress={onSaveProfile}
              loading={saving}
              disabled={saving}
            />
          </>
        ) : (
          <Text style={styles.localHint}>Local account — enable Supabase for synced profile & credits.</Text>
        )}

        <View style={styles.signOut}>
          <PrimaryButton title="Sign out" onPress={logout} variant="outline" />
        </View>
      </View>
    ),
    [
      session,
      cloud,
      phone,
      city,
      bio,
      saving,
      logout,
      onSaveProfile,
      ledger,
    ]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <FlatList
        style={styles.list}
        data={mine}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={headerBlock}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24, flexGrow: 1 }}
        ListEmptyComponent={
          !ready ? null : (
            <Text style={styles.empty}>No spots yet. Use Spot when you see something good.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              onPress={() =>
                navigation.navigate('Feed', {
                  screen: 'CarDetail',
                  params: { carKey: item.car.carKey },
                })
              }
            >
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.photo} />
              ) : null}
              <View style={styles.cardBody}>
                <Text style={styles.carTitle}>
                  {item.car.year ? `${item.car.year} ` : ''}
                  {item.car.make} {item.car.model}
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
              onPress={() =>
                shareCarSummary(
                  { make: item.car.make, model: item.car.model, year: item.car.year },
                  item.comment || undefined
                )
              }
              style={styles.shareBar}
            >
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1 },
  profile: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  creditsCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.border,
  },
  creditsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditsLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  creditsBig: { fontSize: 36, fontWeight: '800', color: colors.star, letterSpacing: -1 },
  creditsSub: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginTop: 6 },
  creditsBold: { fontWeight: '700', color: colors.text },
  ledgerSection: { marginTop: 4, marginBottom: 8 },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  ledgerReason: { fontSize: 14, color: colors.text, fontWeight: '600' },
  ledgerBalance: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  ledgerDate: { fontSize: 12, color: colors.textMuted, marginLeft: 8 },
  secLabel: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  field: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 6,
    color: colors.text,
  },
  bio: { minHeight: 72, textAlignVertical: 'top' },
  localHint: { marginTop: 12, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  signOut: { marginTop: 16 },
  empty: {
    paddingHorizontal: 24,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { width: '100%', height: 140, backgroundColor: colors.bgElevated },
  cardBody: { padding: 14 },
  carTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  comment: { marginTop: 8, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  shareBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
});
