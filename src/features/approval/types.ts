export type ApprovalRequest = {
  id: string;
  apiName: string;
  apiPath: string;
  type: 'publish' | 'update' | 'deprecate' | 'delete';
  requester: string;
  requesterAvatar: string;
  team: string;
  reason: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approver?: string;
  approvedAt?: string;
  approvalComment?: string;
};

