import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Switch } from '@/app/components/ui/switch';
import { Textarea } from '@/app/components/ui/textarea';
import { Plus, Search, Users, Database, Mail, Shield, Edit, Trash2, UserPlus, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchManagement, managementActions } from '@/features/management/store';
import type { ManagementConnection } from '@/features/management/types';
import { useTranslation } from 'react-i18next';

type ConnectionType = ManagementConnection['type'];

type ConnectionForm = {
  name: string;
  type: ConnectionType;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  description: string;
};

export function Management() {
  const { t } = useTranslation('management');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionsPage, setConnectionsPage] = useState(1);
  const [connectionsPageSize, setConnectionsPageSize] = useState(10);
  const [teamsPage, setTeamsPage] = useState(1);
  const [teamsPageSize, setTeamsPageSize] = useState(10);
  const [membersPage, setMembersPage] = useState(1);
  const [membersPageSize, setMembersPageSize] = useState(10);
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesPageSize, setRolesPageSize] = useState(10);
  const [roleGroupsPage, setRoleGroupsPage] = useState(1);
  const [roleGroupsPageSize, setRoleGroupsPageSize] = useState(10);

  const dispatch = useAppDispatch();
  const managementStatus = useAppSelector((s) => s.management.status);
  const teams = useAppSelector((s) => s.management.teams);
  const members = useAppSelector((s) => s.management.members);
  const connections = useAppSelector((s) => s.management.connections);
  const roles = useAppSelector((s) => s.management.roles);
  const roleGroups = useAppSelector((s) => s.management.roleGroups);

  useEffect(() => {
    if (managementStatus !== 'idle') return;
    dispatch(fetchManagement());
  }, [dispatch, managementStatus]);

  const canManageConnections = true;
  const connectionTypes: Array<ConnectionType> = [
    'MySQL',
    'PostgreSQL',
    'Oracle',
    'SQL Server',
    'ClickHouse',
    'Snowflake',
    'Redshift',
    'MongoDB',
    'Redis',
    'Cassandra',
    'DynamoDB',
    'BigQuery',
    'MaxCompute',
    'Databricks',
  ];

  const isConnectionType = (v: string): v is ConnectionType => {
    return connectionTypes.includes(v as ConnectionType);
  };

  const defaultPortByType: Partial<Record<ConnectionType, string>> = {
    MySQL: '3306',
    PostgreSQL: '5432',
    Oracle: '1521',
    'SQL Server': '1433',
    ClickHouse: '8123',
    Snowflake: '443',
    Redshift: '5439',
    MongoDB: '27017',
    Redis: '6379',
    Cassandra: '9042',
    DynamoDB: '443',
    BigQuery: '443',
    MaxCompute: '443',
    Databricks: '443',
  };

  const [addConnOpen, setAddConnOpen] = useState(false);
  const [addConnForm, setAddConnForm] = useState<ConnectionForm>({
    name: '',
    type: 'MySQL',
    host: '',
    port: defaultPortByType.MySQL ?? '3306',
    database: '',
    username: '',
    password: '',
    ssl: true,
    description: '',
  });
  const [addConnErrors, setAddConnErrors] = useState<Record<string, string>>({});
  const [addConnTest, setAddConnTest] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const resetAddConn = () => {
    setAddConnForm({
      name: '',
      type: 'MySQL',
      host: '',
      port: defaultPortByType.MySQL ?? '3306',
      database: '',
      username: '',
      password: '',
      ssl: true,
      description: '',
    });
    setAddConnErrors({});
    setAddConnTest('idle');
  };

  const validateConnectionForm = () => {
    const errors: Record<string, string> = {};
    const name = addConnForm.name.trim();
    const host = addConnForm.host.trim();
    const port = addConnForm.port.trim();
    const database = addConnForm.database.trim();
    const username = addConnForm.username.trim();

    if (!name) errors.name = t('connectionForm.validation.nameRequired');
    if (!host && addConnForm.type !== 'BigQuery' && addConnForm.type !== 'MaxCompute')
      errors.host = t('connectionForm.validation.hostRequired');
    if (!port) errors.port = t('connectionForm.validation.portRequired');
    if (port && !/^\d+$/.test(port)) errors.port = t('connectionForm.validation.portNumeric');
    if (!database) errors.database = t('connectionForm.validation.databaseRequired');
    if (!username) errors.username = t('connectionForm.validation.usernameRequired');

    setAddConnErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const simulateTestConnection = async (
    conn: Pick<ConnectionForm, 'type' | 'host' | 'port' | 'database' | 'username' | 'ssl'>,
  ) => {
    const key = `${conn.type}|${conn.host}|${conn.port}|${conn.database}|${conn.username}|${conn.ssl ? '1' : '0'}`;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 1000;
    const succeed = hash % 7 !== 0;
    await new Promise((r) => setTimeout(r, 700 + (hash % 600)));
    return succeed;
  };

  const handleTestExisting = async (id: string) => {
    if (!canManageConnections) {
      toast.error(t('toasts.noConnectionPermission'));
      return;
    }
    const target = connections.find((c) => c.id === id);
    if (!target) return;
    dispatch(
      managementActions.connectionUpdated({
        id,
        patch: { status: 'testing', lastSync: t('connection.status.testingInline') },
      }),
    );
    const ok = await simulateTestConnection(target);
    dispatch(
      managementActions.connectionUpdated({
        id,
        patch: ok
          ? { status: 'connected', lastSync: t('common:time.justNow') }
          : { status: 'error', lastSync: t('connection.status.testFailed') },
      }),
    );
    if (ok) toast.success(t('toasts.connectionTestSuccessWithName', { name: target.name }));
    else toast.error(t('toasts.connectionTestFailedWithName', { name: target.name }));
  };

  const handleAddTest = async () => {
    if (!canManageConnections) {
      toast.error(t('toasts.noConnectionPermission'));
      return;
    }
    if (!validateConnectionForm()) {
      toast.error(t('toasts.fixFormErrorsFirst'));
      return;
    }
    setAddConnTest('testing');
    const ok = await simulateTestConnection(addConnForm);
    setAddConnTest(ok ? 'success' : 'error');
    if (ok) toast.success(t('toasts.connectionTestSuccess'));
    else toast.error(t('toasts.connectionTestFailed'));
  };

  const handleAddSave = () => {
    if (!canManageConnections) {
      toast.error(t('toasts.noConnectionPermission'));
      return;
    }
    if (!validateConnectionForm()) {
      toast.error(t('toasts.fixFormErrorsFirst'));
      return;
    }
    if (addConnTest !== 'success') {
      toast.message(t('toasts.completeConnectionTestFirst'));
      return;
    }
    const nowId = String(Date.now());
    const next: ManagementConnection = {
      id: nowId,
      name: addConnForm.name.trim(),
      type: addConnForm.type,
      host: addConnForm.type === 'BigQuery' && !addConnForm.host.trim() ? 'bigquery.googleapis.com' : addConnForm.host.trim(),
      port: addConnForm.port.trim(),
      database: addConnForm.database.trim(),
      username: addConnForm.username.trim(),
      ssl: addConnForm.ssl,
      status: 'connected',
      lastSync: t('common:time.justNow'),
      description: addConnForm.description.trim() || undefined,
    };
    dispatch(managementActions.connectionAdded(next));
    toast.success(t('toasts.connectionAdded'));
    setAddConnOpen(false);
    resetAddConn();
  };

  const handleRemoveConnection = (id: string) => {
    if (!canManageConnections) {
      toast.error(t('toasts.noConnectionPermission'));
      return;
    }
    dispatch(managementActions.connectionRemoved(id));
    toast.success(t('toasts.connectionRemoved'));
  };

  const getConnectionIcon = () => {
    return <Database className="size-6 text-blue-600" />;
  };

  const getConnectionBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      MySQL: 'bg-blue-100 text-blue-700',
      PostgreSQL: 'bg-indigo-100 text-indigo-700',
      ClickHouse: 'bg-yellow-100 text-yellow-700',
      Oracle: 'bg-red-100 text-red-700',
      'SQL Server': 'bg-slate-100 text-slate-700',
      MongoDB: 'bg-green-100 text-green-700',
      Redis: 'bg-red-100 text-red-700',
      BigQuery: 'bg-blue-100 text-blue-700',
      MaxCompute: 'bg-orange-100 text-orange-700',
      Snowflake: 'bg-cyan-100 text-cyan-700',
      Redshift: 'bg-purple-100 text-purple-700',
      Cassandra: 'bg-teal-100 text-teal-700',
      DynamoDB: 'bg-amber-100 text-amber-800',
      Databricks: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getConnectionFieldMeta = (type: ConnectionType) => {
    const databaseLabelKeyByType: Partial<Record<ConnectionType, string>> = {
      Oracle: 'connectionForm.labels.databaseByType.oracle',
      Snowflake: 'connectionForm.labels.databaseByType.snowflake',
      Redis: 'connectionForm.labels.databaseByType.redis',
      Cassandra: 'connectionForm.labels.databaseByType.cassandra',
      DynamoDB: 'connectionForm.labels.databaseByType.dynamo',
      BigQuery: 'connectionForm.labels.databaseByType.bigquery',
      MaxCompute: 'connectionForm.labels.databaseByType.maxcompute',
      Databricks: 'connectionForm.labels.databaseByType.databricks',
    };

    const hostLabelKeyByType: Partial<Record<ConnectionType, string>> = {
      DynamoDB: 'connectionForm.labels.hostByType.dynamo',
      BigQuery: 'connectionForm.labels.hostByType.bigquery',
      MaxCompute: 'connectionForm.labels.hostByType.maxcompute',
      Databricks: 'connectionForm.labels.hostByType.databricks',
    };

    const usernameLabelKeyByType: Partial<Record<ConnectionType, string>> = {
      BigQuery: 'connectionForm.labels.usernameByType.bigquery',
      MaxCompute: 'connectionForm.labels.usernameByType.maxcompute',
      DynamoDB: 'connectionForm.labels.usernameByType.dynamo',
      Databricks: 'connectionForm.labels.usernameByType.databricks',
      Redis: 'connectionForm.labels.usernameByType.redis',
    };

    const hostPlaceholderKeyByType: Partial<Record<ConnectionType, string>> = {
      MySQL: 'connectionForm.placeholders.hostByType.mysql',
      PostgreSQL: 'connectionForm.placeholders.hostByType.postgresql',
      Oracle: 'connectionForm.placeholders.hostByType.oracle',
      'SQL Server': 'connectionForm.placeholders.hostByType.sqlserver',
      ClickHouse: 'connectionForm.placeholders.hostByType.clickhouse',
      Snowflake: 'connectionForm.placeholders.hostByType.snowflake',
      Redshift: 'connectionForm.placeholders.hostByType.redshift',
      MongoDB: 'connectionForm.placeholders.hostByType.mongodb',
      Redis: 'connectionForm.placeholders.hostByType.redis',
      Cassandra: 'connectionForm.placeholders.hostByType.cassandra',
      DynamoDB: 'connectionForm.placeholders.hostByType.dynamo',
      BigQuery: 'connectionForm.placeholders.hostByType.bigquery',
      MaxCompute: 'connectionForm.placeholders.hostByType.maxcompute',
      Databricks: 'connectionForm.placeholders.hostByType.databricks',
    };

    const databasePlaceholderKeyByType: Partial<Record<ConnectionType, string>> = {
      BigQuery: 'connectionForm.placeholders.databaseByType.bigquery',
      MaxCompute: 'connectionForm.placeholders.databaseByType.maxcompute',
      Redis: 'connectionForm.placeholders.databaseByType.redis',
      Snowflake: 'connectionForm.placeholders.databaseByType.snowflake',
      Oracle: 'connectionForm.placeholders.databaseByType.oracle',
    };

    const passwordLabelKeyByType: Partial<Record<ConnectionType, string>> = {
      BigQuery: 'connectionForm.labels.passwordByType.bigquery',
      MaxCompute: 'connectionForm.labels.passwordByType.maxcompute',
      DynamoDB: 'connectionForm.labels.passwordByType.dynamo',
      Databricks: 'connectionForm.labels.passwordByType.databricks',
    };

    return {
      hostLabel: t(hostLabelKeyByType[type] ?? 'connectionForm.labels.host'),
      hostPlaceholder: t(hostPlaceholderKeyByType[type] ?? 'connectionForm.placeholders.host'),
      databaseLabel: t(databaseLabelKeyByType[type] ?? 'connectionForm.labels.database'),
      databasePlaceholder: t(databasePlaceholderKeyByType[type] ?? 'connectionForm.placeholders.database'),
      usernameLabel: t(usernameLabelKeyByType[type] ?? 'connectionForm.labels.username'),
      passwordLabel: t(passwordLabelKeyByType[type] ?? 'connectionForm.labels.password'),
    };
  };

  const buildPageModel = (currentPage: number, totalPages: number) => {
    const items: Array<number | 'ellipsis'> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
      return items;
    }

    items.push(1);
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) items.push('ellipsis');
    for (let i = left; i <= right; i++) items.push(i);
    if (right < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
    return items;
  };

  const filteredConnections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.host.toLowerCase().includes(q) ||
        c.database.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
      );
    });
  }, [connections, searchTerm]);

  const connectionsTotalPages = Math.max(1, Math.ceil(filteredConnections.length / connectionsPageSize));
  const connectionsCurrentPage = Math.min(connectionsPage, connectionsTotalPages);
  const pagedConnections = useMemo(() => {
    const start = (connectionsCurrentPage - 1) * connectionsPageSize;
    return filteredConnections.slice(start, start + connectionsPageSize);
  }, [connectionsCurrentPage, connectionsPageSize, filteredConnections]);
  const connectionsPageModel = useMemo(
    () => buildPageModel(connectionsCurrentPage, connectionsTotalPages),
    [connectionsCurrentPage, connectionsTotalPages],
  );

  const filteredTeams = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
  }, [searchTerm, teams]);

  const teamsTotalPages = Math.max(1, Math.ceil(filteredTeams.length / teamsPageSize));
  const teamsCurrentPage = Math.min(teamsPage, teamsTotalPages);
  const pagedTeams = useMemo(() => {
    const start = (teamsCurrentPage - 1) * teamsPageSize;
    return filteredTeams.slice(start, start + teamsPageSize);
  }, [filteredTeams, teamsCurrentPage, teamsPageSize]);
  const teamsPageModel = useMemo(
    () => buildPageModel(teamsCurrentPage, teamsTotalPages),
    [teamsCurrentPage, teamsTotalPages],
  );

  const filteredMembers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.team.toLowerCase().includes(q)
      );
    });
  }, [members, searchTerm]);

  const membersTotalPages = Math.max(1, Math.ceil(filteredMembers.length / membersPageSize));
  const membersCurrentPage = Math.min(membersPage, membersTotalPages);
  const pagedMembers = useMemo(() => {
    const start = (membersCurrentPage - 1) * membersPageSize;
    return filteredMembers.slice(start, start + membersPageSize);
  }, [filteredMembers, membersCurrentPage, membersPageSize]);
  const membersPageModel = useMemo(
    () => buildPageModel(membersCurrentPage, membersTotalPages),
    [membersCurrentPage, membersTotalPages],
  );

  const filteredRoles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [roles, searchTerm]);

  const rolesTotalPages = Math.max(1, Math.ceil(filteredRoles.length / rolesPageSize));
  const rolesCurrentPage = Math.min(rolesPage, rolesTotalPages);
  const pagedRoles = useMemo(() => {
    const start = (rolesCurrentPage - 1) * rolesPageSize;
    return filteredRoles.slice(start, start + rolesPageSize);
  }, [filteredRoles, rolesCurrentPage, rolesPageSize]);
  const rolesPageModel = useMemo(
    () => buildPageModel(rolesCurrentPage, rolesTotalPages),
    [rolesCurrentPage, rolesTotalPages],
  );

  const filteredRoleGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return roleGroups;
    return roleGroups.filter((g) => {
      return (
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.roles.some((r) => r.toLowerCase().includes(q))
      );
    });
  }, [roleGroups, searchTerm]);

  const roleGroupsTotalPages = Math.max(1, Math.ceil(filteredRoleGroups.length / roleGroupsPageSize));
  const roleGroupsCurrentPage = Math.min(roleGroupsPage, roleGroupsTotalPages);
  const pagedRoleGroups = useMemo(() => {
    const start = (roleGroupsCurrentPage - 1) * roleGroupsPageSize;
    return filteredRoleGroups.slice(start, start + roleGroupsPageSize);
  }, [filteredRoleGroups, roleGroupsCurrentPage, roleGroupsPageSize]);
  const roleGroupsPageModel = useMemo(
    () => buildPageModel(roleGroupsCurrentPage, roleGroupsTotalPages),
    [roleGroupsCurrentPage, roleGroupsTotalPages],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <Database className="size-4" />
            {t('tabs.connections')}
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Users className="size-4" />
            {t('tabs.teams')}
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UserPlus className="size-4" />
            {t('tabs.members')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="size-4" />
            {t('tabs.roles')}
          </TabsTrigger>
          <TabsTrigger value="rolegroups" className="gap-2">
            <UserCog className="size-4" />
            {t('tabs.roleGroups')}
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('connections.searchPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setConnectionsPage(1);
                }}
              />
            </div>
            <Button
              className="gap-2"
              onClick={() => {
                if (!canManageConnections) {
                  toast.error(t('toasts.noConnectionPermission'));
                  return;
                }
                setAddConnOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t('connections.add')}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-470px)] overflow-y-auto pr-2">
              {pagedConnections.map((conn) => (
                <Card key={conn.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="size-12 bg-blue-100 rounded flex items-center justify-center">
                        {getConnectionIcon()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3>{conn.name}</h3>
                          <Badge className={getConnectionBadgeColor(conn.type)}>
                            {conn.type}
                          </Badge>
                          {conn.status === 'connected' && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              {t('connections.status.connected')}
                            </Badge>
                          )}
                          {conn.status === 'testing' && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              {t('connections.status.testing')}
                            </Badge>
                          )}
                          {conn.status === 'error' && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              {t('connections.status.error')}
                            </Badge>
                          )}
                          {conn.ssl && (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="size-3" />
                              SSL
                            </Badge>
                          )}
                        </div>
                        {conn.description && (
                          <p className="text-sm text-muted-foreground mb-3">{conn.description}</p>
                        )}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('connections.fields.host')}: </span>
                            <span className="font-mono">{conn.host}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('connections.fields.port')}: </span>
                            <span className="font-mono">{conn.port}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('connections.fields.database')}: </span>
                            <span className="font-mono">{conn.database}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {t('connections.fields.lastSync')}: {conn.lastSync}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={conn.status === 'testing'}
                        onClick={() => handleTestExisting(conn.id)}
                      >
                        {conn.status === 'testing' ? t('connection.status.testingInline') : t('connections.test')}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveConnection(conn.id)}
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('pagination.total', { count: filteredConnections.length })}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
                <Select
                  value={String(connectionsPageSize)}
                  onValueChange={(v) => {
                    setConnectionsPageSize(Number(v));
                    setConnectionsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 12, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {t('pagination.pageSize', { count: n })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="justify-end">
              <PaginationContent className="ml-auto">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setConnectionsPage((p) => Math.max(1, p - 1));
                    }}
                    className={connectionsCurrentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
                {connectionsPageModel.map((item, idx) => {
                  if (item === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === connectionsCurrentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setConnectionsPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setConnectionsPage((p) => Math.min(connectionsTotalPages, p + 1));
                    }}
                    className={connectionsCurrentPage === connectionsTotalPages ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {filteredConnections.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t('connections.empty')}</p>
              </Card>
            )}
          </div>

          <Dialog
            open={addConnOpen}
            onOpenChange={(open) => {
              setAddConnOpen(open);
              if (!open) resetAddConn();
            }}
          >
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t('connections.addDialog.title')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('connectionForm.fields.name')}</Label>
                    <Input
                      placeholder={t('connectionForm.placeholders.name')}
                      value={addConnForm.name}
                      onChange={(e) => {
                        setAddConnForm((p) => ({ ...p, name: e.target.value }));
                        if (addConnErrors.name) setAddConnErrors((p) => ({ ...p, name: '' }));
                      }}
                    />
                    {addConnErrors.name ? <div className="text-xs text-red-600">{addConnErrors.name}</div> : null}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('connectionForm.fields.type')}</Label>
                    <Select
                      value={addConnForm.type}
                      onValueChange={(v) => {
                        if (!isConnectionType(v)) return;
                        const type = v;
                        const nextPort = defaultPortByType[type] ?? addConnForm.port;
                        const nextHost =
                          type === 'BigQuery'
                            ? 'bigquery.googleapis.com'
                            : type === 'MaxCompute'
                              ? 'maxcompute.aliyun.com'
                              : addConnForm.host;
                        setAddConnForm((p) => ({
                          ...p,
                          type,
                          port: nextPort,
                          host: nextHost,
                        }));
                        setAddConnErrors({});
                        setAddConnTest('idle');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {connectionTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(() => {
                    const meta = getConnectionFieldMeta(addConnForm.type);
                    const hostDisabled = addConnForm.type === 'BigQuery';
                    return (
                      <>
                        <div className="space-y-2">
                          <Label>{meta.hostLabel}</Label>
                          <Input
                            placeholder={meta.hostPlaceholder}
                            value={addConnForm.host}
                            disabled={hostDisabled}
                            onChange={(e) => {
                              setAddConnForm((p) => ({ ...p, host: e.target.value }));
                              if (addConnErrors.host) setAddConnErrors((p) => ({ ...p, host: '' }));
                              setAddConnTest('idle');
                            }}
                          />
                          {addConnErrors.host ? <div className="text-xs text-red-600">{addConnErrors.host}</div> : null}
                        </div>

                        <div className="space-y-2">
                          <Label>{t('connectionForm.fields.port')}</Label>
                          <Input
                            placeholder={t('connectionForm.placeholders.port')}
                            value={addConnForm.port}
                            onChange={(e) => {
                              setAddConnForm((p) => ({ ...p, port: e.target.value }));
                              if (addConnErrors.port) setAddConnErrors((p) => ({ ...p, port: '' }));
                              setAddConnTest('idle');
                            }}
                          />
                          {addConnErrors.port ? <div className="text-xs text-red-600">{addConnErrors.port}</div> : null}
                        </div>

                        <div className="space-y-2">
                          <Label>{meta.databaseLabel}</Label>
                          <Input
                            placeholder={meta.databasePlaceholder}
                            value={addConnForm.database}
                            onChange={(e) => {
                              setAddConnForm((p) => ({ ...p, database: e.target.value }));
                              if (addConnErrors.database) setAddConnErrors((p) => ({ ...p, database: '' }));
                              setAddConnTest('idle');
                            }}
                          />
                          {addConnErrors.database ? (
                            <div className="text-xs text-red-600">{addConnErrors.database}</div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>{meta.usernameLabel}</Label>
                          <Input
                            placeholder={t('connectionForm.placeholders.username')}
                            value={addConnForm.username}
                            onChange={(e) => {
                              setAddConnForm((p) => ({ ...p, username: e.target.value }));
                              if (addConnErrors.username) setAddConnErrors((p) => ({ ...p, username: '' }));
                              setAddConnTest('idle');
                            }}
                          />
                          {addConnErrors.username ? (
                            <div className="text-xs text-red-600">{addConnErrors.username}</div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label>{meta.passwordLabel}</Label>
                          <Input
                            type="password"
                            placeholder={t('connectionForm.placeholders.password')}
                            value={addConnForm.password}
                            onChange={(e) => {
                              setAddConnForm((p) => ({ ...p, password: e.target.value }));
                              setAddConnTest('idle');
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>SSL</Label>
                          <div className="h-10 flex items-center gap-3 rounded-md border px-3">
                            <Switch
                              checked={addConnForm.ssl}
                              onCheckedChange={(checked) => {
                                setAddConnForm((p) => ({ ...p, ssl: checked }));
                                setAddConnTest('idle');
                              }}
                            />
                            <div className="text-sm text-muted-foreground">
                              {addConnForm.ssl ? t('connectionForm.ssl.enabled') : t('connectionForm.ssl.disabled')}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>{t('connectionForm.fields.descriptionOptional')}</Label>
                  <Textarea
                    placeholder={t('connectionForm.placeholders.description')}
                    value={addConnForm.description}
                    onChange={(e) => setAddConnForm((p) => ({ ...p, description: e.target.value }))}
                    className="min-h-[90px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {addConnTest === 'idle' && t('connectionForm.testHint.idle')}
                    {addConnTest === 'testing' && t('connectionForm.testHint.testing')}
                    {addConnTest === 'success' && t('connectionForm.testHint.success')}
                    {addConnTest === 'error' && t('connectionForm.testHint.error')}
                  </div>
                  <Button variant="outline" onClick={handleAddTest} disabled={addConnTest === 'testing'}>
                    {addConnTest === 'testing' ? t('connection.status.testingInline') : t('connections.test')}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddConnOpen(false);
                    resetAddConn();
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button onClick={handleAddSave}>{t('actions.save')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Database Type Reference */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="mb-3 text-blue-900">{t('connections.reference.title')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-semibold text-blue-900 mb-2">{t('connections.reference.groups.relational')}</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• MySQL</li>
                  <li>• PostgreSQL</li>
                  <li>• Oracle</li>
                  <li>• SQL Server</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-2">{t('connections.reference.groups.olap')}</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• ClickHouse</li>
                  <li>• Snowflake</li>
                  <li>• Redshift</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-2">{t('connections.reference.groups.nosql')}</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• MongoDB</li>
                  <li>• Redis</li>
                  <li>• Cassandra</li>
                  <li>• DynamoDB</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-2">{t('connections.reference.groups.cloud')}</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• BigQuery</li>
                  <li>• MaxCompute</li>
                  <li>• Databricks</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('teams.searchPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setTeamsPage(1);
                }}
              />
            </div>
            <Button className="gap-2">
              <Plus className="size-4" />
              {t('teams.create')}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-360px)] overflow-y-auto pr-2">
              {pagedTeams.map((team) => (
                <Card key={team.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-12 ${team.color} rounded flex items-center justify-center text-white`}>
                        {team.code.charAt(0)}
                      </div>
                      <div>
                        <h3 className="mb-1">{team.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{team.code}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="size-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">{t('teams.fields.members')}</div>
                      <div className="text-2xl">{team.members}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">{t('teams.fields.apis')}</div>
                      <div className="text-2xl">{team.apis}</div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <Users className="size-4" />
                    {t('teams.viewMembers')}
                  </Button>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('pagination.total', { count: filteredTeams.length })}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
                <Select
                  value={String(teamsPageSize)}
                  onValueChange={(v) => {
                    setTeamsPageSize(Number(v));
                    setTeamsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 12, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {t('pagination.pageSize', { count: n })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="justify-end">
              <PaginationContent className="ml-auto">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setTeamsPage((p) => Math.max(1, p - 1));
                    }}
                    className={teamsCurrentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
                {teamsPageModel.map((item, idx) => {
                  if (item === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === teamsCurrentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setTeamsPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setTeamsPage((p) => Math.min(teamsTotalPages, p + 1));
                    }}
                    className={teamsCurrentPage === teamsTotalPages ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {filteredTeams.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t('teams.empty')}</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('members.searchPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setMembersPage(1);
                }}
              />
            </div>
            <Button className="gap-2">
              <Plus className="size-4" />
              {t('members.invite')}
            </Button>
          </div>

          <Card>
            <div className="divide-y max-h-[calc(100vh-360px)] overflow-y-auto">
              {pagedMembers.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3>{member.name}</h3>
                        {member.status === 'active' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {t('members.status.active')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-600">
                            {t('members.status.inactive')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {member.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="size-3" />
                          {member.role}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {member.team}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('pagination.total', { count: filteredMembers.length })}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
              <Select
                value={String(membersPageSize)}
                onValueChange={(v) => {
                  setMembersPageSize(Number(v));
                  setMembersPage(1);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 12, 15, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {t('pagination.pageSize', { count: n })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Pagination className="justify-end">
            <PaginationContent className="ml-auto">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMembersPage((p) => Math.max(1, p - 1));
                  }}
                  className={membersCurrentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
              {membersPageModel.map((item, idx) => {
                if (item === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === membersCurrentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setMembersPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMembersPage((p) => Math.min(membersTotalPages, p + 1));
                  }}
                  className={membersCurrentPage === membersTotalPages ? 'pointer-events-none opacity-50' : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {filteredMembers.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">{t('members.empty')}</p>
            </Card>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('roles.searchPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setRolesPage(1);
                }}
              />
            </div>
            <Button className="gap-2">
              <Plus className="size-4" />
              {t('roles.create')}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-460px)] overflow-y-auto pr-2">
              {pagedRoles.map((role) => (
                <Card key={role.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 bg-purple-100 rounded flex items-center justify-center">
                        <Shield className="size-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3>{role.name}</h3>
                          {role.type === 'system' && (
                            <Badge variant="outline">{t('roles.systemRole')}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                    {role.type === 'custom' && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-2">{t('roles.permissionsList')}</div>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t('roles.userCount', { count: role.userCount })}
                    </div>
                    <Button variant="outline" size="sm">
                      {t('roles.viewUsers')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('pagination.total', { count: filteredRoles.length })}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
                <Select
                  value={String(rolesPageSize)}
                  onValueChange={(v) => {
                    setRolesPageSize(Number(v));
                    setRolesPage(1);
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 12, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {t('pagination.pageSize', { count: n })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="justify-end">
              <PaginationContent className="ml-auto">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setRolesPage((p) => Math.max(1, p - 1));
                    }}
                    className={rolesCurrentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
                {rolesPageModel.map((item, idx) => {
                  if (item === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === rolesCurrentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setRolesPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setRolesPage((p) => Math.min(rolesTotalPages, p + 1));
                    }}
                    className={rolesCurrentPage === rolesTotalPages ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {filteredRoles.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t('roles.empty')}</p>
              </Card>
            )}
          </div>

          <Card className="p-6 bg-purple-50 border-purple-200">
            <h3 className="mb-3 text-purple-900">{t('roles.permissionsReference.title')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="font-semibold text-purple-900 mb-2">{t('roles.permissionsReference.groups.api')}</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• {t('roles.permissionsReference.items.api.create')}</li>
                  <li>• {t('roles.permissionsReference.items.api.edit')}</li>
                  <li>• {t('roles.permissionsReference.items.api.delete')}</li>
                  <li>• {t('roles.permissionsReference.items.api.view')}</li>
                  <li>• {t('roles.permissionsReference.items.api.test')}</li>
                  <li>• {t('roles.permissionsReference.items.api.publish')}</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">{t('roles.permissionsReference.groups.data')}</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• {t('roles.permissionsReference.items.data.viewDatasets')}</li>
                  <li>• {t('roles.permissionsReference.items.data.editDatasets')}</li>
                  <li>• {t('roles.permissionsReference.items.data.manageConnections')}</li>
                  <li>• {t('roles.permissionsReference.items.data.viewData')}</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">{t('roles.permissionsReference.groups.approval')}</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• {t('roles.permissionsReference.items.approval.approveApi')}</li>
                  <li>• {t('roles.permissionsReference.items.approval.viewHistory')}</li>
                  <li>• {t('roles.permissionsReference.items.approval.revoke')}</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">{t('roles.permissionsReference.groups.system')}</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• {t('roles.permissionsReference.items.system.userManagement')}</li>
                  <li>• {t('roles.permissionsReference.items.system.roleManagement')}</li>
                  <li>• {t('roles.permissionsReference.items.system.settings')}</li>
                  <li>• {t('roles.permissionsReference.items.system.viewLogs')}</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">{t('roles.permissionsReference.groups.ops')}</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• {t('roles.permissionsReference.items.ops.viewMonitoring')}</li>
                  <li>• {t('roles.permissionsReference.items.ops.viewAlerts')}</li>
                  <li>• {t('roles.permissionsReference.items.ops.performance')}</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Role Groups Tab */}
        <TabsContent value="rolegroups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('roleGroups.searchPlaceholder')}
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setRoleGroupsPage(1);
                }}
              />
            </div>
            <Button className="gap-2">
              <Plus className="size-4" />
              {t('roleGroups.create')}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-360px)] overflow-y-auto pr-2">
              {pagedRoleGroups.map((group) => (
                <Card key={group.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 bg-blue-100 rounded flex items-center justify-center">
                        <UserCog className="size-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="mb-1">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-2">{t('roleGroups.includedRoles')}</div>
                    <div className="space-y-2">
                      {group.roles.map((role) => (
                        <div key={role} className="flex items-center gap-2 text-sm">
                          <Shield className="size-3 text-purple-600" />
                          <span>{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {t('roleGroups.userCount', { count: group.userCount })}
                    </div>
                    <Button variant="outline" size="sm">
                      {t('roleGroups.manageMembers')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('pagination.total', { count: filteredRoleGroups.length })}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
                <Select
                  value={String(roleGroupsPageSize)}
                  onValueChange={(v) => {
                    setRoleGroupsPageSize(Number(v));
                    setRoleGroupsPage(1);
                  }}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 12, 15, 20].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {t('pagination.pageSize', { count: n })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Pagination className="justify-end">
              <PaginationContent className="ml-auto">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setRoleGroupsPage((p) => Math.max(1, p - 1));
                    }}
                    className={roleGroupsCurrentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
                {roleGroupsPageModel.map((item, idx) => {
                  if (item === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === roleGroupsCurrentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          setRoleGroupsPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setRoleGroupsPage((p) => Math.min(roleGroupsTotalPages, p + 1));
                    }}
                    className={roleGroupsCurrentPage === roleGroupsTotalPages ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            {filteredRoleGroups.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">{t('roleGroups.empty')}</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
