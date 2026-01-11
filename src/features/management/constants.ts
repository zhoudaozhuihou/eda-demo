export const PERMISSION_MODULES = [
  {
    id: 'api_management',
    name: 'API Management',
    functions: [
      { id: 'api_view', name: 'View APIs' },
      { id: 'api_create', name: 'Create APIs' },
      { id: 'api_edit', name: 'Edit APIs' },
      { id: 'api_delete', name: 'Delete APIs' },
      { id: 'api_publish', name: 'Publish APIs' },
    ],
  },
  {
    id: 'user_management',
    name: 'User Management',
    functions: [
      { id: 'user_view', name: 'View Users' },
      { id: 'user_invite', name: 'Invite Users' },
      { id: 'user_edit', name: 'Edit Users' },
      { id: 'user_delete', name: 'Delete Users' },
    ],
  },
  {
    id: 'team_management',
    name: 'Team Management',
    functions: [
      { id: 'team_view', name: 'View Teams' },
      { id: 'team_create', name: 'Create Teams' },
      { id: 'team_edit', name: 'Edit Teams' },
      { id: 'team_delete', name: 'Delete Teams' },
    ],
  },
  {
    id: 'audit_logs',
    name: 'Audit Logs',
    functions: [
      { id: 'audit_view', name: 'View Logs' },
      { id: 'audit_export', name: 'Export Logs' },
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    functions: [
      { id: 'settings_view', name: 'View Settings' },
      { id: 'settings_edit', name: 'Edit Settings' },
    ],
  },
] as const;

export type PermissionModuleId = typeof PERMISSION_MODULES[number]['id'];
export type PermissionFunctionId = typeof PERMISSION_MODULES[number]['functions'][number]['id'];
