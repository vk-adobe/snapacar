import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/** Uses app icon — same asset as native launcher icon. */
export function AppLogo({ size = 72, style }) {
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: size, height: size }}
        resizeMode="cover"
        accessibilityLabel="SnapACar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
});
