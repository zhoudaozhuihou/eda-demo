import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getDashboard } from './api';
import type { DashboardData } from './types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type DashboardState = DashboardData & {
  status: LoadStatus;
  error: string | null;
  filter: {
    timeRange: '1h' | '24h' | '7d' | '30d';
    domain?: string;
  };
};

const initialState: DashboardState = {
  stats: [],
  hotApis: [],
  userStats: {
    totalUsers: 0,
    activeUsers: 0,
    retentionRate: 0,
    trend: [],
  },
  teamStats: {
    totalTeams: 0,
    activeMembers: 0,
    taskCompletionRate: 0,
    activityTrend: [],
  },
  platformStats: {
    systemStatus: 'healthy',
    cpuUsage: 0,
    memoryUsage: 0,
    serviceAvailability: 0,
    uptime: '',
  },
  apiTrends: [],
  status: 'idle',
  error: null,
  filter: {
    timeRange: '24h',
  },
};

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async () => {
  return getDashboard();
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<DashboardState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
  },
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
        state.userStats = action.payload.userStats;
        state.teamStats = action.payload.teamStats;
        state.platformStats = action.payload.platformStats;
        state.apiTrends = action.payload.apiTrends;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load dashboard';
      });
  },
});

export const { setFilter } = dashboardSlice.actions;
export const dashboardReducer = dashboardSlice.reducer;
