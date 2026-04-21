import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { StarRow } from './StarRow';

export function ReviewCard({ review }) {
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
          <StarRow value={review.rating} readonly size={22} />
          <Text style={styles.date}>{date}</Text>
        </View>
        {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: 180, backgroundColor: colors.bg },
  pad: { padding: 12 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  date: { fontSize: 12, color: colors.textMuted },
  comment: { marginTop: 8, fontSize: 15, color: colors.text, lineHeight: 22 },
});
