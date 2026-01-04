import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuditLog } from './types';

interface AuditState {
  logs: AuditLog[];
}

const initialState: AuditState = {
  logs: [],
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    logAdded: (state, action: PayloadAction<AuditLog>) => {
      state.logs.unshift(action.payload);
    },
  },
});

export const { logAdded } = auditSlice.actions;
export const auditReducer = auditSlice.reducer;
