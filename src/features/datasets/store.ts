import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getDatasets } from './api';
import type { Dataset } from './types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type ListState<T> = {
  items: T[];
  status: LoadStatus;
  error: string | null;
};

export const fetchDatasets = createAsyncThunk('datasets/fetch', async () => {
  return getDatasets();
});

const datasetsSlice = createSlice({
  name: 'datasets',
  initialState: { items: [], status: 'idle', error: null } as ListState<Dataset>,
  reducers: {
    datasetAdded: (state, action: PayloadAction<Dataset>) => {
      state.items.unshift(action.payload);
    },
    datasetUpdated: (state, action: PayloadAction<{ id: string; patch: Partial<Omit<Dataset, 'id'>> }>) => {
      const idx = state.items.findIndex((d) => d.id === action.payload.id);
      if (idx === -1) return;
      state.items[idx] = { ...state.items[idx], ...action.payload.patch };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatasets.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDatasets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDatasets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load datasets';
      });
  },
});

export const datasetsActions = datasetsSlice.actions;
export const datasetsReducer = datasetsSlice.reducer;

