/**
 * Unit tests for the social service — likes, comments, reports, credits, leaderboard.
 * All Supabase calls are mocked via the makeBuilder / buildSb helpers.
 */

jest.mock('../src/lib/supabase', () => ({ getSupabase: jest.fn() }));

import { getSupabase } from '../src/lib/supabase';
import {
  fetchLikeCount,
  fetchUserHasLiked,
  likePost,
  unlikePost,
  fetchComments,
  addComment,
  deleteComment,
  submitReport,
  fetchCreditLedger,
  fetchLeaderboard,
} from '../src/services/social';

/**
 * A thenable Supabase query builder.
 * Every chaining method returns the same builder, so the entire expression
 * `sb.from(...).select(...).eq(...).order(...)` reduces to the builder itself.
 * When awaited, it resolves to `result`.
 * Explicit terminal methods (maybeSingle, single) also resolve to `result`.
 */
const makeBuilder = (result = { data: null, error: null }) => {
  const b = {};
  ['select', 'eq', 'in', 'order', 'limit', 'insert', 'delete', 'upsert'].forEach((m) => {
    b[m] = jest.fn().mockReturnValue(b);
  });
  b.maybeSingle = jest.fn().mockResolvedValue(result);
  b.single = jest.fn().mockResolvedValue(result);
  // Make thenable so `await builder` resolves to result
  b.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  b.catch = (fn) => Promise.resolve(result).catch(fn);
  return b;
};

/**
 * Build a minimal Supabase client mock.
 * `fromResults` is an ordered list of results for successive `from()` calls.
 */
const buildSb = (...fromResults) => {
  let call = 0;
  const defaults = { data: null, error: null };
  const sb = {
    from: jest.fn(() => makeBuilder(fromResults[call++] ?? defaults)),
    rpc: jest.fn().mockResolvedValue({ error: null }),
  };
  return sb;
};

beforeEach(() => jest.clearAllMocks());

// ─── fetchLikeCount ──────────────────────────────────────────────────────────

describe('fetchLikeCount', () => {
  it('returns 0 when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    expect(await fetchLikeCount('post-1')).toBe(0);
  });

  it('returns 0 when postId is falsy', async () => {
    getSupabase.mockReturnValue(buildSb());
    expect(await fetchLikeCount(null)).toBe(0);
    expect(await fetchLikeCount('')).toBe(0);
  });

  it('returns the count from Supabase', async () => {
    getSupabase.mockReturnValue(buildSb({ count: 7, error: null }));
    expect(await fetchLikeCount('post-1')).toBe(7);
  });

  it('returns 0 on Supabase error', async () => {
    getSupabase.mockReturnValue(buildSb({ count: null, error: { message: 'DB error' } }));
    expect(await fetchLikeCount('post-1')).toBe(0);
  });
});

// ─── fetchUserHasLiked ───────────────────────────────────────────────────────

describe('fetchUserHasLiked', () => {
  it('returns false when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    expect(await fetchUserHasLiked('post-1', 'user-1')).toBe(false);
  });

  it('returns false when postId or uid is missing', async () => {
    getSupabase.mockReturnValue(buildSb());
    expect(await fetchUserHasLiked(null, 'user-1')).toBe(false);
    expect(await fetchUserHasLiked('post-1', null)).toBe(false);
  });

  it('returns true when the user has liked the post', async () => {
    const sb = buildSb({ data: { post_id: 'post-1' } });
    getSupabase.mockReturnValue(sb);
    // maybeSingle is the terminal call for this function
    expect(await fetchUserHasLiked('post-1', 'user-1')).toBe(true);
  });

  it('returns false when the user has not liked the post', async () => {
    const sb = buildSb({ data: null });
    getSupabase.mockReturnValue(sb);
    expect(await fetchUserHasLiked('post-1', 'user-1')).toBe(false);
  });
});

// ─── likePost / unlikePost ───────────────────────────────────────────────────

describe('likePost', () => {
  it('throws when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    await expect(likePost('post-1', 'user-1')).rejects.toThrow(/Not signed in/i);
  });

  it('calls insert with post_id and user_id', async () => {
    const sb = buildSb({ error: null });
    getSupabase.mockReturnValue(sb);

    await likePost('post-1', 'user-1');

    expect(sb.from).toHaveBeenCalledWith('post_likes');
    const b = sb.from.mock.results[0].value;
    expect(b.insert).toHaveBeenCalledWith({ post_id: 'post-1', user_id: 'user-1' });
  });

  it('throws when the insert returns an error', async () => {
    getSupabase.mockReturnValue(buildSb({ error: { message: 'unique violation' } }));
    await expect(likePost('post-1', 'user-1')).rejects.toMatchObject({ message: 'unique violation' });
  });
});

describe('unlikePost', () => {
  it('throws when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    await expect(unlikePost('post-1', 'user-1')).rejects.toThrow(/Not signed in/i);
  });

  it('calls delete targeting post_id and user_id', async () => {
    const sb = buildSb({ error: null });
    getSupabase.mockReturnValue(sb);

    await unlikePost('post-1', 'user-1');

    expect(sb.from).toHaveBeenCalledWith('post_likes');
    const b = sb.from.mock.results[0].value;
    expect(b.delete).toHaveBeenCalled();
    expect(b.eq).toHaveBeenCalledWith('post_id', 'post-1');
    expect(b.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});

// ─── addComment / deleteComment ──────────────────────────────────────────────

describe('addComment', () => {
  it('throws when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    await expect(addComment('post-1', 'user-1', 'hi')).rejects.toThrow(/Not signed in/i);
  });

  it('throws when the comment body is empty', async () => {
    getSupabase.mockReturnValue(buildSb());
    await expect(addComment('post-1', 'user-1', '')).rejects.toThrow(/Write a comment/i);
    await expect(addComment('post-1', 'user-1', '   ')).rejects.toThrow(/Write a comment/i);
  });

  it('inserts the trimmed comment body', async () => {
    const sb = buildSb({ error: null });
    getSupabase.mockReturnValue(sb);

    await addComment('post-1', 'user-1', '  Great car!  ');

    const b = sb.from.mock.results[0].value;
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: 'post-1', user_id: 'user-1', body: 'Great car!' })
    );
  });
});

describe('deleteComment', () => {
  it('throws when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    await expect(deleteComment('comment-1', 'user-1')).rejects.toThrow(/Not signed in/i);
  });

  it('calls delete targeting comment id and user id', async () => {
    const sb = buildSb({ error: null });
    getSupabase.mockReturnValue(sb);

    await deleteComment('comment-1', 'user-1');

    expect(sb.from).toHaveBeenCalledWith('post_comments');
    const b = sb.from.mock.results[0].value;
    expect(b.delete).toHaveBeenCalled();
    expect(b.eq).toHaveBeenCalledWith('id', 'comment-1');
    expect(b.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });
});

// ─── submitReport ────────────────────────────────────────────────────────────

describe('submitReport', () => {
  it('throws when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    await expect(submitReport('post-1', 'user-1', 'spam')).rejects.toThrow(/Not signed in/i);
  });

  it('throws when the reason is empty', async () => {
    getSupabase.mockReturnValue(buildSb());
    await expect(submitReport('post-1', 'user-1', '')).rejects.toThrow(/Pick or enter a reason/i);
    await expect(submitReport('post-1', 'user-1', '  ')).rejects.toThrow(/Pick or enter a reason/i);
  });

  it('maps a duplicate-key error to a friendly message', async () => {
    getSupabase.mockReturnValue(buildSb({ error: { message: 'duplicate key value violates unique constraint' } }));
    await expect(submitReport('post-1', 'user-1', 'spam')).rejects.toThrow(/already reported/i);
  });

  it('inserts the report with a trimmed reason', async () => {
    const sb = buildSb({ error: null });
    getSupabase.mockReturnValue(sb);

    await submitReport('post-1', 'reporter-1', '  off-topic  ');

    const b = sb.from.mock.results[0].value;
    expect(b.insert).toHaveBeenCalledWith(
      expect.objectContaining({ post_id: 'post-1', reporter_id: 'reporter-1', reason: 'off-topic' })
    );
  });
});

// ─── fetchCreditLedger ───────────────────────────────────────────────────────

describe('fetchCreditLedger', () => {
  it('returns empty array when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    expect(await fetchCreditLedger('user-1')).toEqual([]);
  });

  it('returns empty array when uid is falsy', async () => {
    getSupabase.mockReturnValue(buildSb());
    expect(await fetchCreditLedger(null)).toEqual([]);
    expect(await fetchCreditLedger('')).toEqual([]);
  });

  it('returns credit ledger rows ordered by most recent', async () => {
    const rows = [
      { id: '1', delta: 10, reason: 'post_created', balance_after: 10, created_at: '2025-01-02T00:00:00Z' },
      { id: '2', delta: 5,  reason: 'post_liked',   balance_after: 15, created_at: '2025-01-01T00:00:00Z' },
    ];
    getSupabase.mockReturnValue(buildSb({ data: rows, error: null }));

    const result = await fetchCreditLedger('user-1', 50);

    expect(result).toEqual(rows);
  });

  it('returns empty array on query error', async () => {
    getSupabase.mockReturnValue(buildSb({ data: null, error: { message: 'RLS' } }));
    expect(await fetchCreditLedger('user-1')).toEqual([]);
  });

  it('respects the limit parameter', async () => {
    const sb = buildSb({ data: [], error: null });
    getSupabase.mockReturnValue(sb);

    await fetchCreditLedger('user-1', 10);

    const b = sb.from.mock.results[0].value;
    expect(b.limit).toHaveBeenCalledWith(10);
  });

  it('filters by user_id', async () => {
    const sb = buildSb({ data: [], error: null });
    getSupabase.mockReturnValue(sb);

    await fetchCreditLedger('user-abc');

    const b = sb.from.mock.results[0].value;
    expect(b.eq).toHaveBeenCalledWith('user_id', 'user-abc');
  });
});

// ─── fetchLeaderboard ────────────────────────────────────────────────────────

describe('fetchLeaderboard', () => {
  it('returns empty array when Supabase is null', async () => {
    getSupabase.mockReturnValue(null);
    expect(await fetchLeaderboard()).toEqual([]);
  });

  it('returns empty array when query returns no rows', async () => {
    getSupabase.mockReturnValue(buildSb({ data: [], error: null }));
    expect(await fetchLeaderboard()).toEqual([]);
  });

  it('joins leaderboard rows with display names from profiles', async () => {
    const rows = [
      { rank: 1, score: 100, user_id: 'uid-1', lifetime_posts_snapshot: 5, updated_at: '' },
      { rank: 2, score: 80,  user_id: 'uid-2', lifetime_posts_snapshot: 4, updated_at: '' },
    ];
    const profiles = [
      { id: 'uid-1', full_name: 'Alice' },
      { id: 'uid-2', full_name: 'Bob' },
    ];
    // First from() → leaderboard_cache rows; second from() → profiles
    getSupabase.mockReturnValue(
      buildSb({ data: rows, error: null }, { data: profiles })
    );

    const result = await fetchLeaderboard('all_time');

    expect(result[0]).toMatchObject({ rank: 1, score: 100, displayName: 'Alice' });
    expect(result[1]).toMatchObject({ rank: 2, score: 80,  displayName: 'Bob' });
  });

  it('falls back to "Driver" when a profile name is missing', async () => {
    const rows = [{ rank: 1, score: 50, user_id: 'uid-x', lifetime_posts_snapshot: 1, updated_at: '' }];
    getSupabase.mockReturnValue(buildSb({ data: rows, error: null }, { data: [] }));

    const result = await fetchLeaderboard();

    expect(result[0].displayName).toBe('Driver');
  });

  it('returns empty array on query error', async () => {
    getSupabase.mockReturnValue(buildSb({ data: null, error: { message: 'fail' } }));
    expect(await fetchLeaderboard()).toEqual([]);
  });
});
