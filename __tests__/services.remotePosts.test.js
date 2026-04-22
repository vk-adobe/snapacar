/**
 * Tests for remotePosts service — insertPost, fetchAllPosts, fetchPostsByCarKey.
 * All Supabase calls are mocked.
 */

jest.mock('../src/lib/supabase', () => ({ getSupabase: jest.fn() }));
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  EncodingType: { Base64: 'base64' },
}));
jest.mock('../src/utils/asyncTimeout', () => ({
  withTimeout: jest.fn((promise) => promise),
}));

import { getSupabase } from '../src/lib/supabase';
import {
  fetchAllPosts,
  fetchPostsByCarKey,
  insertPost,
} from '../src/services/remotePosts';

const buildSb = (overrides = {}) => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockResolvedValue({ error: null }),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: { full_name: 'Test Driver' } }),
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/img.jpg' } }),
  },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('fetchAllPosts', () => {
  it('returns empty array when Supabase is not configured', async () => {
    getSupabase.mockReturnValue(null);
    expect(await fetchAllPosts()).toEqual([]);
  });

  it('returns posts from Supabase on success', async () => {
    const posts = [
      { id: '1', car_key: 'toyota::supra::2023', make: 'Toyota', model: 'Supra', year: '2023', rating: 5 },
    ];
    const sb = buildSb();
    sb.order.mockResolvedValue({ data: posts, error: null });
    getSupabase.mockReturnValue(sb);

    const result = await fetchAllPosts();
    expect(result).toEqual(posts);
  });

  it('returns empty array on Supabase query error', async () => {
    const sb = buildSb();
    sb.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    getSupabase.mockReturnValue(sb);

    expect(await fetchAllPosts()).toEqual([]);
  });

  it('returns empty array when fetch throws', async () => {
    const sb = buildSb();
    sb.order.mockRejectedValue(new Error('Network failure'));
    getSupabase.mockReturnValue(sb);

    expect(await fetchAllPosts()).toEqual([]);
  });
});

describe('fetchPostsByCarKey', () => {
  it('returns empty array when Supabase is not configured', async () => {
    getSupabase.mockReturnValue(null);
    expect(await fetchPostsByCarKey('toyota::supra::2023')).toEqual([]);
  });

  it('returns filtered posts for the given car key', async () => {
    const posts = [{ id: '2', car_key: 'toyota::supra::2023', rating: 4 }];
    const sb = buildSb();
    sb.order.mockResolvedValue({ data: posts, error: null });
    getSupabase.mockReturnValue(sb);

    const result = await fetchPostsByCarKey('toyota::supra::2023');
    expect(result).toEqual(posts);
  });

  it('returns empty array on error', async () => {
    const sb = buildSb();
    sb.order.mockResolvedValue({ data: null, error: { message: 'RLS' } });
    getSupabase.mockReturnValue(sb);

    expect(await fetchPostsByCarKey('some::key::2020')).toEqual([]);
  });
});

describe('insertPost', () => {
  it('throws when Supabase is not configured', async () => {
    getSupabase.mockReturnValue(null);
    await expect(
      insertPost({ userId: 'u1', make: 'BMW', model: 'M3', year: '2022', licensePlate: '', rating: 5, comment: '', imageUrl: null })
    ).rejects.toThrow(/Supabase not configured/);
  });

  it('throws a human-readable error when the posts table is missing', async () => {
    const sb = buildSb();
    sb.single.mockResolvedValue({ data: null, error: { message: "relation 'posts' does not exist", code: '42P01' } });
    getSupabase.mockReturnValue(sb);

    await expect(
      insertPost({ userId: 'u1', make: 'BMW', model: 'M3', year: '2022', licensePlate: '', rating: 5, comment: '', imageUrl: null })
    ).rejects.toThrow(/migration/i);
  });

  it('throws a human-readable error on RLS policy violation', async () => {
    const sb = buildSb();
    sb.single.mockResolvedValue({ data: null, error: { message: 'row-level security policy', code: '42501' } });
    getSupabase.mockReturnValue(sb);

    await expect(
      insertPost({ userId: 'u1', make: 'BMW', model: 'M3', year: '2022', licensePlate: '', rating: 5, comment: '', imageUrl: null })
    ).rejects.toThrow(/RLS|Permission denied/i);
  });

  it('returns inserted post data on success', async () => {
    const sb = buildSb();
    sb.single.mockResolvedValue({ data: { id: 'new-post-id' }, error: null });
    getSupabase.mockReturnValue(sb);

    const result = await insertPost({
      userId: 'u1',
      make: 'Toyota',
      model: 'Supra',
      year: '2023',
      licensePlate: 'MH12AB1234',
      rating: 5,
      comment: 'Amazing car!',
      imageUrl: 'https://cdn.example.com/img.jpg',
    });

    expect(result).toEqual({ id: 'new-post-id' });
  });
});
