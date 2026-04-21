import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { StarRow } from '../components/StarRow';
import { useApp } from '../context/AppContext';
import { analyzeCarImage } from '../services/carAnalysis';
import { colors, radius } from '../theme';

export default function CaptureScreen({ route, navigation }) {
  const { addReview, ready, isCloud } = useApp();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const pref = route.params || {};
  const [make, setMake] = useState(pref.prefilledMake || '');
  const [model, setModel] = useState(pref.prefilledModel || '');
  const [year, setYear] = useState(pref.prefilledYear ? String(pref.prefilledYear) : '');
  const [licensePlate, setLicensePlate] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (pref.prefilledMake) setMake(pref.prefilledMake);
    if (pref.prefilledModel) setModel(pref.prefilledModel);
    if (pref.prefilledYear != null) setYear(String(pref.prefilledYear));
  }, [pref.prefilledMake, pref.prefilledModel, pref.prefilledYear]);

  const pickImage = async (fromCamera) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        fromCamera
          ? 'We need the camera to snap the car you see.'
          : 'We need photo library access to attach a picture.'
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

  const runAnalyze = async () => {
    if (!photoUri) {
      Alert.alert('Photo first', 'Add a photo, then we can try to read the plate from it.');
      return;
    }
    if (!isCloud) {
      Alert.alert(
        'Cloud required',
        'Connect Supabase and deploy the analyze-car-image Edge Function for OCR + hints.'
      );
      return;
    }
    setAnalyzing(true);
    try {
      const res = await analyzeCarImage(photoUri);
      if (res.error && res.error !== 'SUPABASE_REQUIRED') {
        Alert.alert('Analysis', res.error || 'Could not analyze. Enter details manually.');
      }
      if (res.plateGuess) setLicensePlate(res.plateGuess);
      if (res.hints?.make) setMake((m) => m || res.hints.make);
      if (res.hints?.model) setModel((m) => m || res.hints.model);
      if (res.labels?.length) {
        Alert.alert(
          'Hints from image',
          `Labels: ${res.labels.slice(0, 5).join(', ')}\n\nConfirm make/model — auto-detect is approximate.`
        );
      } else if (!res.plateGuess && !res.hints?.make) {
        Alert.alert(
          'No strong match',
          'Try a clearer photo of the plate, or type make/model yourself.'
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = useCallback(async () => {
    if (!make.trim() || !model.trim()) {
      Alert.alert('Car details', 'Enter at least make and model.');
      return;
    }
    if (!photoUri) {
      Alert.alert('Photo', 'Take or choose a photo of the car.');
      return;
    }
    setSubmitting(true);
    try {
      await addReview({
        make,
        model,
        year,
        rating,
        comment,
        photoUri,
        licensePlate,
      });
      setComment('');
      setPhotoUri(null);
      setLicensePlate('');
      setRating(5);
      Alert.alert('Saved', 'Your spot is live.', [
        {
          text: 'View feed',
          onPress: () => navigation.navigate('Feed', { screen: 'FeedHome' }),
        },
        { text: 'OK' },
      ]);
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', e.message || 'Could not save.');
    } finally {
      setSubmitting(false);
    }
  }, [addReview, comment, licensePlate, make, model, navigation, photoUri, rating, year]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const bottomPad = tabBarHeight + Math.max(insets.bottom, 12) + 32;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      >
        <Text style={styles.lead}>
          Add a photo, optionally read plate from the image (cloud), then rate and comment.
        </Text>

        <Text style={styles.label}>Make</Text>
        <TextInput
          value={make}
          onChangeText={setMake}
          placeholder="e.g. Toyota"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Camry"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Year (optional)</Text>
        <TextInput
          value={year}
          onChangeText={setYear}
          placeholder="e.g. 2022"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={4}
        />

        <Text style={styles.label}>License plate (optional)</Text>
        <TextInput
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder="Visible on the car"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="characters"
        />

        <Text style={[styles.label, { marginTop: 8 }]}>Photo</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.mediaBtn, styles.mediaPrimary, styles.mediaLeft]}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.mediaBtnText}>Camera</Text>
          </Pressable>
          <Pressable style={[styles.mediaBtn, styles.mediaRight]} onPress={() => pickImage(false)}>
            <Text style={styles.mediaBtnTextDark}>Library</Text>
          </Pressable>
        </View>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <Text style={styles.hint}>Snap the car safely, or choose from library.</Text>
        )}

        {isCloud ? (
          <Pressable
            onPress={runAnalyze}
            disabled={analyzing}
            style={({ pressed }) => [
              styles.analyze,
              pressed && { opacity: 0.9 },
              analyzing && { opacity: 0.6 },
            ]}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.analyzeText}>Read plate & hints from image</Text>
            )}
          </Pressable>
        ) : null}

        <Text style={styles.label}>Rating</Text>
        <StarRow value={rating} onChange={setRating} size={38} />

        <Text style={styles.label}>Comment</Text>
        <TextInput
          placeholder="Color, trim, condition, vibe…"
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          style={styles.comment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.submitWrap}>
          <PrimaryButton
            title="Post spot"
            onPress={submit}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
  lead: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
    marginBottom: 14,
  },
  row: { flexDirection: 'row', marginBottom: 10 },
  mediaLeft: { marginRight: 5 },
  mediaRight: { marginLeft: 5 },
  mediaBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
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
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    marginBottom: 8,
  },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  analyze: {
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: 16,
  },
  analyzeText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  comment: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: 8,
  },
  submitWrap: { marginTop: 20 },
});
