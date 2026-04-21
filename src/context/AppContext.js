import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { CARS, getCarById } from '../data/cars';

const STORAGE_KEY = '@snapacar_v1';
const USER_KEY = '@snapacar_user';

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [reviewsByCar, setReviewsByCar] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let uid = await AsyncStorage.getItem(USER_KEY);
        if (!uid) {
          uid = randomId();
          await AsyncStorage.setItem(USER_KEY, uid);
        }
        if (cancelled) return;
        setUserId(uid);

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') setReviewsByCar(parsed);
        }
      } catch (e) {
        console.warn('AppContext load', e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addReview = useCallback(async ({ carId, rating, comment, photoUri }) => {
    const reviewId = randomId();
    let storedPhotoUri = photoUri;
    if (photoUri) {
      const dir = `${FileSystem.documentDirectory}photos/`;
      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const dest = `${dir}${reviewId}.jpg`;
        await FileSystem.copyAsync({ from: photoUri, to: dest });
        storedPhotoUri = dest;
      } catch (e) {
        console.warn('persist photo', e);
      }
    }
    const review = {
      id: reviewId,
      carId,
      userId,
      rating,
      comment: (comment || '').trim(),
      photoUri: storedPhotoUri || null,
      createdAt: new Date().toISOString(),
    };
    setReviewsByCar((prev) => {
      const next = {
        ...prev,
        [carId]: [...(prev[carId] || []), review],
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
        console.warn('AppContext persist', e)
      );
      return next;
    });
    return review;
  }, [userId]);

  const getReviewsForCar = useCallback(
    (carId) => reviewsByCar[carId] || [],
    [reviewsByCar]
  );

  const getMyReviews = useCallback(() => {
    const out = [];
    for (const car of CARS) {
      const list = reviewsByCar[car.id] || [];
      for (const r of list) {
        if (r.userId === userId) out.push({ ...r, car });
      }
    }
    out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return out;
  }, [reviewsByCar, userId]);

  const averageRatingForCar = useCallback(
    (carId) => {
      const list = reviewsByCar[carId] || [];
      if (!list.length) return null;
      const sum = list.reduce((s, r) => s + r.rating, 0);
      return Math.round((sum / list.length) * 10) / 10;
    },
    [reviewsByCar]
  );

  const value = useMemo(
    () => ({
      ready,
      userId,
      cars: CARS,
      getCarById,
      reviewsByCar,
      addReview,
      getReviewsForCar,
      getMyReviews,
      averageRatingForCar,
    }),
    [ready, userId, reviewsByCar, addReview, getReviewsForCar, getMyReviews, averageRatingForCar]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}
