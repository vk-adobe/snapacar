import * as FileSystem from 'expo-file-system/legacy';
import { getSupabase } from '../lib/supabase';
import { makeCarKey } from '../utils/carKey';
import { normalizePlate } from '../utils/plate';
import { withTimeout } from '../utils/asyncTimeout';

const BUCKET = 'car-images';
const UPLOAD_FETCH_MS = 45000;
const DB_MS = 30000;

/** Base64 file read → ArrayBuffer (Supabase RN: Blob bodies often yield "Network request failed"). */
async function arrayBufferFromFileSystem(localUri) {
  const b64 = await withTimeout(
    FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    }),
    UPLOAD_FETCH_MS,
    'Reading photo for upload'
  );
  const clean = b64.replace(/\s/g, '');
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Image bytes for storage upload. Prefer filesystem base64 (reliable for content:// on Android);
 * avoid Blob — React Native fetch + Blob is not supported for Supabase storage uploads.
 * @see https://github.com/supabase/supabase-js/blob/master/packages/storage-js/src/packages/StorageFileApi.ts
 */
async function arrayBufferFromUri(localUri) {
  if (
    localUri &&
    (localUri.startsWith('file:') ||
      localUri.startsWith('content:') ||
      localUri.startsWith('ph:') ||
      localUri.startsWith('asset'))
  ) {
    try {
      return await arrayBufferFromFileSystem(localUri);
    } catch {
      /* fall through to fetch */
    }
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPLOAD_FETCH_MS);
  try {
    const res = await fetch(localUri, { signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`Could not read image (${res.status})`);
    }
    const blob = await withTimeout(res.blob(), 30000, 'Decode image');
    if (typeof blob.arrayBuffer === 'function') {
      return await blob.arrayBuffer();
    }
  } catch {
    /* use filesystem */
  } finally {
    clearTimeout(timer);
  }
  return arrayBufferFromFileSystem(localUri);
}

export async function uploadCarImage(localUri, userId, postId) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const path = `${userId}/${postId}.jpg`;
  const body = await arrayBufferFromUri(localUri);

  const uploadPromise = sb.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  let uploadResult;
  try {
    uploadResult = await withTimeout(uploadPromise, UPLOAD_FETCH_MS, 'Upload to storage');
  } catch (e) {
    const m = e?.message || String(e);
    if (/network request failed|failed to fetch|load failed/i.test(m)) {
      throw new Error(
        'Photo upload could not reach Supabase. Check Wi‑Fi, VPN/firewall, and EXPO_PUBLIC_SUPABASE_URL. On React Native, large uploads used to fail with Blobs — this build uses ArrayBuffer; reload the app and try again.'
      );
    }
    throw e;
  }
  const error = uploadResult?.error;

  if (error) {
    const m = error.message || '';
    if (/bucket|not\s*found|404/i.test(m)) {
      throw new Error(
        `Storage bucket "${BUCKET}" is missing. In Supabase → Storage, create a public bucket named "${BUCKET}" and add upload policies (see README).`
      );
    }
    throw error;
  }

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

function formatInsertError(error) {
  const msg = error?.message || String(error);
  const code = error?.code;
  if (code === '42P01' || /relation.*does not exist/i.test(msg)) {
    return new Error(
      'Database tables are missing. In Supabase → SQL Editor, run the full script from supabase/migrations/001_snapacar.sql, then try again.'
    );
  }
  if (code === '42501' || /row-level security|RLS/i.test(msg)) {
    return new Error(
      'Permission denied (RLS). Check policies on `posts` in Supabase → Authentication → Policies.'
    );
  }
  if (code === '23503' || /foreign key|violates foreign key constraint/i.test(msg)) {
    return new Error(
      'Your account profile is missing in the database. Sign out and sign back in — this recreates your profile row automatically.'
    );
  }
  return error;
}

export async function insertPost({
  userId,
  make,
  model,
  year,
  licensePlate,
  rating,
  comment,
  imageUrl,
}) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const car_key = makeCarKey(make, model, year);
  const plate_normalized = licensePlate ? normalizePlate(licensePlate) : '';

  // Ensure the profile row exists — the posts FK requires it.
  // The handle_new_user trigger normally creates it, but can miss if the trigger
  // wasn't installed yet when the account was first created.
  await withTimeout(
    sb.from('profiles').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true }),
    DB_MS,
    'Ensure profile'
  ).catch(() => {}); // non-fatal: insert will surface the error if profile truly can't be created

  const profResult = await withTimeout(
    sb.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    DB_MS,
    'Load profile'
  );
  const authorName = profResult?.data?.full_name || 'Driver';

  const insertPromise = sb
    .from('posts')
    .insert({
      user_id: userId,
      car_key,
      make: make.trim(),
      model: model.trim(),
      year: String(year ?? '').trim(),
      license_plate: (licensePlate || '').trim(),
      plate_normalized,
      image_url: imageUrl,
      rating,
      comment: (comment || '').trim(),
      author_name: authorName,
    })
    .select('id')
    .single();

  const insertResult = await withTimeout(insertPromise, DB_MS, 'Save post');
  if (insertResult?.error) throw formatInsertError(insertResult.error);
  return insertResult?.data;
}

export async function fetchAllPosts() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const result = await withTimeout(
      sb
        .from('posts')
        .select(
          'id, user_id, car_key, make, model, year, license_plate, plate_normalized, image_url, rating, comment, created_at, author_name'
        )
        .order('created_at', { ascending: false }),
      DB_MS,
      'Load feed'
    );
    if (result.error) {
      console.warn('fetchAllPosts', result.error);
      return [];
    }
    return result.data ?? [];
  } catch (e) {
    console.warn('fetchAllPosts', e);
    return [];
  }
}

export async function fetchPostsByCarKey(carKey) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('posts')
    .select(
      'id, user_id, car_key, make, model, year, license_plate, image_url, rating, comment, created_at, author_name'
    )
    .eq('car_key', carKey)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchPostsByPlateNormalized(norm) {
  const sb = getSupabase();
  if (!sb) return [];
  if (!norm) return [];
  const { data, error } = await sb
    .from('posts')
    .select(
      'id, user_id, car_key, make, model, year, license_plate, image_url, rating, comment, created_at, author_name'
    )
    .eq('plate_normalized', norm)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchMyPosts(userId) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchProfile(userId) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const result = await withTimeout(
      sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
      DB_MS,
      'Fetch profile'
    );
    if (result.error) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function upsertProfile(userId, fields) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const result = await withTimeout(
    sb.from('profiles').upsert(
      { id: userId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    ),
    DB_MS,
    'Save profile'
  );
  if (result?.error) throw result.error;
}
