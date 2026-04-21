import * as FileSystem from 'expo-file-system';
import { getSupabase } from '../lib/supabase';
import { normalizePlate } from '../utils/plate';

/**
 * Calls Supabase Edge Function `analyze-car-image` when deployed.
 * The function should call Google Vision (or similar) and return:
 * { plateGuess: string|null, labels: string[], hints: { make?: string, model?: string } }
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
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { data, error } = await sb.functions.invoke('analyze-car-image', {
      body: { imageBase64: base64 },
    });
    if (error) {
      return { plateGuess: null, labels: [], hints: {}, error: error.message };
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
    return { plateGuess: null, labels: [], hints: {}, error: e.message };
  }
}
