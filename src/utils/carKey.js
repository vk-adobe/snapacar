/** Normalize make/model/year so reviews group together. */
export function normalizePart(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function makeCarKey(make, model, year) {
  const m = normalizePart(make);
  const mo = normalizePart(model);
  const y = normalizePart(year).replace(/\D/g, '') || 'unknown';
  return `${m}::${mo}::${y}`;
}

export function parseCarKey(key) {
  const [make, model, year] = key.split('::');
  return {
    make: make || '',
    model: model || '',
    year: year === 'unknown' ? '' : year,
  };
}
