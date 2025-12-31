import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getCatalogApis } from './api';
import type { ApiCatalogApi } from './types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type ListState<T> = {
  items: T[];
  status: LoadStatus;
  error: string | null;
};

export const fetchCatalogApis = createAsyncThunk('apiCatalog/fetch', async () => {
  return getCatalogApis();
});

const apiCatalogSlice = createSlice({
  name: 'apiCatalog',
  initialState: { items: [], status: 'idle', error: null } as ListState<ApiCatalogApi>,
  reducers: {
    apiUpdated: (state, action: PayloadAction<{ id: string; patch: Partial<Omit<ApiCatalogApi, 'id'>> }>) => {
      const idx = state.items.findIndex((a) => a.id === action.payload.id);
      if (idx === -1) return;
      state.items[idx] = { ...state.items[idx], ...action.payload.patch };
    },
    apiReplaced: (state, action: PayloadAction<ApiCatalogApi>) => {
      const idx = state.items.findIndex((a) => a.id === action.payload.id);
      if (idx === -1) return;
      state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogApis.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCatalogApis.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCatalogApis.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load apis';
      });
  },
});

export const apiCatalogActions = apiCatalogSlice.actions;
export const apiCatalogReducer = apiCatalogSlice.reducer;

