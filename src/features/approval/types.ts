export type ApprovalRequest = {
  id: string;
  apiName: string; // Used as Title
  apiPath: string; // Used as Subtitle or Detail
  type: 'publish' | 'update' | 'deprecate' | 'delete' | 'access_package';
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
  packageInfo?: {
    project: string;
    validity: string;
    tables: string[];
  };
};

