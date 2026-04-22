import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PostSocialBar } from './PostSocialBar';
import { colors, radius } from '../theme';
import { StarRow } from './StarRow';

export function ReviewCard({ review, social }) {
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <View style={styles.wrap}>
      {review.photoUri ? (
        <Image source={{ uri: review.photoUri }} style={styles.photo} resizeMode="cover" />
      ) : null}
      <View style={styles.pad}>
        <View style={styles.head}>
          <View style={styles.leftMeta}>
            {review.authorName ? (
              <Text style={styles.author}>{review.authorName}</Text>
            ) : null}
            <StarRow value={review.rating} readonly size={20} />
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>
        {review.licensePlate ? (
          <Text style={styles.plate}>Plate · {review.licensePlate}</Text>
        ) : null}
        {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
        {social?.enabled && review.id ? (
          <PostSocialBar
            postId={review.id}
            currentUserId={social.currentUserId}
            postAuthorId={review.userId}
            enabled={social.enabled}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 180, backgroundColor: colors.bgElevated },
  pad: { padding: 14 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  leftMeta: { flex: 1, marginRight: 8 },
  author: { fontSize: 13, fontWeight: '600', color: colors.accent, marginBottom: 6 },
  date: { fontSize: 12, color: colors.textMuted },
  plate: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  comment: { marginTop: 8, fontSize: 15, color: colors.text, lineHeight: 22 },
});
