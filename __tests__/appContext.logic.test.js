/**
 * Tests for AppContext helper logic — groupPostsToSummaries, filterSummaries behaviour,
 * and the randomId uniqueness guarantee.
 * These are pure-logic tests; no React rendering required.
 */
import { makeCarKey } from '../src/utils/carKey';

// ─── randomId (copied inline to avoid importing React context) ──────────────
function randomId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

describe('randomId', () => {
  it('returns a non-empty string', () => {
    expect(typeof randomId()).toBe('string');
    expect(randomId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs across 1000 calls', () => {
    const ids = new Set(Array.from({ length: 1000 }, randomId));
    expect(ids.size).toBe(1000);
  });
});

// ─── groupPostsToSummaries (extracted logic) ────────────────────────────────
function groupPostsToSummaries(posts) {
  const byKey = {};
  for (const p of posts) {
    const k = p.car_key;
    if (!byKey[k]) byKey[k] = [];
    byKey[k].push(p);
  }
  return Object.keys(byKey).map((carKey) => {
    const list = byKey[carKey];
    const last = list.reduce((a, b) =>
      new Date(b.created_at) > new Date(a.created_at) ? b : a
    );
    const sum = list.reduce((s, r) => s + r.rating, 0);
    const withImg = list.find((x) => x.image_url);
    return {
      carKey,
      make: list[0].make,
      model: list[0].model,
      year: list[0].year,
      reviewCount: list.length,
      avgRating: Math.round((sum / list.length) * 10) / 10,
      lastAt: last.created_at,
      previewUrl: withImg?.image_url ?? null,
    };
  });
}

const CAR_KEY = makeCarKey('Toyota', 'Supra', '2023');

const makePosts = (overrides = []) =>
  overrides.map((o, i) => ({
    id: `id_${i}`,
    car_key: CAR_KEY,
    make: 'Toyota',
    model: 'Supra',
    year: '2023',
    rating: 5,
    image_url: null,
    created_at: new Date(Date.now() + i * 1000).toISOString(),
    ...o,
  }));

describe('groupPostsToSummaries', () => {
  it('returns empty array for empty input', () => {
    expect(groupPostsToSummaries([])).toEqual([]);
  });

  it('groups a single post correctly', () => {
    const [summary] = groupPostsToSummaries(makePosts([{ rating: 4 }]));
    expect(summary.reviewCount).toBe(1);
    expect(summary.avgRating).toBe(4);
    expect(summary.make).toBe('Toyota');
    expect(summary.model).toBe('Supra');
  });

  it('calculates average rating across multiple posts', () => {
    const posts = makePosts([{ rating: 4 }, { rating: 2 }, { rating: 3 }]);
    const [summary] = groupPostsToSummaries(posts);
    expect(summary.reviewCount).toBe(3);
    expect(summary.avgRating).toBe(3); // (4+2+3)/3 = 3.0
  });

  it('rounds avgRating to 1 decimal place', () => {
    const posts = makePosts([{ rating: 5 }, { rating: 4 }, { rating: 4 }]);
    const [summary] = groupPostsToSummaries(posts);
    expect(summary.avgRating).toBe(4.3); // 13/3 = 4.333... → 4.3
  });

  it('uses the first image_url found as previewUrl', () => {
    const posts = makePosts([
      { rating: 5, image_url: null },
      { rating: 4, image_url: 'https://example.com/car.jpg' },
    ]);
    const [summary] = groupPostsToSummaries(posts);
    expect(summary.previewUrl).toBe('https://example.com/car.jpg');
  });

  it('sets previewUrl to null when no post has an image', () => {
    const posts = makePosts([{ rating: 3, image_url: null }]);
    const [summary] = groupPostsToSummaries(posts);
    expect(summary.previewUrl).toBeNull();
  });

  it('groups posts by car_key, producing one summary per unique car', () => {
    const key2 = makeCarKey('BMW', 'M3', '2022');
    const posts = [
      ...makePosts([{ rating: 5 }]),
      { id: 'b1', car_key: key2, make: 'BMW', model: 'M3', year: '2022', rating: 4, image_url: null, created_at: new Date().toISOString() },
    ];
    const summaries = groupPostsToSummaries(posts);
    expect(summaries).toHaveLength(2);
  });
});

// ─── filterSummaries logic ───────────────────────────────────────────────────
function filterSummaries(summaries, query) {
  const q = query.trim().toLowerCase();
  if (!q) return summaries;
  return summaries.filter((r) =>
    `${r.make} ${r.model} ${r.year}`.toLowerCase().includes(q)
  );
}

const SUMMARIES = [
  { make: 'Toyota', model: 'Supra', year: '2023', carKey: 'k1', avgRating: 5, reviewCount: 1 },
  { make: 'BMW', model: 'M3', year: '2022', carKey: 'k2', avgRating: 4, reviewCount: 2 },
  { make: 'Porsche', model: '911', year: '2021', carKey: 'k3', avgRating: 4.5, reviewCount: 3 },
];

describe('filterSummaries', () => {
  it('returns all summaries when query is empty', () => {
    expect(filterSummaries(SUMMARIES, '')).toHaveLength(3);
  });

  it('returns all summaries when query is only spaces', () => {
    expect(filterSummaries(SUMMARIES, '   ')).toHaveLength(3);
  });

  it('filters by make (case-insensitive)', () => {
    const result = filterSummaries(SUMMARIES, 'toyota');
    expect(result).toHaveLength(1);
    expect(result[0].make).toBe('Toyota');
  });

  it('filters by model', () => {
    const result = filterSummaries(SUMMARIES, 'M3');
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('M3');
  });

  it('filters by year', () => {
    const result = filterSummaries(SUMMARIES, '2021');
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe('2021');
  });

  it('returns empty array when nothing matches', () => {
    expect(filterSummaries(SUMMARIES, 'Ferrari')).toHaveLength(0);
  });

  it('matches partial make/model string', () => {
    const result = filterSummaries(SUMMARIES, 'por');
    expect(result).toHaveLength(1);
    expect(result[0].make).toBe('Porsche');
  });
});
