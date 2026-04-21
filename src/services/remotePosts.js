import { getSupabase } from '../lib/supabase';
import { makeCarKey } from '../utils/carKey';
import { normalizePlate } from '../utils/plate';

const BUCKET = 'car-images';

export async function uploadCarImage(localUri, userId, postId) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const path = `${userId}/${postId}.jpg`;
  const res = await fetch(localUri);
  const blob = await res.blob();
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
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
  const { data: prof } = await sb.from('profiles').select('full_name').eq('id', userId).maybeSingle();
  const authorName = prof?.full_name || 'Driver';

  const { data, error } = await sb
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
  if (error) throw error;
  return data;
}

export async function fetchAllPosts() {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('posts')
    .select(
      'id, user_id, car_key, make, model, year, license_plate, plate_normalized, image_url, rating, comment, created_at, author_name'
    )
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('fetchAllPosts', error);
    return [];
  }
  return data ?? [];
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
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) return null;
  return data;
}

export async function upsertProfile(userId, fields) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { error } = await sb.from('profiles').upsert(
    {
      id: userId,
      ...fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}
