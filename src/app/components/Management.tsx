import { useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Plus, Search, Users, Database, Mail, Shield, Edit, Trash2, UserPlus, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface Connection {
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
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  type: 'system' | 'custom';
}

interface RoleGroup {
  id: string;
  name: string;
  description: string;
  roles: string[];
  userCount: number;
}

export function Management() {
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

  const teams = [
    { id: '1', name: '技术团队', members: 12, apis: 45, code: 'TECH', color: 'bg-blue-500' },
    { id: '2', name: '产品团队', members: 8, apis: 23, code: 'PROD', color: 'bg-green-500' },
    { id: '3', name: '数据团队', members: 15, apis: 67, code: 'DATA', color: 'bg-purple-500' },
    { id: '4', name: '运营团队', members: 6, apis: 12, code: 'OPS', color: 'bg-orange-500' },
  ];

  const members = [
    { id: '1', name: '张三', email: 'zhangsan@company.com', role: '管理员', team: '技术团队', status: 'active' },
    { id: '2', name: '李四', email: 'lisi@company.com', role: '开发者', team: '技术团队', status: 'active' },
    { id: '3', name: '王五', email: 'wangwu@company.com', role: '数据工程师', team: '数据团队', status: 'active' },
    { id: '4', name: '赵六', email: 'zhaoliu@company.com', role: '产品经理', team: '产品团队', status: 'active' },
    { id: '5', name: '钱七', email: 'qianqi@company.com', role: '开发者', team: '技术团队', status: 'inactive' },
  ];

  const [connections, setConnections] = useState<Connection[]>([
    {
      id: '1',
      name: 'MySQL-生产库',
      type: 'MySQL',
      host: 'prod-mysql.company.com',
      port: '3306',
      database: 'production',
      username: 'admin',
      status: 'connected',
      lastSync: '2 分钟前',
      ssl: true,
      description: '主生产数据库，存储核心业务数据',
    },
    {
      id: '2',
      name: 'PostgreSQL-数仓',
      type: 'PostgreSQL',
      host: 'dw-postgres.company.com',
      port: '5432',
      database: 'warehouse',
      username: 'dw_admin',
      status: 'connected',
      lastSync: '5 分钟前',
      ssl: true,
      description: '数据仓库，用于分析和报表',
    },
    {
      id: '3',
      name: 'ClickHouse-分析库',
      type: 'ClickHouse',
      host: 'analytics-ch.company.com',
      port: '8123',
      database: 'analytics',
      username: 'analytics',
      status: 'connected',
      lastSync: '1 小时前',
      ssl: false,
      description: 'OLAP分析数据库，实时数据分析',
    },
    {
      id: '4',
      name: 'MongoDB-用户数据',
      type: 'MongoDB',
      host: 'mongo.company.com',
      port: '27017',
      database: 'userdata',
      username: 'mongo_user',
      status: 'connected',
      lastSync: '10 分钟前',
      ssl: true,
      description: '存储用户行为和日志数据',
    },
    {
      id: '5',
      name: 'BigQuery-云数仓',
      type: 'BigQuery',
      host: 'bigquery.googleapis.com',
      port: '443',
      database: 'company-project.analytics',
      username: 'service-account',
      status: 'connected',
      lastSync: '15 分钟前',
      ssl: true,
      description: 'Google Cloud数据仓库',
    },
    {
      id: '6',
      name: 'MaxCompute-大数据平台',
      type: 'MaxCompute',
      host: 'maxcompute.aliyun.com',
      port: '443',
      database: 'company_project',
      username: 'accesskey',
      status: 'connected',
      lastSync: '30 分钟前',
      ssl: true,
      description: '阿里云MaxCompute大数据计算平台',
    },
    {
      id: '7',
      name: 'Redis-缓存',
      type: 'Redis',
      host: 'redis.company.com',
      port: '6379',
      database: '0',
      username: 'default',
      status: 'connected',
      lastSync: '1 分钟前',
      ssl: false,
      description: '缓存数据库',
    },
  ]);

  const canManageConnections = true;
  const connectionTypes: Array<Connection['type']> = [
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

  const defaultPortByType: Partial<Record<Connection['type'], string>> = {
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
  const [addConnForm, setAddConnForm] = useState<{
    name: string;
    type: Connection['type'];
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    description: string;
  }>({
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

    if (!name) errors.name = '请输入连接名称';
    if (!host && addConnForm.type !== 'BigQuery' && addConnForm.type !== 'MaxCompute') errors.host = '请输入主机地址';
    if (!port) errors.port = '请输入端口';
    if (port && !/^\d+$/.test(port)) errors.port = '端口必须为数字';
    if (!database) errors.database = '请输入数据库/实例标识';
    if (!username) errors.username = '请输入用户名/账号';

    setAddConnErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const simulateTestConnection = async (conn: Pick<Connection, 'type' | 'host' | 'port' | 'database' | 'username' | 'ssl'>) => {
    const key = `${conn.type}|${conn.host}|${conn.port}|${conn.database}|${conn.username}|${conn.ssl ? '1' : '0'}`;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 1000;
    const succeed = hash % 7 !== 0;
    await new Promise((r) => setTimeout(r, 700 + (hash % 600)));
    return succeed;
  };

  const handleTestExisting = async (id: string) => {
    if (!canManageConnections) {
      toast.error('当前账号无连接管理权限');
      return;
    }
    const target = connections.find((c) => c.id === id);
    if (!target) return;
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'testing', lastSync: '测试中...' } : c)));
    const ok = await simulateTestConnection(target);
    setConnections((prev) =>
      prev.map((c) =>
        c.id !== id
          ? c
          : ok
            ? { ...c, status: 'connected', lastSync: '刚刚' }
            : { ...c, status: 'error', lastSync: '测试失败' },
      ),
    );
    if (ok) toast.success(`连接测试通过：${target.name}`);
    else toast.error(`连接测试失败：${target.name}`);
  };

  const handleAddTest = async () => {
    if (!canManageConnections) {
      toast.error('当前账号无连接管理权限');
      return;
    }
    if (!validateConnectionForm()) {
      toast.error('请先修正表单错误');
      return;
    }
    setAddConnTest('testing');
    const ok = await simulateTestConnection(addConnForm);
    setAddConnTest(ok ? 'success' : 'error');
    if (ok) toast.success('连接测试通过');
    else toast.error('连接测试失败，请检查参数');
  };

  const handleAddSave = () => {
    if (!canManageConnections) {
      toast.error('当前账号无连接管理权限');
      return;
    }
    if (!validateConnectionForm()) {
      toast.error('请先修正表单错误');
      return;
    }
    if (addConnTest !== 'success') {
      toast.message('请先完成连接测试并通过');
      return;
    }
    const nowId = String(Date.now());
    const next: Connection = {
      id: nowId,
      name: addConnForm.name.trim(),
      type: addConnForm.type,
      host: addConnForm.type === 'BigQuery' && !addConnForm.host.trim() ? 'bigquery.googleapis.com' : addConnForm.host.trim(),
      port: addConnForm.port.trim(),
      database: addConnForm.database.trim(),
      username: addConnForm.username.trim(),
      ssl: addConnForm.ssl,
      status: 'connected',
      lastSync: '刚刚',
      description: addConnForm.description.trim() || undefined,
    };
    setConnections((prev) => [next, ...prev]);
    toast.success('连接已添加');
    setAddConnOpen(false);
    resetAddConn();
  };

  const [roles] = useState<Role[]>([
    {
      id: '1',
      name: '超级管理员',
      description: '拥有系统所有权限',
      permissions: ['全部权限'],
      userCount: 2,
      type: 'system',
    },
    {
      id: '2',
      name: 'API开发者',
      description: '可以创建、编辑和发布API',
      permissions: ['创建API', '编辑API', '查看API', '测试API', '查看数据集', '查看连接'],
      userCount: 15,
      type: 'custom',
    },
    {
      id: '3',
      name: '数据分析师',
      description: '可以查看和使用API',
      permissions: ['查看API', '测试API', '查看数据集'],
      userCount: 8,
      type: 'custom',
    },
    {
      id: '4',
      name: '审核员',
      description: '可以审批API上线和下线',
      permissions: ['查看API', '审批API', '查看审核记录'],
      userCount: 5,
      type: 'custom',
    },
    {
      id: '5',
      name: '运维工程师',
      description: '可以管理连接和监控系统',
      permissions: ['管理连接', '查看监控', '查看日志', '系统配置'],
      userCount: 4,
      type: 'custom',
    },
  ]);

  const [roleGroups] = useState<RoleGroup[]>([
    {
      id: '1',
      name: '开发组',
      description: '研发团队角色组',
      roles: ['API开发者', '数据分析师'],
      userCount: 23,
    },
    {
      id: '2',
      name: '管理组',
      description: '管理团队角色组',
      roles: ['超级管理员', '审核员'],
      userCount: 7,
    },
    {
      id: '3',
      name: '运维组',
      description: '运维团队角色组',
      roles: ['运维工程师', 'API开发者'],
      userCount: 4,
    },
  ]);

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

  const getConnectionFieldMeta = (type: Connection['type']) => {
    const databaseLabelByType: Partial<Record<Connection['type'], string>> = {
      MySQL: '数据库',
      PostgreSQL: '数据库',
      Oracle: 'Service Name/SID',
      'SQL Server': '数据库',
      ClickHouse: '数据库',
      Snowflake: '数据库/Schema',
      Redshift: '数据库',
      MongoDB: '数据库',
      Redis: 'DB Index',
      Cassandra: 'Keyspace',
      DynamoDB: '表前缀/命名空间',
      BigQuery: 'Project.Dataset',
      MaxCompute: 'Project',
      Databricks: 'Workspace/SQL Warehouse',
    };

    const hostLabelByType: Partial<Record<Connection['type'], string>> = {
      DynamoDB: 'Endpoint/Region',
      BigQuery: 'Host',
      MaxCompute: 'Host',
      Databricks: 'Host',
    };

    const usernameLabelByType: Partial<Record<Connection['type'], string>> = {
      BigQuery: 'Service Account',
      MaxCompute: 'AccessKey ID',
      DynamoDB: 'AccessKey ID',
      Databricks: 'Token/账号',
      Redis: '用户名（可选）',
    };

    const hostPlaceholderByType: Partial<Record<Connection['type'], string>> = {
      MySQL: '例：mysql.company.com',
      PostgreSQL: '例：postgres.company.com',
      Oracle: '例：oracle.company.com',
      'SQL Server': '例：sqlserver.company.com',
      ClickHouse: '例：clickhouse.company.com',
      Snowflake: '例：xxx.snowflakecomputing.com',
      Redshift: '例：xxx.redshift.amazonaws.com',
      MongoDB: '例：mongo.company.com',
      Redis: '例：redis.company.com',
      Cassandra: '例：cassandra.company.com',
      DynamoDB: '例：dynamodb.ap-southeast-1.amazonaws.com',
      BigQuery: 'bigquery.googleapis.com',
      MaxCompute: 'maxcompute.aliyun.com',
      Databricks: '例：dbc-xxx.cloud.databricks.com',
    };

    const databasePlaceholderByType: Partial<Record<Connection['type'], string>> = {
      BigQuery: '例：company-project.analytics',
      MaxCompute: '例：company_project',
      Redis: '例：0',
      Snowflake: '例：analytics.public',
      Oracle: '例：ORCL',
    };

    const passwordLabelByType: Partial<Record<Connection['type'], string>> = {
      BigQuery: '密钥（可选）',
      MaxCompute: 'AccessKey Secret',
      DynamoDB: 'SecretAccessKey',
      Databricks: 'Token',
    };

    return {
      hostLabel: hostLabelByType[type] ?? '主机地址',
      hostPlaceholder: hostPlaceholderByType[type] ?? '请输入主机地址',
      databaseLabel: databaseLabelByType[type] ?? '数据库/实例标识',
      databasePlaceholder: databasePlaceholderByType[type] ?? '请输入数据库/实例标识',
      usernameLabel: usernameLabelByType[type] ?? '用户名/账号',
      passwordLabel: passwordLabelByType[type] ?? '密码',
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
        <h1 className="text-3xl mb-2">管理中心</h1>
        <p className="text-muted-foreground">管理团队、成员、连接和权限</p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <Database className="size-4" />
            连接管理
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Users className="size-4" />
            团队管理
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <UserPlus className="size-4" />
            成员管理
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="size-4" />
            角色管理
          </TabsTrigger>
          <TabsTrigger value="rolegroups" className="gap-2">
            <UserCog className="size-4" />
            角色组管理
          </TabsTrigger>
        </TabsList>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索连接..."
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
                  toast.error('当前账号无连接管理权限');
                  return;
                }
                setAddConnOpen(true);
              }}
            >
              <Plus className="size-4" />
              添加连接
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
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">已连接</Badge>
                          )}
                          {conn.status === 'testing' && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">测试中</Badge>
                          )}
                          {conn.status === 'error' && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">连接失败</Badge>
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
                            <span className="text-muted-foreground">主机: </span>
                            <span className="font-mono">{conn.host}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">端口: </span>
                            <span className="font-mono">{conn.port}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">数据库: </span>
                            <span className="font-mono">{conn.database}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          最后同步: {conn.lastSync}
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
                        {conn.status === 'testing' ? '测试中...' : '测试连接'}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {filteredConnections.length} 条
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">每页</div>
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
                        {n} 条
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
                <p className="text-muted-foreground">没有找到匹配的连接</p>
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
                <DialogTitle>添加连接</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>连接名称</Label>
                    <Input
                      placeholder="例：生产数据库"
                      value={addConnForm.name}
                      onChange={(e) => {
                        setAddConnForm((p) => ({ ...p, name: e.target.value }));
                        if (addConnErrors.name) setAddConnErrors((p) => ({ ...p, name: '' }));
                      }}
                    />
                    {addConnErrors.name ? <div className="text-xs text-red-600">{addConnErrors.name}</div> : null}
                  </div>

                  <div className="space-y-2">
                    <Label>数据库类型</Label>
                    <Select
                      value={addConnForm.type}
                      onValueChange={(v) => {
                        const type = v as Connection['type'];
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
                          <Label>端口</Label>
                          <Input
                            placeholder="例：5432"
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
                            placeholder="请输入账号"
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
                            placeholder="请输入凭证"
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
                              {addConnForm.ssl ? '已启用' : '未启用'}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-2">
                  <Label>描述（可选）</Label>
                  <Textarea
                    placeholder="简单描述该连接用途，便于团队理解与管理"
                    value={addConnForm.description}
                    onChange={(e) => setAddConnForm((p) => ({ ...p, description: e.target.value }))}
                    className="min-h-[90px]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {addConnTest === 'idle' && '请先进行连接测试'}
                    {addConnTest === 'testing' && '正在测试连接...'}
                    {addConnTest === 'success' && '连接测试通过，可以保存'}
                    {addConnTest === 'error' && '连接测试失败，请检查参数'}
                  </div>
                  <Button variant="outline" onClick={handleAddTest} disabled={addConnTest === 'testing'}>
                    {addConnTest === 'testing' ? '测试中...' : '测试连接'}
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
                  取消
                </Button>
                <Button onClick={handleAddSave}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Database Type Reference */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="mb-3 text-blue-900">支持的数据源类型</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-semibold text-blue-900 mb-2">关系型数据库</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• MySQL</li>
                  <li>• PostgreSQL</li>
                  <li>• Oracle</li>
                  <li>• SQL Server</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-2">OLAP 数据库</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• ClickHouse</li>
                  <li>• Snowflake</li>
                  <li>• Redshift</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-2">NoSQL 数据库</div>
                <ul className="space-y-1 text-blue-800">
                  <li>• MongoDB</li>
                  <li>• Redis</li>
                  <li>• Cassandra</li>
                  <li>• DynamoDB</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-blue-900 mb-2">云数据平台</div>
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
                placeholder="搜索团队..."
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
              创建团队
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
                      <div className="text-muted-foreground mb-1">成员数</div>
                      <div className="text-2xl">{team.members}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">API 数</div>
                      <div className="text-2xl">{team.apis}</div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <Users className="size-4" />
                    查看成员
                  </Button>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {filteredTeams.length} 条
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">每页</div>
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
                        {n} 条
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
                <p className="text-muted-foreground">没有找到匹配的团队</p>
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
                placeholder="搜索成员..."
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
              邀请成员
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
                            活跃
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-600">
                            未激活
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
              共 {filteredMembers.length} 条
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">每页</div>
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
                      {n} 条
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
              <p className="text-muted-foreground">没有找到匹配的成员</p>
            </Card>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色..."
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
              创建角色
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
                            <Badge variant="outline">系统角色</Badge>
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
                    <div className="text-sm text-muted-foreground mb-2">权限列表</div>
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
                      {role.userCount} 个用户
                    </div>
                    <Button variant="outline" size="sm">
                      查看用户
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {filteredRoles.length} 条
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">每页</div>
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
                        {n} 条
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
                <p className="text-muted-foreground">没有找到匹配的角色</p>
              </Card>
            )}
          </div>

          <Card className="p-6 bg-purple-50 border-purple-200">
            <h3 className="mb-3 text-purple-900">可用权限列表</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="font-semibold text-purple-900 mb-2">API 管理</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• 创建API</li>
                  <li>• 编辑API</li>
                  <li>• 删除API</li>
                  <li>• 查看API</li>
                  <li>• 测试API</li>
                  <li>• 发布API</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">数据管理</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• 查看数据集</li>
                  <li>• 编辑数据集</li>
                  <li>• 管理连接</li>
                  <li>• 查看数据</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">审核管理</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• 审批API</li>
                  <li>• 查看审核记录</li>
                  <li>• 撤回审批</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">系统管理</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• 用户管理</li>
                  <li>• 角色管理</li>
                  <li>• 系统配置</li>
                  <li>• 查看日志</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-purple-900 mb-2">监控运维</div>
                <ul className="space-y-1 text-purple-800">
                  <li>• 查看监控</li>
                  <li>• 查看告警</li>
                  <li>• 性能分析</li>
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
                placeholder="搜索角色组..."
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
              创建角色组
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
                    <div className="text-sm text-muted-foreground mb-2">包含角色</div>
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
                      {group.userCount} 个用户
                    </div>
                    <Button variant="outline" size="sm">
                      管理成员
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                共 {filteredRoleGroups.length} 条
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">每页</div>
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
                        {n} 条
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
                <p className="text-muted-foreground">没有找到匹配的角色组</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
