import { apiRequest } from '@/services/http';
import type { ApiCatalogApi } from './types';

export async function getCatalogApis(): Promise<ApiCatalogApi[]> {
  return apiRequest('/api/apis');
}

