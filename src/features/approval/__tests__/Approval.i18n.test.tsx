import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from 'i18next';
import { Provider } from 'react-redux';
import { createAppStore } from '@/store/store';
import { Approval } from '@/features/approval/Approval';
import type { ApprovalRequest } from '@/features/approval/types';

const seedRequests: ApprovalRequest[] = [
  {
    id: '1',
    apiName: 'getUserOrders',
    apiPath: '/api/orders',
    type: 'publish',
    status: 'pending',
    requester: 'Alice',
    requesterAvatar: 'alice',
    team: 'Platform',
    createdAt: '2025-12-28 10:00:00',
    reason: 'Initial publish',
    details: 'Publish API to production.',
    approver: undefined,
    approvedAt: undefined,
    approvalComment: undefined,
  },
];

function renderApproval() {
  const store = createAppStore({
    approval: { items: seedRequests, status: 'succeeded', error: null },
  });
  return render(
    <Provider store={store}>
      <Approval />
    </Provider>,
  );
}

describe('Approval i18n', () => {
  it('renders English when language is en-US', async () => {
    await i18n.changeLanguage('en-US');
    renderApproval();

    expect(screen.getByRole('heading', { level: 1, name: 'Approval Center' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by API name or requester...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Batch approve' })).toBeInTheDocument();
  });

  it('renders Chinese when language is zh-CN', async () => {
    await i18n.changeLanguage('zh-CN');
    renderApproval();

    expect(screen.getByRole('heading', { level: 1, name: '审核中心' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索 API 名称或申请人...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批量批准' })).toBeInTheDocument();
  });
});
