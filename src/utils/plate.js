/** Normalize license plate for search/compare (uppercase, remove spaces/dashes). */
export function normalizePlate(plate) {
  return String(plate ?? '')
    .toUpperCase()
    .replace(/[\s\-–]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}
