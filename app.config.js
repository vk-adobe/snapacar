/* eslint-env node */
// Load .env when present (install: npm i -D dotenv) — optional; Expo also injects EXPO_PUBLIC_* at start.
try {
  // eslint-disable-next-line global-require
  require('dotenv/config');
} catch {
  /* dotenv optional */
}

const appJson = require('./app.json');

const baseExtra = appJson.expo?.extra || {};

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    scheme: 'snapacar',
    extra: {
      ...baseExtra,
      eas: {
        ...baseExtra.eas,
        ...(process.env.EAS_PROJECT_ID
          ? { projectId: process.env.EAS_PROJECT_ID }
          : {}),
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || baseExtra.supabaseUrl || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || baseExtra.supabaseAnonKey || '',
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || baseExtra.googleWebClientId || '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || baseExtra.googleIosClientId || '',
      googleAndroidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || baseExtra.googleAndroidClientId || '',
    },
  },
};
