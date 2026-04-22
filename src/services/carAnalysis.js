import * as FileSystem from 'expo-file-system/legacy';
import { getSupabase } from '../lib/supabase';
import { normalizePlate } from '../utils/plate';
import { withTimeout } from '../utils/asyncTimeout';

const READ_FILE_MS = 15000;
const INVOKE_MS = 15000;
// Base64 chars per byte is 4/3 — keep total payload well under Supabase's 6 MB function limit
const MAX_BASE64_CHARS = 1_500_000; // ~1.1 MB image

function normalizeImageBase64(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  const dataIdx = trimmed.indexOf('base64,');
  if (dataIdx !== -1) {
    return trimmed.slice(dataIdx + 'base64,'.length).replace(/\s/g, '');
  }
  return trimmed.replace(/\s/g, '');
}

async function uriToBase64(localUri) {
  if (!localUri) return '';
  if (localUri.startsWith('data:')) {
    return normalizeImageBase64(localUri);
  }
  const base64 = await withTimeout(
    FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    }),
    READ_FILE_MS,
    'Reading photo'
  );
  return normalizeImageBase64(base64);
}

/**
 * Calls Supabase Edge Function `analyze-car-image` when deployed.
 */
export async function analyzeCarImage(localUri) {
  const sb = getSupabase();
  if (!sb) {
    return {
      plateGuess: null,
      labels: [],
      hints: {},
      error: 'SUPABASE_REQUIRED',
    };
  }
  try {
    const base64 = await uriToBase64(localUri);
    if (!base64) {
      return {
        plateGuess: null,
        labels: [],
        hints: {},
        error: 'Could not read the image. Try a new photo or another file.',
      };
    }

    if (base64.length > MAX_BASE64_CHARS) {
      return {
        plateGuess: null,
        labels: [],
        hints: {},
        error:
          'Photo is too large for OCR (' +
          Math.round(base64.length / 1024) +
          ' KB). Use the Library picker and choose a smaller image, or take a closer shot so the plate fills more of the frame.',
      };
    }

    const invokeOnce = sb.functions.invoke('analyze-car-image', {
      body: { imageBase64: base64 },
    });

    const { data, error } = await withTimeout(invokeOnce, INVOKE_MS, 'OCR service');

    if (error) {
      const msg = error.message || (typeof error === 'string' ? error : 'Edge function error');
      if (/not\s*found|404|function|deploy/i.test(msg)) {
        return {
          plateGuess: null, labels: [], hints: {},
          error: 'OCR not set up yet. Run: ./scripts/deploy-edge-functions.sh <token>\n(Get token from supabase.com/dashboard/account/tokens)',
          notDeployed: true,
        };
      }
      return { plateGuess: null, labels: [], hints: {}, error: msg };
    }

    const plateGuess = data?.plateGuess ? normalizePlate(data.plateGuess) : null;
    return {
      plateGuess: data?.plateGuess || null,
      plateNormalized: plateGuess,
      labels: data?.labels || [],
      hints: data?.hints || {},
      raw: data,
    };
  } catch (e) {
    const msg = e?.message || String(e);
    return {
      plateGuess: null,
      labels: [],
      hints: {},
      error: msg,
    };
  }
}
