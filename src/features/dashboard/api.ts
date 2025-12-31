import { apiRequest } from '@/services/http';
import type { DashboardHotApi, DashboardStat } from './types';

export async function getDashboard(): Promise<{ stats: DashboardStat[]; hotApis: DashboardHotApi[] }> {
  return apiRequest('/api/dashboard');
}

