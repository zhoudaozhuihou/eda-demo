import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from 'i18next';
import { Provider } from 'react-redux';
import { createAppStore } from '@/store/store';
import { APICatalog } from '@/features/api-catalog/APICatalog';
import type { ApiCatalogApi } from '@/features/api-catalog/types';

const seedApis: ApiCatalogApi[] = [
  {
    id: '1',
    name: 'getUserOrders',
    path: '/api/orders',
    method: 'GET',
    domain: 'order',
    category: 'order/user',
    description: 'List user orders',
    version: '1.0.0',
    status: 'active',
    qps: 12,
    avgLatency: 120,
    callsToday: 3200,
    authType: 'API_KEY',
    createdAt: '2025-12-28',
  },
];

function renderCatalog() {
  const store = createAppStore({
    apiCatalog: { items: seedApis, status: 'succeeded', error: null },
    categories: { taxonomy: null, status: 'succeeded', error: null, fetchedAt: Date.now() },
  });
  return render(
    <Provider store={store}>
      <APICatalog />
    </Provider>,
  );
}

describe('APICatalog i18n', () => {
  it('renders English when language is en-US', async () => {
    await i18n.changeLanguage('en-US');
    renderCatalog();

    expect(screen.getByRole('heading', { level: 1, name: 'API Catalog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export docs' })).toBeInTheDocument();
  });

  it('renders Chinese when language is zh-CN', async () => {
    await i18n.changeLanguage('zh-CN');
    renderCatalog();

    expect(screen.getByRole('heading', { level: 1, name: 'API 目录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出文档' })).toBeInTheDocument();
  });
});
