import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getApprovalRequests } from './api';
import type { ApprovalRequest } from './types';

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

type ListState<T> = {
  items: T[];
  status: LoadStatus;
  error: string | null;
};

export const fetchApprovals = createAsyncThunk('approval/fetch', async () => {
  return getApprovalRequests();
});

const approvalSlice = createSlice({
  name: 'approval',
  initialState: { items: [], status: 'idle', error: null } as ListState<ApprovalRequest>,
  reducers: {
    approvalUpdated: (state, action: PayloadAction<{ id: string; patch: Partial<Omit<ApprovalRequest, 'id'>> }>) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx === -1) return;
      state.items[idx] = { ...state.items[idx], ...action.payload.patch };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovals.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchApprovals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchApprovals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to load approvals';
      });
  },
});

export const approvalActions = approvalSlice.actions;
export const approvalReducer = approvalSlice.reducer;

