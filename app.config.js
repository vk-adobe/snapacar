/* eslint-env node */
// Load .env when present (install: npm i -D dotenv) — optional; Expo also injects EXPO_PUBLIC_* at start.
try {
  // eslint-disable-next-line global-require
  require('dotenv/config');
} catch {
  /* dotenv optional */
}

const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    scheme: 'snapacar',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    },
  },
};
