import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import type { Category, CategoryLink, Taxonomy } from './types';
import {
  createCategory as apiCreateCategory,
  deleteCategories as apiDeleteCategories,
  getTaxonomy,
  moveCategories as apiMoveCategories,
  reorderCategories as apiReorderCategories,
  setItemCategories as apiSetItemCategories,
  updateCategory as apiUpdateCategory,
} from './api';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type CategoriesState = {
  taxonomy: Taxonomy | null;
  status: LoadStatus;
  error: string | null;
  fetchedAt: number | null;
};

const CACHE_KEY = 'eda.taxonomy.v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(): { taxonomy: Taxonomy; fetchedAt: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { taxonomy?: Taxonomy; fetchedAt?: number };
    if (!parsed.taxonomy || !parsed.fetchedAt) return null;
    return { taxonomy: parsed.taxonomy, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

function writeCache(taxonomy: Taxonomy) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ taxonomy, fetchedAt: Date.now() }));
  } catch {
    return;
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    return;
  }
}

export const fetchTaxonomy = createAsyncThunk(
  'categories/fetchTaxonomy',
  async (opts?: { force?: boolean }) => {
    if (!opts?.force) {
      const cached = readCache();
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.taxonomy;
      }
    }
    const taxonomy = await getTaxonomy();
    writeCache(taxonomy);
    return taxonomy;
  },
);

export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (input: { name: string; parentId: string | null; order?: number }, { dispatch }) => {
    clearCache();
    await apiCreateCategory(input);
    return dispatch(fetchTaxonomy({ force: true })).unwrap();
  },
);

export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async (input: { id: string; patch: { name?: string; parentId?: string | null; order?: number } }, { dispatch }) => {
    clearCache();
    await apiUpdateCategory(input.id, input.patch);
    return dispatch(fetchTaxonomy({ force: true })).unwrap();
  },
);

export const reorderCategories = createAsyncThunk(
  'categories/reorderCategories',
  async (input: { parentId: string | null; orderedIds: string[] }, { dispatch }) => {
    clearCache();
    await apiReorderCategories(input);
    return dispatch(fetchTaxonomy({ force: true })).unwrap();
  },
);

export const moveCategories = createAsyncThunk(
  'categories/moveCategories',
  async (input: { ids: string[]; parentId: string | null }, { dispatch }) => {
    clearCache();
    await apiMoveCategories(input);
    return dispatch(fetchTaxonomy({ force: true })).unwrap();
  },
);

export const deleteCategories = createAsyncThunk(
  'categories/deleteCategories',
  async (input: { ids: string[] }, { dispatch }) => {
    clearCache();
    await apiDeleteCategories(input);
    return dispatch(fetchTaxonomy({ force: true })).unwrap();
  },
);

export const setItemCategories = createAsyncThunk(
  'categories/setItemCategories',
  async (input: { itemType: 'dataset' | 'api'; itemId: string; categoryIds: string[] }, { dispatch }) => {
    clearCache();
    await apiSetItemCategories(input);
    return dispatch(fetchTaxonomy({ force: true })).unwrap();
  },
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: { taxonomy: null, status: 'idle', error: null, fetchedAt: null } as CategoriesState,
  reducers: {
    taxonomySet: (state, action: PayloadAction<Taxonomy>) => {
      state.taxonomy = action.payload;
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(action.payload);
    },
    categoryCreated: (state, action: PayloadAction<Category>) => {
      if (!state.taxonomy) return;
      state.taxonomy.categories.push(action.payload);
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(state.taxonomy);
    },
    categoryUpdated: (state, action: PayloadAction<{ id: string; patch: Partial<Category> }>) => {
      if (!state.taxonomy) return;
      const idx = state.taxonomy.categories.findIndex((c) => c.id === action.payload.id);
      if (idx === -1) return;
      state.taxonomy.categories[idx] = { ...state.taxonomy.categories[idx], ...action.payload.patch };
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(state.taxonomy);
    },
    categoriesReordered: (state, action: PayloadAction<{ parentId: string | null; orderedIds: string[] }>) => {
      if (!state.taxonomy) return;
      const orderById = new Map(action.payload.orderedIds.map((id, i) => [id, i + 1] as const));
      state.taxonomy.categories = state.taxonomy.categories.map((c) => {
        if (c.parentId !== action.payload.parentId) return c;
        const nextOrder = orderById.get(c.id);
        if (!nextOrder) return c;
        return { ...c, order: nextOrder, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
      });
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(state.taxonomy);
    },
    categoriesMoved: (state, action: PayloadAction<{ ids: string[]; parentId: string | null }>) => {
      if (!state.taxonomy) return;
      const idSet = new Set(action.payload.ids);
      state.taxonomy.categories = state.taxonomy.categories.map((c) => {
        if (!idSet.has(c.id)) return c;
        return { ...c, parentId: action.payload.parentId, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') };
      });
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(state.taxonomy);
    },
    categoriesDeleted: (state, action: PayloadAction<{ ids: string[] }>) => {
      if (!state.taxonomy) return;
      const idSet = new Set(action.payload.ids);
      state.taxonomy.categories = state.taxonomy.categories.filter((c) => !idSet.has(c.id));
      state.taxonomy.links = state.taxonomy.links.filter((l) => !idSet.has(l.categoryId));
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(state.taxonomy);
    },
    itemCategoriesSet: (
      state,
      action: PayloadAction<{ itemType: 'dataset' | 'api'; itemId: string; categoryIds: string[] }>,
    ) => {
      if (!state.taxonomy) return;
      state.taxonomy.links = state.taxonomy.links.filter(
        (l) => !(l.itemType === action.payload.itemType && l.itemId === action.payload.itemId),
      );
      const validCategoryId = new Set(state.taxonomy.categories.map((c) => c.id));
      const nextIds = action.payload.categoryIds.filter((id) => validCategoryId.has(id));
      const added: CategoryLink[] = nextIds.map((categoryId) => ({
        itemType: action.payload.itemType,
        itemId: action.payload.itemId,
        categoryId,
      }));
      state.taxonomy.links.push(...added);
      state.status = 'succeeded';
      state.error = null;
      state.fetchedAt = Date.now();
      writeCache(state.taxonomy);
    },
    taxonomyCacheCleared: (state) => {
      clearCache();
      state.fetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxonomy.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTaxonomy.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.taxonomy = action.payload;
        state.fetchedAt = Date.now();
      })
      .addCase(fetchTaxonomy.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load taxonomy';
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.taxonomy = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.fetchedAt = Date.now();
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.taxonomy = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.fetchedAt = Date.now();
      })
      .addCase(reorderCategories.fulfilled, (state, action) => {
        state.taxonomy = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.fetchedAt = Date.now();
      })
      .addCase(moveCategories.fulfilled, (state, action) => {
        state.taxonomy = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.fetchedAt = Date.now();
      })
      .addCase(deleteCategories.fulfilled, (state, action) => {
        state.taxonomy = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.fetchedAt = Date.now();
      })
      .addCase(setItemCategories.fulfilled, (state, action) => {
        state.taxonomy = action.payload;
        state.status = 'succeeded';
        state.error = null;
        state.fetchedAt = Date.now();
      });
  },
});

export const categoriesReducer = categoriesSlice.reducer;
export const categoriesActions = categoriesSlice.actions;

export function selectTaxonomy(state: RootState) {
  return state.categories.taxonomy;
}

export function selectCategoryLinksByItem(
  state: RootState,
  itemType: 'dataset' | 'api',
  itemId: string,
): string[] {
  const tax = state.categories.taxonomy;
  if (!tax) return [];
  return tax.links
    .filter((l: Taxonomy['links'][number]) => l.itemType === itemType && l.itemId === itemId)
    .map((l: Taxonomy['links'][number]) => l.categoryId);
}
