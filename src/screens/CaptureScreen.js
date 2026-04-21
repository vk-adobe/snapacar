import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StarRow } from '../components/StarRow';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

export default function CaptureScreen({ route, navigation }) {
  const { cars, addReview, getCarById, ready } = useApp();
  const paramCarId = route.params?.carId;
  const [carId, setCarId] = useState(paramCarId || null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (paramCarId) setCarId(paramCarId);
  }, [paramCarId]);

  const selected = carId ? getCarById(carId) : null;

  const filteredCars = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return cars;
    return cars.filter((c) =>
      `${c.make} ${c.model} ${c.year}`.toLowerCase().includes(s)
    );
  }, [cars, search]);

  const pickImage = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        fromCamera
          ? 'Camera access is required to photograph your car.'
          : 'Photo library access is required to attach an image.'
      );
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
        });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submit = useCallback(async () => {
    if (!carId) {
      Alert.alert('Select a car', 'Choose a vehicle from the list first.');
      return;
    }
    if (!photoUri) {
      Alert.alert('Add a photo', 'Take or choose a photo for your review.');
      return;
    }
    setSubmitting(true);
    try {
      await addReview({ carId, rating, comment, photoUri });
      setComment('');
      setPhotoUri(null);
      setRating(5);
      Alert.alert('Saved', 'Your review has been added.', [
        {
          text: 'View car',
          onPress: () =>
            navigation.navigate('Catalog', {
              screen: 'CarDetail',
              params: { carId },
            }),
        },
        { text: 'OK' },
      ]);
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'Could not save your review. Try again.');
    } finally {
      setSubmitting(false);
    }
  }, [addReview, carId, comment, navigation, photoUri, rating]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>
          Pick a car, add a photo, then rate and comment. Reviews stay on this device until you add
          a cloud backend.
        </Text>

        <Text style={styles.label}>1. Vehicle</Text>
        <TextInput
          placeholder="Search catalog…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          autoCapitalize="none"
        />
        {filteredCars.slice(0, 14).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setCarId(item.id)}
            style={[styles.pickRow, carId === item.id && styles.pickRowOn]}
          >
            <Text style={styles.pickText}>
              {item.year} {item.make} {item.model}
            </Text>
          </Pressable>
        ))}
        {selected ? (
          <Text style={styles.selected}>
            Selected: <Text style={styles.selectedBold}>{selected.make} {selected.model}</Text>
          </Text>
        ) : null}

        <Text style={[styles.label, { marginTop: 16 }]}>2. Photo</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.mediaBtn, styles.mediaPrimary]}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.mediaBtnText}>Camera</Text>
          </Pressable>
          <Pressable style={styles.mediaBtn} onPress={() => pickImage(false)}>
            <Text style={styles.mediaBtnTextDark}>Library</Text>
          </Pressable>
        </View>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <Text style={styles.hint}>No photo yet</Text>
        )}

        <Text style={styles.label}>3. Rating</Text>
        <StarRow value={rating} onChange={setRating} size={36} />

        <Text style={styles.label}>4. Comment</Text>
        <TextInput
          placeholder="What stood out?"
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          style={styles.comment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          style={({ pressed }) => [
            styles.submit,
            pressed && { opacity: 0.92 },
            submitting && { opacity: 0.6 },
          ]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit review</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  lead: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: 8,
  },
  pickRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickRowOn: { borderColor: colors.primary, backgroundColor: '#fff5f6' },
  pickText: { fontSize: 15, color: colors.text },
  selected: { marginTop: 8, fontSize: 14, color: colors.textMuted },
  selectedBold: { fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  mediaBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  mediaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mediaBtnTextDark: { color: colors.text, fontWeight: '600', fontSize: 15 },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  comment: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  submit: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
