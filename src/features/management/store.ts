import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getManagementData } from './api';
import type {
  ManagementConnection,
  ManagementMember,
  ManagementRole,
  ManagementRoleGroup,
  ManagementTeam,
} from './types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ManagementState = {
  teams: ManagementTeam[];
  members: ManagementMember[];
  connections: ManagementConnection[];
  roles: ManagementRole[];
  roleGroups: ManagementRoleGroup[];
  status: LoadStatus;
  error: string | null;
};

export const fetchManagement = createAsyncThunk('management/fetch', async () => {
  return getManagementData();
});

const managementSlice = createSlice({
  name: 'management',
  initialState: { teams: [], members: [], connections: [], roles: [], roleGroups: [], status: 'idle', error: null } as ManagementState,
  reducers: {
    connectionAdded: (state, action: PayloadAction<ManagementConnection>) => {
      state.connections.unshift(action.payload);
    },
    connectionUpdated: (state, action: PayloadAction<{ id: string; patch: Partial<Omit<ManagementConnection, 'id'>> }>) => {
      const idx = state.connections.findIndex((c) => c.id === action.payload.id);
      if (idx === -1) return;
      state.connections[idx] = { ...state.connections[idx], ...action.payload.patch };
    },
    connectionRemoved: (state, action: PayloadAction<string>) => {
      state.connections = state.connections.filter((c) => c.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagement.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchManagement.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teams = action.payload.teams;
        state.members = action.payload.members;
        state.connections = action.payload.connections;
        state.roles = action.payload.roles;
        state.roleGroups = action.payload.roleGroups;
      })
      .addCase(fetchManagement.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load management data';
      });
  },
});

export const managementActions = managementSlice.actions;
export const managementReducer = managementSlice.reducer;

