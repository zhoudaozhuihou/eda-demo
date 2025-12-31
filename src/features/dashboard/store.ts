import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDashboard } from './api';
import type { DashboardHotApi, DashboardStat } from './types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type DashboardState = {
  stats: DashboardStat[];
  hotApis: DashboardHotApi[];
  status: LoadStatus;
  error: string | null;
};

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async () => {
  return getDashboard();
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: [], hotApis: [], status: 'idle', error: null } as DashboardState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = action.payload.stats;
        state.hotApis = action.payload.hotApis;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load dashboard';
      });
  },
});

export const dashboardReducer = dashboardSlice.reducer;

