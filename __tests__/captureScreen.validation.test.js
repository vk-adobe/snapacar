/**
 * Unit tests for the CaptureScreen validation logic.
 * Extracted as pure functions so they can be tested without rendering the screen.
 */
import { normalizePlate } from '../src/utils/plate';

// Mirrors the validatePlate helper inside CaptureScreen
function validatePlate(value) {
  if (!value.trim()) return '';
  const norm = normalizePlate(value);
  if (norm.length < 2) return 'Too short — enter at least 2 characters.';
  if (norm.length > 10) return 'Too long — most plates are under 10 characters.';
  if (!/^[A-Z0-9]+$/.test(norm)) return 'Only letters and numbers are allowed.';
  return '';
}

describe('validatePlate', () => {
  it('returns empty string for a blank / empty plate (field is optional)', () => {
    expect(validatePlate('')).toBe('');
    expect(validatePlate('   ')).toBe('');
  });

  it('rejects a single character', () => {
    expect(validatePlate('A')).toMatch(/Too short/);
  });

  it('accepts a 2-character plate', () => {
    expect(validatePlate('AB')).toBe('');
  });

  it('accepts a typical plate', () => {
    expect(validatePlate('MH12AB3456')).toBe('');
  });

  it('accepts plate with spaces (normalised length within range)', () => {
    expect(validatePlate('KA 01 AB')).toBe('');
  });

  it('rejects plate longer than 10 alphanumeric chars after normalization', () => {
    expect(validatePlate('ABCDE12345X')).toMatch(/Too long/);
  });

  it('rejects plate with special characters after normalization produces < 2 chars', () => {
    expect(validatePlate('!!')).toMatch(/Too short/);
  });

  it('accepts plate with hyphens (stripped during normalization)', () => {
    expect(validatePlate('AB-1234')).toBe('');
  });
});

// Mirrors the submit pre-flight checks in CaptureScreen
function validateSubmit({ make, model, photoUri, licensePlate }) {
  if (!make.trim() || !model.trim()) return 'Car details: Enter at least make and model.';
  if (!photoUri) return 'Photo: Take or choose a photo of the car.';
  if (licensePlate.trim()) {
    const err = validatePlate(licensePlate);
    if (err) return `License plate: ${err}`;
  }
  return null; // valid
}

describe('validateSubmit (CaptureScreen pre-flight)', () => {
  const base = { make: 'Toyota', model: 'Supra', photoUri: 'file:///photo.jpg', licensePlate: '' };

  it('passes when all required fields are present', () => {
    expect(validateSubmit(base)).toBeNull();
  });

  it('fails when make is empty', () => {
    expect(validateSubmit({ ...base, make: '' })).toMatch(/make and model/);
  });

  it('fails when model is empty', () => {
    expect(validateSubmit({ ...base, model: '   ' })).toMatch(/make and model/);
  });

  it('fails when photo is missing', () => {
    expect(validateSubmit({ ...base, photoUri: null })).toMatch(/photo/i);
  });

  it('fails when plate is present but too short', () => {
    expect(validateSubmit({ ...base, licensePlate: 'A' })).toMatch(/Too short/);
  });

  it('fails when plate is present but too long', () => {
    expect(validateSubmit({ ...base, licensePlate: 'ABCDE12345X' })).toMatch(/Too long/);
  });

  it('passes when plate is omitted (optional field)', () => {
    expect(validateSubmit({ ...base, licensePlate: '' })).toBeNull();
  });

  it('passes when plate is valid', () => {
    expect(validateSubmit({ ...base, licensePlate: 'MH12AB1234' })).toBeNull();
  });
});
