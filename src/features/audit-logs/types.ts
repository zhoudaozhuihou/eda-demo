export interface AuditLog {
  id: string;
  action: string;
  target: string;
  operator: string;
  timestamp: string;
  details?: string;
  status: 'success' | 'failure';
}
