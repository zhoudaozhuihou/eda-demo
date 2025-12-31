import { apiRequest } from '@/services/http';
import type { Dataset } from './types';

export async function getDatasets(): Promise<Dataset[]> {
  return apiRequest('/api/datasets');
}

