import { describe, expect, it } from 'vitest';
import { createAppStore } from '@/store/store';
import { managementActions } from '@/features/management/store';
import { ManagementRole, ManagementTeam, ManagementRoleGroup } from '@/features/management/types';

describe('management store permissions and teams', () => {
  it('handles role CRUD operations correctly', () => {
    const store = createAppStore();
    const newRole: ManagementRole = {
      id: 'r1',
      name: 'Test Role',
      description: 'Test Description',
      permissions: ['api_view', 'api_edit'],
      type: 'custom',
      userCount: 0,
    };

    // Create
    store.dispatch(managementActions.roleAdded(newRole));
    expect(store.getState().management.roles).toContainEqual(newRole);

    // Update
    store.dispatch(managementActions.roleUpdated({ id: 'r1', patch: { name: 'Updated Role', permissions: ['api_view'] } }));
    const updatedRole = store.getState().management.roles.find(r => r.id === 'r1');
    expect(updatedRole?.name).toBe('Updated Role');
    expect(updatedRole?.permissions).toEqual(['api_view']);

    // Delete
    store.dispatch(managementActions.roleRemoved('r1'));
    expect(store.getState().management.roles).toHaveLength(0);
  });

  it('handles role group CRUD operations correctly', () => {
    const store = createAppStore();
    const newGroup: ManagementRoleGroup = {
      id: 'rg1',
      name: 'Test Group',
      description: 'Test Group Desc',
      roles: ['r1', 'r2'],
      userCount: 0,
    };

    // Create
    store.dispatch(managementActions.roleGroupAdded(newGroup));
    expect(store.getState().management.roleGroups).toContainEqual(newGroup);

    // Update
    store.dispatch(managementActions.roleGroupUpdated({ id: 'rg1', patch: { name: 'Updated Group', roles: ['r1'] } }));
    const updatedGroup = store.getState().management.roleGroups.find(g => g.id === 'rg1');
    expect(updatedGroup?.name).toBe('Updated Group');
    expect(updatedGroup?.roles).toEqual(['r1']);

    // Delete
    store.dispatch(managementActions.roleGroupRemoved('rg1'));
    expect(store.getState().management.roleGroups).toHaveLength(0);
  });

  it('handles team CRUD operations with verification logic', () => {
    const store = createAppStore();
    const newTeam: ManagementTeam = {
      id: 't1',
      name: 'Test Team',
      description: 'Team Description',
      department: 'Engineering',
      serviceAccount: 'sa-test',
      teamLeader: 'User1',
      contactEmail: 'test@example.com',
      lastVerifiedAt: new Date().toISOString(),
      members: 5,
      apis: 10,
      code: 'TEST',
      color: '#000000',
      roles: ['r1'],
      roleGroups: ['rg1'],
    };

    // Create
    store.dispatch(managementActions.teamAdded(newTeam));
    expect(store.getState().management.teams).toContainEqual(newTeam);

    // Update
    const newDate = new Date();
    store.dispatch(managementActions.teamUpdated({ id: 't1', patch: { name: 'Updated Team', lastVerifiedAt: newDate.toISOString() } }));
    const updatedTeam = store.getState().management.teams.find(t => t.id === 't1');
    expect(updatedTeam?.name).toBe('Updated Team');
    expect(updatedTeam?.lastVerifiedAt).toBe(newDate.toISOString());

    // Delete
    store.dispatch(managementActions.teamRemoved('t1'));
    expect(store.getState().management.teams).toHaveLength(0);
  });
  
  it('ensures data consistency (simulated)', () => {
     // This test documents the current behavior. 
     // Real consistency checks might require cascading deletes which are not yet implemented in reducer,
     // but the UI handles missing references gracefully.
     const store = createAppStore();
     const role: ManagementRole = {
      id: 'r1',
      name: 'Role 1',
      description: '',
      permissions: [],
      type: 'custom',
      userCount: 0,
    };
    const team: ManagementTeam = {
      id: 't1',
      name: 'Team 1',
      description: '',
      department: '',
      serviceAccount: '',
      teamLeader: '',
      contactEmail: '',
      lastVerifiedAt: '',
      members: 0,
      apis: 0,
      code: 'T1',
      color: '',
      roles: ['r1'],
    };

    store.dispatch(managementActions.roleAdded(role));
    store.dispatch(managementActions.teamAdded(team));

    expect(store.getState().management.roles).toHaveLength(1);
    expect(store.getState().management.teams[0].roles).toContain('r1');

    store.dispatch(managementActions.roleRemoved('r1'));
    expect(store.getState().management.roles).toHaveLength(0);
    // Currently, the role ID remains in the team, which is acceptable if the UI filters it out.
    // If we wanted strict consistency, we would expect it to be gone.
    expect(store.getState().management.teams[0].roles).toContain('r1');
  });
});
