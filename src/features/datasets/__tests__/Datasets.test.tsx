import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Datasets } from '@/features/datasets/Datasets';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { createAppStore } from '@/store/store';
import type { Dataset } from '@/features/datasets/types';
import type { Taxonomy } from '@/features/categories/types';

const seedDatasets: Dataset[] = [
  {
    id: '1',
    name: 'user_orders',
    alias: '用户订单表',
    source: '生产数据库',
    domain: '订单域',
    tags: ['核心', '交易'],
    fields: 18,
    masked: 3,
    rowCount: '1.2M',
    lastUpdate: '2025-12-28',
    createdAt: '2025-10-15 14:30',
    updatedAt: '2025-12-28 09:15',
    relatedAPIs: ['getUserOrders', 'getOrderDetail', 'createOrder'],
    description: '存储所有用户订单信息，包括订单状态、金额、时间等核心字段',
  },
  {
    id: '2',
    name: 'product_info',
    alias: '商品信息表',
    source: '生产数据库',
    domain: '商品域',
    tags: ['基础', 'SKU'],
    fields: 25,
    masked: 0,
    rowCount: '45K',
    lastUpdate: '2025-12-28',
    createdAt: '2025-09-22 10:15',
    updatedAt: '2025-12-28 09:15',
    relatedAPIs: ['getProductInfo', 'searchProducts'],
    description: '商品基础信息表，包含商品名称、价格、库存等信息',
  },
  {
    id: '3',
    name: 'customer_profile',
    alias: '客户画像表',
    source: '数据仓库',
    domain: '用户域',
    tags: ['敏感', 'PII'],
    fields: 42,
    masked: 8,
    rowCount: '850K',
    lastUpdate: '2025-12-27',
    createdAt: '2025-11-15 09:20',
    updatedAt: '2025-12-27 18:03',
    relatedAPIs: ['getCustomerProfile'],
    description: '客户画像数据，包含用户行为分析、偏好标签等敏感信息',
  },
  {
    id: '4',
    name: 'inventory_data',
    alias: '库存数据表',
    source: '生产数据库',
    domain: '库存域',
    tags: ['实时', '核心'],
    fields: 12,
    masked: 0,
    rowCount: '320K',
    lastUpdate: '2025-12-28',
    createdAt: '2025-10-02 11:10',
    updatedAt: '2025-12-28 08:40',
    relatedAPIs: ['updateInventory'],
    description: '实时库存数据表，记录各仓库的商品库存量',
  },
];

const seedTaxonomy: Taxonomy = {
  categories: [
    { id: 'cat_order', name: '订单域', parentId: null, order: 1, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
    { id: 'cat_product', name: '商品域', parentId: null, order: 2, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
    { id: 'cat_user', name: '用户域', parentId: null, order: 3, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
    { id: 'cat_inventory', name: '库存域', parentId: null, order: 4, createdAt: '2025-01-01 00:00', updatedAt: '2025-01-01 00:00' },
  ],
  links: [
    { itemType: 'dataset', itemId: '1', categoryId: 'cat_order' },
    { itemType: 'dataset', itemId: '2', categoryId: 'cat_product' },
    { itemType: 'dataset', itemId: '3', categoryId: 'cat_user' },
    { itemType: 'dataset', itemId: '4', categoryId: 'cat_inventory' },
  ],
};

function renderDatasets() {
  const store = createAppStore({
    datasets: { items: seedDatasets, status: 'succeeded', error: null },
    categories: { taxonomy: seedTaxonomy, status: 'succeeded', error: null, fetchedAt: Date.now() },
  });
  return render(
    <Provider store={store}>
      <Datasets />
    </Provider>,
  );
}

describe('Datasets', () => {
  it('filters by search and category, and opens detail', async () => {
    const user = userEvent.setup();
    renderDatasets();

    expect(screen.getByText('数据集管理')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('搜索数据集名称或别名...'), '用户订单');
    expect(screen.getAllByText('用户订单表').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('商品信息表').length).toBe(0);

    await user.clear(screen.getByPlaceholderText('搜索数据集名称或别名...'));
    await user.click(screen.getByRole('button', { name: /商品域/ }));
    expect(screen.getAllByText('商品信息表').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('用户订单表').length).toBe(0);

    const productAliasEl = screen.getAllByText('商品信息表')[0] as HTMLElement;
    let cur: HTMLElement | null = productAliasEl;
    let viewButton: HTMLElement | null = null;
    while (cur && !viewButton) {
      const buttons = Array.from(cur.querySelectorAll?.('button') ?? []) as HTMLElement[];
      viewButton = buttons.find((b) => /查看详情/.test(b.textContent ?? '')) ?? null;
      cur = cur.parentElement;
    }
    expect(viewButton).toBeTruthy();
    await user.click(viewButton!);
    expect(screen.getAllByText('商品信息表').length).toBeGreaterThan(0);
    expect(screen.getAllByText('字段列表').length).toBeGreaterThan(0);

    await user.click(screen.getByText('查看血缘关系'));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('血缘关系')).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: '关闭' }));
    }

    await user.click(screen.getByText('变更历史'));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('变更历史')).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: '关闭' }));
    }

    await user.click(screen.getByText('返回列表'));
    expect(screen.getByText('数据集管理')).toBeInTheDocument();
  });

  it('creates and edits a dataset, then edits a field', async () => {
    const user = userEvent.setup();
    renderDatasets();

    await user.click(screen.getByRole('button', { name: '创建数据集' }));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('创建数据集')).toBeInTheDocument();
    }

    await user.type(screen.getByPlaceholderText('例：user_orders'), 'test_ds');
    await user.type(screen.getByPlaceholderText('例：用户订单表'), '测试数据集');
    await user.type(screen.getByPlaceholderText('例：生产数据库'), '生产数据库');
    {
      const dialog = screen.getByRole('dialog');
      const maskedInput = within(dialog).getAllByDisplayValue('0')[0];
      await user.clear(maskedInput);
      await user.type(maskedInput, '0');
    }
    await user.type(screen.getByPlaceholderText('例：1.2M'), '12K');

    await user.click(screen.getByRole('button', { name: '创建' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    expect(screen.getAllByText('测试数据集').length).toBeGreaterThan(0);

    const datasetAliasEl = screen.getAllByText('测试数据集')[0] as HTMLElement;
    let cur: HTMLElement | null = datasetAliasEl;
    let editButton: HTMLElement | null = null;
    while (cur && !editButton) {
      editButton = cur.querySelector?.('[aria-label="编辑数据集"]') ?? null;
      cur = cur.parentElement;
    }
    expect(editButton).toBeTruthy();
    await user.click(editButton!);

    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('编辑数据集')).toBeInTheDocument();
      const aliasInput = within(dialog).getAllByDisplayValue('测试数据集')[0];
      await user.clear(aliasInput);
      await user.type(aliasInput, '测试数据集2');
      await user.click(within(dialog).getByRole('button', { name: '保存' }));
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('测试数据集2').length).toBeGreaterThan(0);

    {
      const datasetAliasEl2 = screen.getAllByText('测试数据集2')[0] as HTMLElement;
      let cur2: HTMLElement | null = datasetAliasEl2;
      let viewButton: HTMLElement | null = null;
      while (cur2 && !viewButton) {
        const buttons = Array.from(cur2.querySelectorAll?.('button') ?? []) as HTMLElement[];
        viewButton = buttons.find((b) => /查看详情/.test(b.textContent ?? '')) ?? null;
        cur2 = cur2.parentElement;
      }
      expect(viewButton).toBeTruthy();
      await user.click(viewButton!);
    }
    expect(screen.getAllByText('测试数据集2').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '编辑字段' }));
    {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('编辑字段')).toBeInTheDocument();

      const userIdCell = within(dialog).getByText('user_id');
      const userIdRow = userIdCell.parentElement as HTMLElement;
      const fieldAliasInput = within(userIdRow).getAllByRole('textbox')[0] as HTMLInputElement;
      await user.clear(fieldAliasInput);
      await user.type(fieldAliasInput, '用户ID2');
      await user.click(within(dialog).getByRole('button', { name: '保存' }));
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('用户ID2').length).toBeGreaterThan(0);
  });

  it('navigates to API builder with dataset context', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    renderDatasets();

    await user.click(screen.getAllByText('查看详情 →')[0]);
    expect(screen.getByRole('heading', { name: '字段列表' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '创建新 API' }));

    const navEvent = dispatchSpy.mock.calls
      .map((c) => c[0])
      .find((e) => (e as Event).type === 'eda:navigate') as CustomEvent | undefined;

    expect(navEvent).toBeTruthy();
    expect(navEvent?.detail?.view).toBe('api-builder');
    expect(navEvent?.detail?.apiBuilderContext?.source).toBe('dataset');
    expect(navEvent?.detail?.apiBuilderContext?.datasetId).toBeTruthy();
    expect(navEvent?.detail?.apiBuilderContext?.datasetName).toBeTruthy();
    expect(Array.isArray(navEvent?.detail?.apiBuilderContext?.fields)).toBe(true);
  });
});
