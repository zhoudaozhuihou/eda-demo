import { apiRequest } from '@/services/http';
import type { ApprovalRequest } from './types';

export async function getApprovalRequests(): Promise<ApprovalRequest[]> {
  return apiRequest('/api/approvals');
}

