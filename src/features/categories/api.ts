import { apiRequest } from '@/services/http';
import type { Category, Taxonomy } from './types';

export async function getTaxonomy(): Promise<Taxonomy> {
  return apiRequest('/api/taxonomy');
}

export async function createCategory(input: {
  name: string;
  parentId: string | null;
  order?: number;
}): Promise<Category> {
  return apiRequest('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'parentId' | 'order'>>,
): Promise<Category> {
  return apiRequest(`/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function reorderCategories(input: { parentId: string | null; orderedIds: string[] }): Promise<boolean> {
  return apiRequest('/api/categories/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function moveCategories(input: { ids: string[]; parentId: string | null }): Promise<boolean> {
  return apiRequest('/api/categories/move', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function deleteCategories(input: { ids: string[] }): Promise<boolean> {
  return apiRequest('/api/categories', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function setItemCategories(input: {
  itemType: 'dataset' | 'api';
  itemId: string;
  categoryIds: string[];
}): Promise<boolean> {
  return apiRequest('/api/category-links', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

