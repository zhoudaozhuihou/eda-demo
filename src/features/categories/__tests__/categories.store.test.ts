import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@/store/store';
import type { Taxonomy } from '@/features/categories/types';
import { createCategory, fetchTaxonomy } from '@/features/categories/store';
import * as api from '@/features/categories/api';

vi.mock('@/features/categories/api', () => ({
  getTaxonomy: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  reorderCategories: vi.fn(),
  moveCategories: vi.fn(),
  deleteCategories: vi.fn(),
  setItemCategories: vi.fn(),
}));

const cacheKey = 'eda.taxonomy.v1';

const taxonomyA: Taxonomy = {
  categories: [
    { id: 'c1', name: 'A', parentId: null, order: 1, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
  ],
  links: [],
};

const taxonomyB: Taxonomy = {
  categories: [
    { id: 'c1', name: 'A', parentId: null, order: 1, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
    { id: 'c2', name: 'B', parentId: null, order: 2, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
  ],
  links: [],
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('categories store caching', () => {
  it('returns cached taxonomy when cache is fresh', async () => {
    localStorage.setItem(cacheKey, JSON.stringify({ taxonomy: taxonomyA, fetchedAt: Date.now() }));
    const store = createAppStore();

    await store.dispatch(fetchTaxonomy()).unwrap();

    expect(store.getState().categories.taxonomy).toEqual(taxonomyA);
    expect(vi.mocked(api.getTaxonomy)).not.toHaveBeenCalled();
  });

  it('calls api when cache is expired', async () => {
    localStorage.setItem(cacheKey, JSON.stringify({ taxonomy: taxonomyA, fetchedAt: Date.now() - 6 * 60 * 1000 }));
    vi.mocked(api.getTaxonomy).mockResolvedValueOnce(taxonomyB);
    const store = createAppStore();

    await store.dispatch(fetchTaxonomy()).unwrap();

    expect(vi.mocked(api.getTaxonomy)).toHaveBeenCalledTimes(1);
    expect(store.getState().categories.taxonomy).toEqual(taxonomyB);
    const stored = JSON.parse(localStorage.getItem(cacheKey) ?? '{}') as { taxonomy?: Taxonomy };
    expect(stored.taxonomy).toEqual(taxonomyB);
  });

  it('clears cache and refetches on createCategory', async () => {
    localStorage.setItem(cacheKey, JSON.stringify({ taxonomy: taxonomyA, fetchedAt: Date.now() }));
    vi.mocked(api.createCategory).mockResolvedValueOnce({
      id: 'c2',
      name: 'B',
      parentId: null,
      order: 2,
      createdAt: '2025-01-01 00:00',
      updatedAt: '2025-01-01 00:00',
    });
    vi.mocked(api.getTaxonomy).mockResolvedValueOnce(taxonomyB);
    const store = createAppStore();

    await store.dispatch(createCategory({ name: 'B', parentId: null, order: 2 })).unwrap();

    expect(vi.mocked(api.createCategory)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.getTaxonomy)).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(localStorage.getItem(cacheKey) ?? '{}') as { taxonomy?: Taxonomy };
    expect(stored.taxonomy).toEqual(taxonomyB);
  });
});

