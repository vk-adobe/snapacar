import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { makeCarKey, parseCarKey } from '../utils/carKey';
import { fetchAllPosts, fetchPostsByCarKey, insertPost, uploadCarImage } from '../services/remotePosts';

const STORAGE_KEY = '@snapacar_reviews_v3';

function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

const AppContext = createContext(null);

function groupPostsToSummaries(posts) {
  const byKey = {};
  for (const p of posts) {
    const k = p.car_key;
    if (!byKey[k]) byKey[k] = [];
    byKey[k].push(p);
  }
  const out = Object.keys(byKey).map((carKey) => {
    const list = byKey[carKey];
    const last = list.reduce((a, b) =>
      new Date(b.created_at) > new Date(a.created_at) ? b : a
    );
    const sum = list.reduce((s, r) => s + r.rating, 0);
    const withImg = list.find((x) => x.image_url);
    return {
      carKey,
      make: list[0].make,
      model: list[0].model,
      year: list[0].year,
      reviewCount: list.length,
      avgRating: Math.round((sum / list.length) * 10) / 10,
      lastAt: last.created_at,
      previewUrl: withImg?.image_url ?? null,
    };
  });
  out.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  return out;
}

function mapRemotePostToReview(p) {
  return {
    id: p.id,
    carKey: p.car_key,
    make: p.make,
    model: p.model,
    year: p.year,
    userId: p.user_id,
    rating: p.rating,
    comment: p.comment,
    photoUri: p.image_url,
    createdAt: p.created_at,
    authorName: p.author_name || 'Driver',
    licensePlate: p.license_plate,
  };
}

export function AppProvider({ children }) {
  const { session, refreshProfile } = useAuth();
  const userId = session?.userId ?? null;
  const isCloud = session?.mode === 'cloud';

  const [storageReady, setStorageReady] = useState(false);
  const [reviewsByKey, setReviewsByKey] = useState({});
  const [remotePosts, setRemotePosts] = useState([]);
  const [feedVersion, setFeedVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') setReviewsByKey(parsed);
        }
      } catch (e) {
        console.warn('AppContext load', e);
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshRemoteFeed = useCallback(async () => {
    if (!isCloud) return;
    const rows = await fetchAllPosts();
    setRemotePosts(rows);
    setFeedVersion((v) => v + 1);
  }, [isCloud]);

  useEffect(() => {
    if (isCloud && userId) {
      refreshRemoteFeed();
    }
  }, [isCloud, userId, refreshRemoteFeed]);

  const addReview = useCallback(
    async ({ make, model, year, rating, comment, photoUri, licensePlate }) => {
      const mk = make.trim();
      const md = model.trim();
      if (!mk || !md) {
        throw new Error('Make and model are required.');
      }
      const carKey = makeCarKey(mk, md, year);
      const yStr = String(year ?? '').trim();

      if (isCloud && session?.userId) {
        const fileKey = `${Date.now()}_${randomId()}`;
        let imageUrl = null;
        if (photoUri) {
          imageUrl = await uploadCarImage(photoUri, session.userId, fileKey);
        }
        await insertPost({
          userId: session.userId,
          make: mk,
          model: md,
          year: yStr,
          licensePlate: licensePlate || '',
          rating,
          comment,
          imageUrl,
        });
        await refreshRemoteFeed();
        await refreshProfile?.();
        return { carKey };
      }

      const reviewId = uuidish();
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
        carKey,
        make: mk,
        model: md,
        year: yStr,
        userId,
        rating,
        comment: (comment || '').trim(),
        photoUri: storedPhotoUri || null,
        licensePlate: (licensePlate || '').trim(),
        createdAt: new Date().toISOString(),
      };

      setReviewsByKey((prev) => {
        const next = {
          ...prev,
          [carKey]: [...(prev[carKey] || []), review],
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
          console.warn('AppContext persist', e)
        );
        return next;
      });
      return review;
    },
    [isCloud, session, userId, refreshRemoteFeed, refreshProfile]
  );

  const getReviewsForCarKey = useCallback(
    (carKey) => {
      if (isCloud) {
        return remotePosts
          .filter((p) => p.car_key === carKey)
          .map(mapRemotePostToReview)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return reviewsByKey[carKey] || [];
    },
    [isCloud, remotePosts, reviewsByKey]
  );

  const getCarSummaries = useCallback(() => {
    if (isCloud) {
      return groupPostsToSummaries(remotePosts);
    }
    const keys = Object.keys(reviewsByKey);
    const out = keys.map((carKey) => {
      const list = reviewsByKey[carKey] || [];
      const meta = list[0]
        ? { make: list[0].make, model: list[0].model, year: list[0].year }
        : parseCarKey(carKey);
      const last = list.reduce((a, b) =>
        new Date(b.createdAt) > new Date(a.createdAt) ? b : a
      );
      const sum = list.reduce((s, r) => s + r.rating, 0);
      const avg = list.length ? Math.round((sum / list.length) * 10) / 10 : null;
      const img = list.find((r) => r.photoUri);
      return {
        carKey,
        ...meta,
        reviewCount: list.length,
        avgRating: avg,
        lastAt: last?.createdAt,
        previewUrl: img?.photoUri ?? null,
      };
    });
    out.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    return out;
  }, [isCloud, remotePosts, reviewsByKey]);

  const filterSummaries = useCallback(
    (query) => {
      const q = query.trim().toLowerCase();
      let rows = getCarSummaries();
      if (q) {
        rows = rows.filter((r) =>
          `${r.make} ${r.model} ${r.year}`.toLowerCase().includes(q)
        );
      }
      return rows;
    },
    [getCarSummaries]
  );

  const getMyReviews = useCallback(() => {
    if (isCloud && userId) {
      return remotePosts
        .filter((p) => p.user_id === userId)
        .map((p) => ({
          ...mapRemotePostToReview(p),
          car: {
            make: p.make,
            model: p.model,
            year: p.year,
            carKey: p.car_key,
          },
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (!userId) return [];
    const out = [];
    for (const list of Object.values(reviewsByKey)) {
      for (const r of list) {
        if (r.userId === userId) {
          out.push({
            ...r,
            car: { make: r.make, model: r.model, year: r.year, carKey: r.carKey },
          });
        }
      }
    }
    out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return out;
  }, [isCloud, userId, remotePosts, reviewsByKey]);

  const averageRatingForCarKey = useCallback(
    (carKey) => {
      if (isCloud) {
        const list = remotePosts.filter((p) => p.car_key === carKey);
        if (!list.length) return null;
        const sum = list.reduce((s, r) => s + r.rating, 0);
        return Math.round((sum / list.length) * 10) / 10;
      }
      const list = reviewsByKey[carKey] || [];
      if (!list.length) return null;
      const sum = list.reduce((s, r) => s + r.rating, 0);
      return Math.round((sum / list.length) * 10) / 10;
    },
    [isCloud, remotePosts, reviewsByKey]
  );

  const prefetchCarDetail = useCallback(
    async (carKey) => {
      if (!isCloud) return;
      const fresh = await fetchPostsByCarKey(carKey);
      setRemotePosts((prev) => {
        const others = prev.filter((p) => p.car_key !== carKey);
        return [...others, ...fresh];
      });
    },
    [isCloud]
  );

  const value = useMemo(
    () => ({
      ready: storageReady,
      isCloud,
      reviewsByKey,
      remotePosts,
      feedVersion,
      addReview,
      getReviewsForCarKey,
      getCarSummaries,
      filterSummaries,
      getMyReviews,
      averageRatingForCarKey,
      refreshRemoteFeed,
      prefetchCarDetail,
    }),
    [
      storageReady,
      isCloud,
      reviewsByKey,
      remotePosts,
      feedVersion,
      addReview,
      getReviewsForCarKey,
      getCarSummaries,
      filterSummaries,
      getMyReviews,
      averageRatingForCarKey,
      refreshRemoteFeed,
      prefetchCarDetail,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}
