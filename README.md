# SnapACar

Expo (React Native) app for sharing car photos and ratings: feed, capture, plate search, profile with credits, and Supabase-backed auth and storage. Uses a dark UI and optional Google sign-in.

## Requirements

- Node.js 18+ (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo` works without a global install)
- For device testing: [Expo Go](https://expo.dev/go) or a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your Supabase URL and anon key, and Google OAuth client IDs as needed. Restart the Metro bundler after any `.env` change so `app.config.js` picks up `EXPO_PUBLIC_*` values.

### Supabase

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Run the SQL in `supabase/migrations/001_snapacar.sql` (SQL editor or [Supabase CLI](https://supabase.com/docs/guides/cli) migrations).
3. **Storage:** create a public bucket named `car-images`, with policies so authenticated users can upload and the public can read (see comments at the bottom of that migration).
4. **Auth:** enable the providers you use (e.g. Email and Google). For Google, configure OAuth client IDs in Google Cloud Console and in Supabase; match redirect URIs and (for Android) package + SHA per Expo/Android docs.

### Optional: car image analysis (Edge Function)

`supabase/functions/analyze-car-image/` is a template for server-side vision/OCR. Deploy it with the Supabase CLI and set the required secrets; wire the app to your deployed endpoint if you use it.

## Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run start:clear` | Start with Metro cache cleared (`expo start -c`) |
| `npm run android` | Build and run Android (dev client / emulator) |
| `npm run ios` | Build and run iOS (macOS + Xcode) |
| `npm run web` | Run in the browser |

## Development notes

- **Updates:** Expo Updates OTA is disabled in `app.json` (`updates.enabled: false`). You get new JavaScript from Metro while developing, or by rebuilding/reinstalling release builds—not from Expo’s update servers.
- **Native changes:** If you change plugins, permissions, or other native config, run `npx expo prebuild` as needed and `npx expo run:android` / `run:ios` again. Expo Go only includes Expo’s prebuilt native modules.
- **Scheme:** App URL scheme is `snapacar` (see `app.config.js`).

## Project layout

- `App.js` — root component
- `src/navigation/` — stack and tab navigators
- `src/screens/` — feed, capture, plate search, profile, auth
- `src/context/` — `AuthContext`, `AppContext` (remote posts + local fallback)
- `src/lib/supabase.js` — Supabase client
- `src/services/` — remote posts, optional car analysis
- `supabase/` — SQL migrations and Edge Function sources

## License

Private (see `package.json`).
