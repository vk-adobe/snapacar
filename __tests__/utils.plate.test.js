import { normalizePlate } from '../src/utils/plate';

describe('normalizePlate', () => {
  it('uppercases letters', () => {
    expect(normalizePlate('abc123')).toBe('ABC123');
  });

  it('strips spaces', () => {
    expect(normalizePlate('AB C 12')).toBe('ABC12');
  });

  it('strips hyphens and dashes', () => {
    expect(normalizePlate('AB-123')).toBe('AB123');
    expect(normalizePlate('AB–123')).toBe('AB123'); // en-dash
  });

  it('strips all non-alphanumeric characters', () => {
    expect(normalizePlate('AB!@#123')).toBe('AB123');
  });

  it('handles empty string', () => {
    expect(normalizePlate('')).toBe('');
  });

  it('handles null/undefined gracefully', () => {
    expect(normalizePlate(null)).toBe('');
    expect(normalizePlate(undefined)).toBe('');
  });

  it('handles a realistic plate', () => {
    expect(normalizePlate('KA 01 AB 1234')).toBe('KA01AB1234');
  });

  it('handles already-normalised plate (idempotent)', () => {
    expect(normalizePlate('MH12AB3456')).toBe('MH12AB3456');
  });
});
