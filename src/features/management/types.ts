export type ManagementTeam = {
  id: string;
  name: string;
  description: string;
  department: string;
  serviceAccount: string;
  teamLeader: string; // User ID or Name
  contactEmail: string;
  lastVerifiedAt: string; // ISO Date
  members: number;
  apis: number;
  code: string;
  color: string;
  roles?: string[]; // Role IDs
  roleGroups?: string[]; // Role Group IDs
};

export type ManagementMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  status: 'active' | 'inactive';
};

export type ManagementConnection = {
  id: string;
  name: string;
  type:
    | 'MySQL'
    | 'PostgreSQL'
    | 'ClickHouse'
    | 'Oracle'
    | 'SQL Server'
    | 'MongoDB'
    | 'Redis'
    | 'BigQuery'
    | 'MaxCompute'
    | 'Snowflake'
    | 'Redshift'
    | 'Cassandra'
    | 'DynamoDB'
    | 'Databricks';
  host: string;
  port: string;
  database: string;
  username: string;
  status: 'connected' | 'error' | 'testing';
  lastSync: string;
  ssl: boolean;
  description?: string;
};

export type ManagementRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  type: 'system' | 'custom';
};

export type ManagementRoleGroup = {
  id: string;
  name: string;
  description: string;
  roles: string[];
  userCount: number;
};

