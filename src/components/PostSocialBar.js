import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addComment,
  deleteComment,
  fetchComments,
  fetchLikeCount,
  fetchUserHasLiked,
  likePost,
  submitReport,
  unlikePost,
} from '../services/social';
import { colors, radius } from '../theme';

const REPORT_REASONS = ['Spam or junk', 'Unsafe / harassment', 'Wrong car / misleading', 'Other'];

export function PostSocialBar({
  postId,
  currentUserId,
  postAuthorId,
  enabled,
}) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!postId || !enabled || !currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [n, has, list] = await Promise.all([
        fetchLikeCount(postId),
        fetchUserHasLiked(postId, currentUserId),
        fetchComments(postId),
      ]);
      setLikes(n);
      setLiked(has);
      setComments(list);
    } finally {
      setLoading(false);
    }
  }, [postId, currentUserId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const onLike = async () => {
    if (!postId || !currentUserId || busy) return;
    setBusy(true);
    try {
      if (liked) {
        await unlikePost(postId, currentUserId);
        setLiked(false);
        setLikes((x) => Math.max(0, x - 1));
      } else {
        await likePost(postId, currentUserId);
        setLiked(true);
        setLikes((x) => x + 1);
      }
    } catch (e) {
      Alert.alert('Like', e.message || 'Could not update like.');
    } finally {
      setBusy(false);
    }
  };

  const onSendComment = async () => {
    if (!postId || !currentUserId || busy) return;
    setBusy(true);
    try {
      await addComment(postId, currentUserId, draft);
      setDraft('');
      await load();
    } catch (e) {
      Alert.alert('Comment', e.message || 'Could not post.');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteComment = (c) => {
    if (!currentUserId || c.user_id !== currentUserId) return;
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(c.id, currentUserId);
            await load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const onReport = () => {
    if (!postId || !currentUserId || postAuthorId === currentUserId) return;
    Alert.alert('Report this spot', 'Why are you reporting?', [
      ...REPORT_REASONS.map((label) => ({
        text: label,
        onPress: () => doReport(label),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const doReport = async (reason) => {
    try {
      await submitReport(postId, currentUserId, reason);
      Alert.alert('Thanks', 'We recorded your report.');
    } catch (e) {
      Alert.alert('Report', e.message || 'Could not send.');
    }
  };

  if (!enabled || !postId) return null;

  const canReport = postAuthorId && currentUserId && postAuthorId !== currentUserId;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : (
          <>
            <Pressable
              onPress={onLike}
              disabled={busy}
              style={({ pressed }) => [styles.pill, styles.pillGap, pressed && { opacity: 0.85 }]}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={18}
                color={liked ? colors.primary : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.pillText}>{likes}</Text>
            </Pressable>
            <Pressable
              onPress={() => setOpen((o) => !o)}
              style={({ pressed }) => [styles.pill, styles.pillGap, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="chatbubble-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.pillText}>{comments.length}</Text>
            </Pressable>
            {canReport ? (
              <Pressable onPress={onReport} style={styles.report}>
                <Text style={styles.reportText}>Report</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      {open ? (
        <View style={styles.commentsBlock}>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cAuthor}>{c.authorName}</Text>
                <Text style={styles.cBody}>{c.body}</Text>
              </View>
              {c.user_id === currentUserId ? (
                <Pressable onPress={() => onDeleteComment(c)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={onSendComment}
            disabled={busy || !draft.trim()}
            style={({ pressed }) => [
              styles.send,
              pressed && { opacity: 0.9 },
              (!draft.trim() || busy) && { opacity: 0.45 },
            ]}
          >
            <Text style={styles.sendText}>Post comment</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  pillGap: { marginRight: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  report: { marginLeft: 'auto', paddingVertical: 8, paddingHorizontal: 4 },
  reportText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  commentsBlock: { marginTop: 12 },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cAuthor: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 4 },
  cBody: { fontSize: 14, color: colors.text, lineHeight: 20 },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 44,
    color: colors.text,
    fontSize: 14,
    marginTop: 6,
  },
  send: {
    alignSelf: 'flex-end',
    marginTop: 8,
    backgroundColor: colors.accentDim,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  sendText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
});
