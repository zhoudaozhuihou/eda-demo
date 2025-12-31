import { apiRequest } from '@/services/http';
import type {
  ManagementConnection,
  ManagementMember,
  ManagementRole,
  ManagementRoleGroup,
  ManagementTeam,
} from './types';

export async function getManagementData(): Promise<{
  teams: ManagementTeam[];
  members: ManagementMember[];
  connections: ManagementConnection[];
  roles: ManagementRole[];
  roleGroups: ManagementRoleGroup[];
}> {
  return apiRequest('/api/management');
}

