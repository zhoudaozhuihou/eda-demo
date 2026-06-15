import { render, screen, fireEvent } from '@testing-library/react';
import { ApiDocContent, ApiDocStatusCodes } from './ApiDocContent';
import { ApiCatalogApi } from './types';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));

const mockApi: ApiCatalogApi = {
  id: '1',
  name: 'Test API',
  path: '/test',
  method: 'GET',
  domain: 'Test',
  category: 'Test',
  description: 'Test Description',
  version: '1.0.0',
  status: 'active',
  qps: 10,
  avgLatency: 50,
  callsToday: 100,
  authType: 'NONE',
  createdAt: '2023-01-01',
};

const getOrdersApi: ApiCatalogApi = {
  id: '2',
  name: 'getUserOrders',
  path: '/api/v1/orders/user',
  method: 'GET',
  domain: 'Order',
  category: 'Order',
  description: 'User orders',
  version: '1.0.0',
  status: 'active',
  qps: 10,
  avgLatency: 50,
  callsToday: 100,
  authType: 'API_KEY',
  createdAt: '2023-01-01',
};

beforeAll(() => {
  class MockIntersectionObserver implements IntersectionObserver {
    root: Element | Document | null = null;
    rootMargin = '';
    thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterAll(() => {
  delete (globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
});

describe('ApiDocStatusCodes', () => {
  it('renders status codes in collapsed state by default', () => {
    render(<ApiDocStatusCodes api={mockApi} />);

    // Check header exists (200 OK)
    expect(screen.getByText('200')).toBeDefined();
    expect(screen.getByText('OK')).toBeDefined();

    // Check Scenario and JSON are NOT visible (collapsed)
    // Scenario label key: 'doc.statusCodes.labels.scenario'
    expect(screen.queryByText('doc.statusCodes.labels.scenario')).toBeNull();
    
    // JSON content part (e.g. "code": 200) - tricky to test exact string in pre, but can check for container
    // or check if 'doc.statusCodes.actions.expandExample' button is present
    expect(screen.getAllByText('doc.statusCodes.actions.expandExample')).toHaveLength(8); // 8 default status codes
  });

  it('expands individual item on click', () => {
    render(<ApiDocStatusCodes api={mockApi} />);
    
    const buttons = screen.getAllByText('doc.statusCodes.actions.expandExample');
    fireEvent.click(buttons[0]); // Click first one (200 OK)

    // Now Scenario should be visible for this item
    // Since we only expanded one, there should be 1 scenario label
    expect(screen.getByText('doc.statusCodes.labels.scenario')).toBeDefined();
    
    // Button text changes to Collapse
    expect(screen.getByText('doc.statusCodes.actions.collapseExample')).toBeDefined();
  });

  it('expands all items when Expand All is clicked', () => {
    render(<ApiDocStatusCodes api={mockApi} />);
    
    const expandAllBtn = screen.getByText('doc.statusCodes.actions.expandAll');
    fireEvent.click(expandAllBtn);

    // All scenarios should be visible
    // 8 default status codes
    expect(screen.getAllByText('doc.statusCodes.labels.scenario')).toHaveLength(8);
  });

  it('collapses all items when Collapse All is clicked', () => {
    render(<ApiDocStatusCodes api={mockApi} />);
    
    // First expand all
    fireEvent.click(screen.getByText('doc.statusCodes.actions.expandAll'));
    expect(screen.getAllByText('doc.statusCodes.labels.scenario')).toHaveLength(8);

    // Then collapse all
    fireEvent.click(screen.getByText('doc.statusCodes.actions.collapseAll'));
    expect(screen.queryByText('doc.statusCodes.labels.scenario')).toBeNull();
  });
});

describe('ApiDocContent request path', () => {
  it('renders GET path with encoded query parameters', () => {
    render(<ApiDocContent api={getOrdersApi} versions={[getOrdersApi]} />);

    expect(
      screen.getAllByText('GET /api/v1/orders/user?user_id=1&page=1&page_size=20').length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('doc.actions.expandQueryParams'));

    expect(screen.getAllByText('user_id').length).toBeGreaterThan(0);
    expect(screen.getAllByText('page').length).toBeGreaterThan(0);
    expect(screen.getAllByText('page_size').length).toBeGreaterThan(0);
  });
});
