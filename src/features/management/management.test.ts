import { describe, it, expect } from 'vitest';
import { managementReducer, managementActions, ManagementState } from './store';
import { logAdded, auditReducer } from '../audit-logs/store';
import { ManagementRole, ManagementRoleGroup, ManagementTeam } from './types';

describe('Permission Management System', () => {
  const initialState: ManagementState = {
    teams: [],
    members: [],
    connections: [],
    roles: [],
    roleGroups: [],
    status: 'idle',
    error: null,
  };

  const auditInitialState = {
    logs: [],
  };

  describe('Role Management', () => {
    it('should create a role with permissions', () => {
      const newRole: ManagementRole = {
        id: 'role-1',
        name: 'API Editor',
        description: 'Can edit APIs',
        permissions: ['api_view', 'api_edit'],
        type: 'custom',
        userCount: 0,
      };

      const state = managementReducer(initialState, managementActions.roleAdded(newRole));
      expect(state.roles).toHaveLength(1);
      expect(state.roles[0]).toEqual(newRole);
    });

    it('should update a role', () => {
      const role: ManagementRole = {
        id: 'role-1',
        name: 'API Editor',
        description: 'Can edit APIs',
        permissions: ['api_view', 'api_edit'],
        type: 'custom',
        userCount: 0,
      };
      let state = managementReducer(initialState, managementActions.roleAdded(role));
      
      state = managementReducer(state, managementActions.roleUpdated({
        id: 'role-1',
        patch: { name: 'API Manager', permissions: ['api_view', 'api_edit', 'api_delete'] }
      }));

      expect(state.roles[0].name).toBe('API Manager');
      expect(state.roles[0].permissions).toContain('api_delete');
    });
  });

  describe('Role Group Management', () => {
    it('should create a role group with roles', () => {
      const group: ManagementRoleGroup = {
        id: 'group-1',
        name: 'DevOps',
        description: 'DevOps Team',
        roles: ['role-1', 'role-2'],
        userCount: 0,
      };

      const state = managementReducer(initialState, managementActions.roleGroupAdded(group));
      expect(state.roleGroups).toHaveLength(1);
      expect(state.roleGroups[0].roles).toEqual(['role-1', 'role-2']);
    });
  });

  describe('Team Management', () => {
    it('should create a team with required fields and assignments', () => {
      const team: ManagementTeam = {
        id: 'team-1',
        name: 'Backend Team',
        description: 'Backend Development',
        department: 'Engineering',
        serviceAccount: 'sa-backend',
        teamLeader: 'user-1',
        contactEmail: 'backend@example.com',
        lastVerifiedAt: new Date().toISOString(),
        members: 5,
        apis: 10,
        code: 'BE',
        color: 'blue',
        roles: ['role-1'],
        roleGroups: ['group-1']
      };

      const state = managementReducer(initialState, managementActions.teamAdded(team));
      expect(state.teams).toHaveLength(1);
      expect(state.teams[0].name).toBe('Backend Team');
      expect(state.teams[0].contactEmail).toBe('backend@example.com');
      expect(state.teams[0].roles).toContain('role-1');
      expect(state.teams[0].roleGroups).toContain('group-1');
    });

    it('should verify contact information expiration logic', () => {
      const now = new Date();
      const verifiedTeam: ManagementTeam = {
        id: 'team-1',
        name: 'Verified Team',
        description: '',
        department: '',
        serviceAccount: '',
        teamLeader: '',
        contactEmail: '',
        lastVerifiedAt: now.toISOString(),
        members: 0,
        apis: 0,
        code: '',
        color: '',
      };

      const expiredDate = new Date();
      expiredDate.setDate(now.getDate() - 91); // 91 days ago
      
      const expiredTeam: ManagementTeam = {
        ...verifiedTeam,
        id: 'team-2',
        lastVerifiedAt: expiredDate.toISOString(),
      };

      // Logic from TeamManagement.tsx:
      // const isContactVerified = (lastVerifiedAt?: string) => { ... }
      const isContactVerified = (lastVerifiedAt?: string) => {
        if (!lastVerifiedAt) return false;
        const date = new Date(lastVerifiedAt);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = diff / (1000 * 3600 * 24);
        return days <= 90;
      };

      expect(isContactVerified(verifiedTeam.lastVerifiedAt)).toBe(true);
      expect(isContactVerified(expiredTeam.lastVerifiedAt)).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should add an audit log entry', () => {
      const log = {
        id: 'log-1',
        timestamp: new Date().toISOString(),
        operator: 'user-1',
        action: 'CREATE_ROLE',
        target: 'New Role',
        details: 'Created role',
        status: 'success' as const
      };

      const state = auditReducer(auditInitialState, logAdded(log));
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0]).toEqual(log);
    });
  });
});
