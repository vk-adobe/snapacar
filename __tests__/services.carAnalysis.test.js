/**
 * Tests for analyzeCarImage — mocks Supabase and FileSystem so no real network calls are made.
 */

// Mock Supabase client
jest.mock('../src/lib/supabase', () => ({
  getSupabase: jest.fn(),
}));

// Mock FileSystem
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// Mock asyncTimeout to pass through immediately
jest.mock('../src/utils/asyncTimeout', () => ({
  withTimeout: jest.fn((promise) => promise),
}));

import { getSupabase } from '../src/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeCarImage } from '../src/services/carAnalysis';

const FAKE_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

beforeEach(() => {
  jest.clearAllMocks();
  FileSystem.readAsStringAsync.mockResolvedValue(FAKE_B64);
});

describe('analyzeCarImage — no Supabase configured', () => {
  it('returns SUPABASE_REQUIRED error when Supabase is not configured', async () => {
    getSupabase.mockReturnValue(null);
    const res = await analyzeCarImage('file:///photo.jpg');
    expect(res.error).toBe('SUPABASE_REQUIRED');
    expect(res.plateGuess).toBeNull();
  });
});

describe('analyzeCarImage — edge function success', () => {
  it('returns plateGuess and hints when edge function succeeds', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      data: {
        plateGuess: 'MH12AB3456',
        labels: ['car', 'sedan'],
        hints: { make: 'Honda', model: 'City' },
      },
      error: null,
    });
    getSupabase.mockReturnValue({
      functions: { invoke: mockInvoke },
    });

    const res = await analyzeCarImage('file:///photo.jpg');

    expect(res.plateGuess).toBe('MH12AB3456');
    expect(res.plateNormalized).toBe('MH12AB3456');
    expect(res.hints.make).toBe('Honda');
    expect(res.hints.model).toBe('City');
    expect(res.labels).toContain('car');
    expect(res.error).toBeUndefined();
  });

  it('normalises plate (strips spaces and lowercases)', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      data: { plateGuess: 'ka 01 ab 1234', labels: [], hints: {} },
      error: null,
    });
    getSupabase.mockReturnValue({ functions: { invoke: mockInvoke } });

    const res = await analyzeCarImage('file:///photo.jpg');
    expect(res.plateNormalized).toBe('KA01AB1234');
  });
});

describe('analyzeCarImage — edge function errors', () => {
  it('returns notDeployed flag when edge function is not found', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Function not found' },
    });
    getSupabase.mockReturnValue({ functions: { invoke: mockInvoke } });

    const res = await analyzeCarImage('file:///photo.jpg');
    expect(res.notDeployed).toBe(true);
    expect(res.plateGuess).toBeNull();
    expect(res.error).toMatch(/OCR not set up/i);
  });

  it('returns raw error message for non-deployment errors', async () => {
    const mockInvoke = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Internal server error' },
    });
    getSupabase.mockReturnValue({ functions: { invoke: mockInvoke } });

    const res = await analyzeCarImage('file:///photo.jpg');
    expect(res.notDeployed).toBeFalsy();
    expect(res.error).toMatch(/Internal server error/);
  });

  it('returns error when image cannot be read from filesystem', async () => {
    FileSystem.readAsStringAsync.mockResolvedValue('');
    getSupabase.mockReturnValue({ functions: { invoke: jest.fn() } });

    const res = await analyzeCarImage('file:///photo.jpg');
    expect(res.error).toMatch(/Could not read/);
  });

  it('catches unexpected thrown errors gracefully', async () => {
    const mockInvoke = jest.fn().mockRejectedValue(new Error('Network timeout'));
    getSupabase.mockReturnValue({ functions: { invoke: mockInvoke } });

    const res = await analyzeCarImage('file:///photo.jpg');
    expect(res.error).toMatch(/Network timeout/);
    expect(res.plateGuess).toBeNull();
  });
});
