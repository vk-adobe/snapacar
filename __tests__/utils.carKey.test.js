import { makeCarKey, parseCarKey, normalizePart } from '../src/utils/carKey';

describe('normalizePart', () => {
  it('trims and lowercases', () => {
    expect(normalizePart('  Toyota  ')).toBe('toyota');
  });

  it('collapses multiple spaces', () => {
    expect(normalizePart('GR  Corolla')).toBe('gr corolla');
  });

  it('handles empty / null', () => {
    expect(normalizePart('')).toBe('');
    expect(normalizePart(null)).toBe('');
  });
});

describe('makeCarKey', () => {
  it('builds a consistent key from make/model/year', () => {
    expect(makeCarKey('Toyota', 'GR Corolla', '2024')).toBe('toyota::gr corolla::2024');
  });

  it('is case-insensitive (same key regardless of casing)', () => {
    expect(makeCarKey('TOYOTA', 'GR COROLLA', '2024')).toBe(
      makeCarKey('Toyota', 'GR Corolla', '2024')
    );
  });

  it('uses "unknown" when year is missing', () => {
    expect(makeCarKey('BMW', 'M3', '')).toBe('bmw::m3::unknown');
    expect(makeCarKey('BMW', 'M3', null)).toBe('bmw::m3::unknown');
  });

  it('strips non-digit characters from year', () => {
    expect(makeCarKey('Ford', 'Mustang', 'year2023')).toBe('ford::mustang::2023');
  });
});

describe('parseCarKey', () => {
  it('round-trips a key created by makeCarKey', () => {
    const key = makeCarKey('Porsche', '911', '2022');
    const parsed = parseCarKey(key);
    expect(parsed.make).toBe('porsche');
    expect(parsed.model).toBe('911');
    expect(parsed.year).toBe('2022');
  });

  it('returns empty string for year when key contains "unknown"', () => {
    const key = makeCarKey('Honda', 'Civic', '');
    const parsed = parseCarKey(key);
    expect(parsed.year).toBe('');
  });

  it('handles a manually constructed key', () => {
    const parsed = parseCarKey('audi::a4::2020');
    expect(parsed.make).toBe('audi');
    expect(parsed.model).toBe('a4');
    expect(parsed.year).toBe('2020');
  });
});
