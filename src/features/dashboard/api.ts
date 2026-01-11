import { apiRequest } from '@/services/http';
import type { DashboardData } from './types';

export async function getDashboard(): Promise<DashboardData> {
  return apiRequest('/api/dashboard');
}

