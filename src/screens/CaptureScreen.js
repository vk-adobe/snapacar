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
import { Ionicons } from '@expo/vector-icons';
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
      Alert.alert('Photo first', 'Add a photo so we can read the plate.');
      return;
    }
    if (!isCloud) {
      Alert.alert('Cloud required', 'Connect Supabase and deploy the analyze-car-image Edge Function for OCR.');
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
        Alert.alert('No strong match', 'Try a clearer plate shot, or type make/model yourself.');
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
      Alert.alert('Spot posted!', 'Your review is live. You earned credits on the server.', [
        { text: 'View feed', onPress: () => navigation.navigate('Feed', { screen: 'FeedHome' }) },
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

  const bottomPad = tabBarHeight + Math.max(insets.bottom, 12) + 36;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.h1}>Log a spot</Text>
          <Text style={styles.lead}>
            A quick snap + honest rating helps everyone spot great cars. Best shots earn bragging
            rights.
          </Text>
        </View>

        <View style={styles.sectionLabel}>
          <Ionicons name="image-outline" size={16} color={colors.accent} />
          <Text style={styles.sectionLabelText}>Photo</Text>
        </View>
        <View style={styles.row}>
          <Pressable
            style={[styles.mediaBtn, styles.mediaPrimary, styles.mediaLeft]}
            onPress={() => pickImage(true)}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={[styles.mediaBtnText, { marginLeft: 6 }]}>Camera</Text>
          </Pressable>
          <Pressable style={[styles.mediaBtn, styles.mediaRight]} onPress={() => pickImage(false)}>
            <Ionicons name="images-outline" size={20} color={colors.text} />
            <Text style={[styles.mediaBtnTextDark, { marginLeft: 6 }]}>Library</Text>
          </Pressable>
        </View>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="car-sport-outline" size={48} color={colors.textMuted} />
            <Text style={styles.placeholderText}>Your photo shows up here</Text>
          </View>
        )}

        {isCloud ? (
          <Pressable
            onPress={runAnalyze}
            disabled={analyzing || !photoUri}
            style={({ pressed }) => [
              styles.analyze,
              pressed && { opacity: 0.9 },
              (analyzing || !photoUri) && { opacity: 0.5 },
            ]}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <>
                <Ionicons name="scan-outline" size={20} color={colors.accent} />
                <Text style={[styles.analyzeText, { marginLeft: 8 }]}>Read plate & hints (OCR)</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Text style={styles.cloudHint}>Connect Supabase for plate OCR from your photo.</Text>
        )}

        <View style={styles.divider} />

        <View style={styles.sectionLabel}>
          <Ionicons name="car-outline" size={16} color={colors.accent} />
          <Text style={styles.sectionLabelText}>Car details</Text>
        </View>
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
          placeholder="e.g. GR Corolla"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Year (optional)</Text>
        <TextInput
          value={year}
          onChangeText={setYear}
          placeholder="e.g. 2024"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={4}
        />

        <Text style={styles.label}>License plate (optional)</Text>
        <TextInput
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder="Auto-filled after OCR or type it"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="characters"
        />

        <View style={styles.divider} />

        <View style={styles.sectionLabel}>
          <Ionicons name="star-outline" size={16} color={colors.star} />
          <Text style={styles.sectionLabelText}>Your take</Text>
        </View>
        <Text style={styles.muted}>
          Tap the stars — be real: would you daily this or just admire it?
        </Text>
        <View style={styles.starsWrap}>
          <StarRow value={rating} onChange={setRating} size={40} />
        </View>

        <Text style={styles.label}>Comment</Text>
        <TextInput
          placeholder="Paint, wheels, sound, rare spec… make people feel they saw it too."
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          style={styles.comment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <View style={styles.submitWrap}>
          <PrimaryButton
            title="Post spot & earn credits"
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
  scroll: { paddingHorizontal: 18, paddingTop: 8 },
  headerBlock: { marginBottom: 18 },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  lead: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLabelText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  row: { flexDirection: 'row', marginBottom: 12 },
  mediaLeft: { marginRight: 5 },
  mediaRight: { marginLeft: 5 },
  mediaBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  mediaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mediaBtnTextDark: { color: colors.text, fontWeight: '600', fontSize: 15 },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    marginBottom: 12,
  },
  previewPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderText: { marginTop: 8, fontSize: 14, color: colors.textMuted },
  analyze: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  analyzeText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  cloudHint: { fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
    opacity: 0.85,
  },
  muted: { fontSize: 13, color: colors.textMuted, marginBottom: 10, lineHeight: 19 },
  starsWrap: { marginBottom: 14 },
  comment: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginBottom: 8,
  },
  submitWrap: { marginTop: 12, marginBottom: 8 },
});
