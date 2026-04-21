import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';

export async function shareCarSummary(car, extraMessage) {
  const title =
    car.make || car.model || car.year
      ? `${car.year} ${car.make} ${car.model}`.trim()
      : 'SnapACar';
  const message = extraMessage
    ? `${extraMessage}\n\n${title} — SnapACar`
    : `Check out ${title} on SnapACar`;
  try {
    await Share.share(
      Platform.OS === 'android' ? { message, title: 'SnapACar' } : { message, title: 'SnapACar' }
    );
  } catch (e) {
    if (e?.message !== 'User did not share') console.warn('share', e);
  }
}

export async function sharePhoto(uri) {
  try {
    const can = await Sharing.isAvailableAsync();
    if (!can) {
      await shareCarSummary({ year: '', make: '', model: 'SnapACar photo' }, 'Photo');
      return;
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      dialogTitle: 'Share car photo',
    });
  } catch (e) {
    console.warn('sharePhoto', e);
  }
}
