#!/usr/bin/env node
/**
 * Writes EAS project id into the repo so `eas build` / Expo `build:internal` work in CI.
 *
 * Usage (pick one):
 *   EAS_PROJECT_ID=<uuid> node scripts/eas-link-project.js
 *   node scripts/eas-link-project.js <uuid>
 *
 * UUID: https://expo.dev → your project → Project settings → Project ID
 *
 * Delegates to: npx eas-cli init --non-interactive --id <uuid> --force
 */
const { spawnSync } = require('child_process');
const path = require('path');

const id = (process.env.EAS_PROJECT_ID || process.argv[2] || '').trim();
if (!id) {
  console.error(`
Missing EAS project ID.

1. Open https://expo.dev → select this app’s project → Project settings
2. Copy "Project ID" (UUID)
3. Run:

   EAS_PROJECT_ID=<paste-uuid-here> node scripts/eas-link-project.js

Then commit the updated app.json (and push).
`);
  process.exit(1);
}

const root = path.join(__dirname, '..');
const r = spawnSync(
  'npx',
  ['eas-cli@latest', 'init', '--non-interactive', '--id', id, '--force'],
  { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' }
);

if (r.status !== 0) {
  console.error('\neas init failed. Run: npx eas-cli login');
}
process.exit(r.status ?? 1);
