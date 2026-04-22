import { getSupabase } from '../lib/supabase';

export async function fetchLikeCount(postId) {
  const sb = getSupabase();
  if (!sb || !postId) return 0;
  const { count, error } = await sb
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (error) return 0;
  return count ?? 0;
}

export async function fetchUserHasLiked(postId, uid) {
  const sb = getSupabase();
  if (!sb || !postId || !uid) return false;
  const { data } = await sb
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', uid)
    .maybeSingle();
  return !!data?.post_id;
}

export async function likePost(postId, uid) {
  const sb = getSupabase();
  if (!sb) throw new Error('Not signed in');
  const { error } = await sb.from('post_likes').insert({ post_id: postId, user_id: uid });
  if (error) throw error;
}

export async function unlikePost(postId, uid) {
  const sb = getSupabase();
  if (!sb) throw new Error('Not signed in');
  const { error } = await sb
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', uid);
  if (error) throw error;
}

export async function fetchComments(postId) {
  const sb = getSupabase();
  if (!sb || !postId) return [];
  const { data, error } = await sb
    .from('post_comments')
    .select('id, body, user_id, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) {
    console.warn('fetchComments', error);
    return [];
  }
  const rows = data ?? [];
  if (!rows.length) return rows;
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', ids);
  const names = {};
  (profs ?? []).forEach((p) => {
    names[p.id] = p.full_name || 'Driver';
  });
  return rows.map((r) => ({ ...r, authorName: names[r.user_id] || 'Driver' }));
}

export async function addComment(postId, uid, body) {
  const sb = getSupabase();
  if (!sb) throw new Error('Not signed in');
  const trimmed = (body || '').trim();
  if (!trimmed) throw new Error('Write a comment first.');
  const { error } = await sb.from('post_comments').insert({
    post_id: postId,
    user_id: uid,
    body: trimmed,
  });
  if (error) throw error;
}

export async function deleteComment(commentId, uid) {
  const sb = getSupabase();
  if (!sb) throw new Error('Not signed in');
  const { error } = await sb.from('post_comments').delete().eq('id', commentId).eq('user_id', uid);
  if (error) throw error;
}

export async function submitReport(postId, reporterId, reason) {
  const sb = getSupabase();
  if (!sb) throw new Error('Not signed in');
  const r = (reason || '').trim();
  if (!r) throw new Error('Pick or enter a reason.');
  const { error } = await sb.from('post_reports').insert({
    post_id: postId,
    reporter_id: reporterId,
    reason: r,
  });
  if (error) {
    if (/duplicate|unique|already exists/i.test(error.message)) {
      throw new Error('You already reported this post.');
    }
    throw error;
  }
}

export async function fetchCreditLedger(uid, limit = 50) {
  const sb = getSupabase();
  if (!sb || !uid) return [];
  const { data, error } = await sb
    .from('credit_ledger')
    .select('id, delta, reason, ref_post_id, balance_after, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('fetchCreditLedger', error);
    return [];
  }
  return data ?? [];
}

export async function fetchLeaderboard(scope = 'all_time') {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('leaderboard_cache')
    .select('rank, score, lifetime_posts_snapshot, user_id, updated_at')
    .eq('scope', scope)
    .order('rank', { ascending: true })
    .limit(100);
  if (error) {
    console.warn('fetchLeaderboard', error);
    return [];
  }
  const rows = data ?? [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.user_id);
  const { data: profs } = await sb.from('profiles').select('id, full_name').in('id', ids);
  const names = {};
  (profs ?? []).forEach((p) => {
    names[p.id] = p.full_name || 'Driver';
  });
  return rows.map((r) => ({ ...r, displayName: names[r.user_id] || 'Driver' }));
}

export async function refreshLeaderboardCache(scope = 'all_time') {
  const sb = getSupabase();
  if (!sb) throw new Error('Not signed in');
  const { error } = await sb.rpc('refresh_leaderboard_cache', { p_scope: scope });
  if (error) throw error;
}
