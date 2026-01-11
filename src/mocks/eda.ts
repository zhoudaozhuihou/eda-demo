import type { MockMethod } from 'vite-plugin-mock';

type CategoryRecord = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type CategoryLinkRecord = {
  itemType: 'dataset' | 'api';
  itemId: string;
  categoryId: string;
};

const nowDate = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

let categories: CategoryRecord[] = [
  { id: 'cat_order', name: '订单域', parentId: null, order: 1, createdAt: '2025-10-01 10:00', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_product', name: '商品域', parentId: null, order: 2, createdAt: '2025-10-01 10:00', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_user', name: '用户域', parentId: null, order: 3, createdAt: '2025-10-01 10:00', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_inventory', name: '库存域', parentId: null, order: 4, createdAt: '2025-10-01 10:00', updatedAt: '2025-12-28 10:00' },

  { id: 'cat_order_query', name: '订单查询', parentId: 'cat_order', order: 1, createdAt: '2025-10-01 10:05', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_order_manage', name: '订单管理', parentId: 'cat_order', order: 2, createdAt: '2025-10-01 10:05', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_product_query', name: '商品查询', parentId: 'cat_product', order: 1, createdAt: '2025-10-01 10:05', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_user_info', name: '用户信息', parentId: 'cat_user', order: 1, createdAt: '2025-10-01 10:05', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_inventory_manage', name: '库存管理', parentId: 'cat_inventory', order: 1, createdAt: '2025-10-01 10:05', updatedAt: '2025-12-28 10:00' },

  { id: 'cat_order_user_orders', name: '用户订单', parentId: 'cat_order_query', order: 1, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_order_detail', name: '订单详情', parentId: 'cat_order_query', order: 2, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_order_create', name: '创建订单', parentId: 'cat_order_manage', order: 1, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },

  { id: 'cat_product_detail', name: '商品详情', parentId: 'cat_product_query', order: 1, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_product_search', name: '商品搜索', parentId: 'cat_product_query', order: 2, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },

  { id: 'cat_user_profile', name: '用户画像', parentId: 'cat_user_info', order: 1, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },

  { id: 'cat_inventory_update', name: '库存更新', parentId: 'cat_inventory_manage', order: 1, createdAt: '2025-10-01 10:10', updatedAt: '2025-12-28 10:00' },
  { id: 'cat_maxcompute', name: 'MaxCompute', parentId: null, order: 5, createdAt: '2026-01-01 10:00', updatedAt: '2026-01-01 10:00' },
];

let categoryLinks: CategoryLinkRecord[] = [
  { itemType: 'api', itemId: '1', categoryId: 'cat_order_user_orders' },
  { itemType: 'api', itemId: '2', categoryId: 'cat_order_detail' },
  { itemType: 'api', itemId: '3', categoryId: 'cat_order_create' },
  { itemType: 'api', itemId: '4', categoryId: 'cat_product_detail' },
  { itemType: 'api', itemId: '5', categoryId: 'cat_product_search' },
  { itemType: 'api', itemId: '6', categoryId: 'cat_user_profile' },
  { itemType: 'api', itemId: '7', categoryId: 'cat_inventory_update' },

  { itemType: 'dataset', itemId: '1', categoryId: 'cat_order_user_orders' },
  { itemType: 'dataset', itemId: '2', categoryId: 'cat_product_detail' },
  { itemType: 'dataset', itemId: '2', categoryId: 'cat_product_search' },
  { itemType: 'dataset', itemId: '3', categoryId: 'cat_user_profile' },
  { itemType: 'dataset', itemId: '4', categoryId: 'cat_inventory_update' },
  { itemType: 'dataset', itemId: 'mc_1', categoryId: 'cat_maxcompute' },
  { itemType: 'dataset', itemId: 'mc_2', categoryId: 'cat_maxcompute' },
];

const datasets = [
  {
    id: '1',
    name: 'user_orders',
    alias: '用户订单表',
    source: '生产数据库',
    domain: '订单域',
    tags: ['核心', '交易'],
    fields: 18,
    masked: 3,
    rowCount: '1.2M',
    lastUpdate: '2025-12-28',
    createdAt: '2025-10-15 14:30',
    updatedAt: '2025-12-28 09:15',
    relatedAPIs: ['getUserOrders', 'getOrderDetail', 'createOrder'],
    description: '存储所有用户订单信息，包括订单状态、金额、时间等核心字段',
  },
  {
    id: 'mc_1',
    name: 'ods_user_log_di',
    alias: '用户日志ODS表',
    source: 'MaxCompute',
    domain: '用户域',
    tags: ['日志', 'ODS'],
    fields: 120,
    masked: 10,
    rowCount: '500M',
    lastUpdate: '2026-01-01',
    createdAt: '2026-01-01 00:00',
    updatedAt: '2026-01-01 12:00',
    relatedAPIs: [],
    description: '用户行为日志原始数据表',
    project: 'data_center_prod',
  },
  {
    id: 'mc_2',
    name: 'dwd_order_detail_di',
    alias: '订单明细DWD表',
    source: 'MaxCompute',
    domain: '订单域',
    tags: ['明细', 'DWD'],
    fields: 45,
    masked: 5,
    rowCount: '100M',
    lastUpdate: '2026-01-01',
    createdAt: '2026-01-01 02:00',
    updatedAt: '2026-01-01 14:00',
    relatedAPIs: [],
    description: '订单明细事实表',
    project: 'data_center_prod',
  },
  {
    id: '2',
    name: 'product_info',
    alias: '商品信息表',
    source: '生产数据库',
    domain: '商品域',
    tags: ['基础', 'SKU'],
    fields: 25,
    masked: 0,
    rowCount: '45K',
    lastUpdate: '2025-12-28',
    createdAt: '2025-09-22 10:15',
    updatedAt: '2025-12-28 09:15',
    relatedAPIs: ['getProductInfo', 'searchProducts'],
    description: '商品基础信息表，包含商品名称、价格、库存等信息',
  },
  {
    id: '3',
    name: 'customer_profile',
    alias: '客户画像表',
    source: '数据仓库',
    domain: '用户域',
    tags: ['敏感', 'PII'],
    fields: 42,
    masked: 8,
    rowCount: '850K',
    lastUpdate: '2025-12-27',
    createdAt: '2025-11-15 09:20',
    updatedAt: '2025-12-27 18:03',
    relatedAPIs: ['getCustomerProfile'],
    description: '客户画像数据，包含用户行为分析、偏好标签等敏感信息',
  },
  {
    id: '4',
    name: 'inventory_data',
    alias: '库存数据表',
    source: '生产数据库',
    domain: '库存域',
    tags: ['实时', '核心'],
    fields: 12,
    masked: 0,
    rowCount: '320K',
    lastUpdate: '2025-12-28',
    createdAt: '2025-10-02 11:10',
    updatedAt: '2025-12-28 08:40',
    relatedAPIs: ['updateInventory'],
    description: '实时库存数据表，记录各仓库的商品库存量',
  },
];

const apis = [
  {
    id: '1',
    name: 'getUserOrders',
    path: '/api/v1/orders/user',
    method: 'GET',
    domain: '订单域',
    category: '订单域/订单查询/用户订单',
    description: '根据用户ID查询订单列表',
    version: '1.2.0',
    status: 'active',
    qps: 85,
    avgLatency: 45,
    callsToday: 12340,
    authType: 'API_KEY',
    createdAt: '2025-11-15',
    datasets: ['user_orders', 'order_items'],
  },
  {
    id: '2',
    name: 'getOrderDetail',
    path: '/api/v1/orders/:id',
    method: 'GET',
    domain: '订单域',
    category: '订单域/订单查询/订单详情',
    description: '查询订单详细信息',
    version: '1.0.0',
    status: 'active',
    qps: 120,
    avgLatency: 38,
    callsToday: 23450,
    authType: 'API_KEY',
    createdAt: '2025-10-10',
    datasets: ['user_orders'],
  },
  {
    id: '3',
    name: 'createOrder',
    path: '/api/v1/orders/create',
    method: 'POST',
    domain: '订单域',
    category: '订单域/订单管理/创建订单',
    description: '创建新订单',
    version: '2.1.0',
    status: 'active',
    qps: 45,
    avgLatency: 156,
    callsToday: 5670,
    authType: 'OAUTH2',
    createdAt: '2025-09-20',
    datasets: ['user_orders'],
  },
  {
    id: '4',
    name: 'getProductInfo',
    path: '/api/v1/products/:id',
    method: 'GET',
    domain: '商品域',
    category: '商品域/商品查询/商品详情',
    description: '获取商品详细信息',
    version: '2.0.1',
    status: 'active',
    qps: 150,
    avgLatency: 32,
    callsToday: 56780,
    authType: 'API_KEY',
    createdAt: '2025-10-20',
    datasets: ['product_info'],
  },
  {
    id: '5',
    name: 'searchProducts',
    path: '/api/v1/products/search',
    method: 'POST',
    domain: '商品域',
    category: '商品域/商品查询/商品搜索',
    description: '根据关键词搜索商品',
    version: '1.5.0',
    status: 'active',
    qps: 95,
    avgLatency: 78,
    callsToday: 34560,
    authType: 'API_KEY',
    createdAt: '2025-08-15',
    datasets: ['product_info'],
  },
  {
    id: '6',
    name: 'getCustomerProfile',
    path: '/api/v1/customers/profile',
    method: 'GET',
    domain: '用户域',
    category: '用户域/用户信息/用户画像',
    description: '查询客户画像数据',
    version: '1.0.0',
    status: 'active',
    qps: 45,
    avgLatency: 128,
    callsToday: 8900,
    authType: 'OAUTH2',
    createdAt: '2025-12-01',
    datasets: ['customer_profile'],
  },
  {
    id: '7',
    name: 'updateInventory',
    path: '/api/v1/inventory/update',
    method: 'POST',
    domain: '库存域',
    category: '库存域/库存管理/库存更新',
    description: '更新库存数量',
    version: '1.1.0',
    status: 'active',
    qps: 60,
    avgLatency: 67,
    callsToday: 23450,
    authType: 'API_KEY',
    createdAt: '2025-11-28',
    datasets: ['inventory_data'],
  },
];

const approvals = [
  {
    id: '1',
    apiName: 'getUserOrders',
    apiPath: '/api/v1/orders/user',
    type: 'publish',
    requester: '张三',
    requesterAvatar: 'John',
    team: '技术团队',
    reason: '新API上线',
    details: '用于查询用户订单列表，支持分页和筛选功能',
    status: 'pending',
    createdAt: '2025-12-30 10:30',
  },
  {
    id: '2',
    apiName: 'getProductInfo',
    apiPath: '/api/v1/products/:id',
    type: 'update',
    requester: '李四',
    requesterAvatar: 'Li',
    team: '产品团队',
    reason: '优化查询性能',
    details: '增加缓存机制，优化SQL查询',
    status: 'pending',
    createdAt: '2025-12-30 09:15',
  },
  {
    id: '3',
    apiName: 'getCustomerProfile',
    apiPath: '/api/v1/customers/profile',
    type: 'deprecate',
    requester: '王五',
    requesterAvatar: 'Wang',
    team: '数据团队',
    reason: '版本迭代',
    details: '新版本API已发布，计划下线旧版本',
    status: 'pending',
    createdAt: '2025-12-29 16:45',
  },
  {
    id: '4',
    apiName: 'updateInventory',
    apiPath: '/api/v1/inventory/update',
    type: 'publish',
    requester: '赵六',
    requesterAvatar: 'Zhao',
    team: '技术团队',
    reason: '库存管理功能',
    details: '支持批量更新库存数据',
    status: 'approved',
    createdAt: '2025-12-29 14:20',
    approver: '管理员',
    approvedAt: '2025-12-29 15:00',
  },
  {
    id: '3',
    apiName: '申请访问 MaxCompute 数据包',
    apiPath: '项目: data_center_prod',
    type: 'access_package',
    requester: '张三',
    requesterAvatar: 'zhangSan',
    team: '数据团队',
    reason: '数据分析需求',
    details: '申请表: ods_user_log_di, dwd_order_detail_di',
    status: 'pending',
    createdAt: '2026-01-01 10:00',
    packageInfo: {
      project: 'data_center_prod',
      validity: 'days_30',
      tables: ['ods_user_log_di', 'dwd_order_detail_di']
    }
  },
  {
    id: '5',
    apiName: 'deleteUserData',
    apiPath: '/api/v1/users/delete',
    type: 'delete',
    requester: '钱七',
    requesterAvatar: 'Qian',
    team: '产品团队',
    reason: '不再使用',
    details: '该API已被新版本替代，申请删除',
    status: 'rejected',
    createdAt: '2025-12-28 11:00',
    approver: '管理员',
    approvedAt: '2025-12-28 14:00',
  },
  {
    id: '6',
    apiName: 'AutoPackage-20251230',
    apiPath: 'MaxCompute Project: company_project',
    type: 'package_apply',
    requester: '数据科学家',
    requesterAvatar: 'DS',
    team: '数据团队',
    reason: '需要访问ODS层数据进行建模',
    details: '申请表清单: ods_user_log, dwd_order_detail. 有效期: 30天',
    status: 'pending',
    createdAt: '2025-12-30 11:00',
  },
];

const management = {
  teams: [
    { id: '1', name: '技术团队', members: 12, apis: 45, code: 'TECH', color: 'bg-blue-500' },
    { id: '2', name: '产品团队', members: 8, apis: 23, code: 'PROD', color: 'bg-green-500' },
    { id: '3', name: '数据团队', members: 15, apis: 67, code: 'DATA', color: 'bg-purple-500' },
    { id: '4', name: '运营团队', members: 6, apis: 12, code: 'OPS', color: 'bg-orange-500' },
  ],
  members: [
    { id: '1', name: '张三', email: 'zhangsan@company.com', role: '管理员', team: '技术团队', status: 'active' },
    { id: '2', name: '李四', email: 'lisi@company.com', role: '开发者', team: '技术团队', status: 'active' },
    { id: '3', name: '王五', email: 'wangwu@company.com', role: '数据工程师', team: '数据团队', status: 'active' },
    { id: '4', name: '赵六', email: 'zhaoliu@company.com', role: '产品经理', team: '产品团队', status: 'active' },
    { id: '5', name: '钱七', email: 'qianqi@company.com', role: '开发者', team: '技术团队', status: 'inactive' },
  ],
  connections: [
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
  ],
  roles: [
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
  ],
  roleGroups: [
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
  ],
};

const dashboard = {
  stats: [
    { label: 'API 总数', value: '156', change: '+12%', icon: 'Activity', color: 'text-blue-500' },
    { label: '数据源', value: '23', change: '+3', icon: 'Database', color: 'text-green-500' },
    { label: '数据集', value: '89', change: '+8', icon: 'Server', color: 'text-purple-500' },
    { label: '今日调用', value: '45.2K', change: '+23%', icon: 'TrendingUp', color: 'text-orange-500' },
  ],
  hotApis: [
    { id: '1', name: 'getUserOrders', domain: '订单域', calls: 1234, latency: 45, status: 'healthy' },
    { id: '4', name: 'getProductInfo', domain: '商品域', calls: 5678, latency: 32, status: 'healthy' },
    { id: '6', name: 'getCustomerProfile', domain: '用户域', calls: 890, latency: 128, status: 'warning' },
    { id: '8', name: 'getInventoryData', domain: '库存域', calls: 2345, latency: 67, status: 'healthy' },
  ],
  userStats: {
    totalUsers: 1250,
    activeUsers: 850,
    retentionRate: 78.5,
    trend: [
      { date: '2024-01', value: 1000 },
      { date: '2024-02', value: 1100 },
      { date: '2024-03', value: 1150 },
      { date: '2024-04', value: 1200 },
      { date: '2024-05', value: 1250 },
    ],
  },
  teamStats: {
    totalTeams: 15,
    activeMembers: 120,
    taskCompletionRate: 92,
    activityTrend: [
      { date: 'Mon', value: 45 },
      { date: 'Tue', value: 52 },
      { date: 'Wed', value: 49 },
      { date: 'Thu', value: 60 },
      { date: 'Fri', value: 55 },
      { date: 'Sat', value: 20 },
      { date: 'Sun', value: 15 },
    ],
  },
  platformStats: {
    systemStatus: 'healthy',
    cpuUsage: 45,
    memoryUsage: 62,
    serviceAvailability: 99.99,
    uptime: '15d 4h 23m',
  },
  apiTrends: [
    { date: '00:00', calls: 120, latency: 45, errors: 0 },
    { date: '04:00', calls: 80, latency: 42, errors: 0 },
    { date: '08:00', calls: 450, latency: 55, errors: 2 },
    { date: '12:00', calls: 980, latency: 68, errors: 5 },
    { date: '16:00', calls: 850, latency: 60, errors: 3 },
    { date: '20:00', calls: 340, latency: 48, errors: 1 },
  ],
};

export default [
  {
    url: '/api/dashboard',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: dashboard }),
  },
  {
    url: '/api/datasets',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: datasets }),
  },
  {
    url: '/api/apis',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: apis }),
  },
  {
    url: '/api/approvals',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: approvals }),
  },
  {
    url: '/api/management',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: management }),
  },
  {
    url: '/api/taxonomy',
    method: 'get',
    response: () => ({ code: 0, message: 'ok', data: { categories, links: categoryLinks } }),
  },
  {
    url: '/api/categories',
    method: 'post',
    response: ({ body }: { body?: unknown }) => {
      const payload = body as Record<string, unknown> | undefined;
      const name = String(payload?.name ?? '').trim();
      const parentId = payload?.parentId === null || payload?.parentId === undefined ? null : String(payload.parentId);
      const order = Number.isFinite(Number(payload?.order)) ? Number(payload?.order) : 9999;
      if (!name) return { code: 400, message: 'name required', data: null };
      const id = `cat_${Math.random().toString(36).slice(2, 10)}`;
      const now = nowDate();
      const next: CategoryRecord = { id, name, parentId, order, createdAt: now, updatedAt: now };
      categories = [...categories, next];
      return { code: 0, message: 'ok', data: next };
    },
  },
  {
    url: '/api/categories/:id',
    method: 'put',
    response: ({ body, query }: { body?: unknown; query?: Record<string, unknown> }) => {
      const payload = body as Record<string, unknown> | undefined;
      const id = String(query?.id ?? '').trim();
      const idx = categories.findIndex((c) => c.id === id);
      if (idx === -1) return { code: 404, message: 'not found', data: null };
      const name = payload?.name === undefined ? undefined : String(payload.name).trim();
      const parentId =
        payload?.parentId === undefined ? undefined : payload.parentId === null ? null : String(payload.parentId);
      const order = payload?.order === undefined ? undefined : Number(payload.order);
      const now = nowDate();
      categories[idx] = {
        ...categories[idx],
        ...(name ? { name } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        ...(Number.isFinite(order) ? { order } : {}),
        updatedAt: now,
      };
      return { code: 0, message: 'ok', data: categories[idx] };
    },
  },
  {
    url: '/api/categories/reorder',
    method: 'put',
    response: ({ body }: { body?: unknown }) => {
      const payload = body as Record<string, unknown> | undefined;
      const parentId = payload?.parentId === null || payload?.parentId === undefined ? null : String(payload.parentId);
      const orderedIds = Array.isArray(payload?.orderedIds) ? (payload.orderedIds as unknown[]).map(String) : [];
      const siblings = categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
      const siblingIds = new Set(siblings.map((s) => s.id));
      const normalized = orderedIds.filter((id) => siblingIds.has(id));
      if (normalized.length !== siblings.length) return { code: 400, message: 'invalid orderedIds', data: null };
      const now = nowDate();
      categories = categories.map((c) => {
        if (c.parentId !== parentId) return c;
        const order = normalized.indexOf(c.id) + 1;
        return { ...c, order, updatedAt: now };
      });
      return { code: 0, message: 'ok', data: true };
    },
  },
  {
    url: '/api/categories/move',
    method: 'put',
    response: ({ body }: { body?: unknown }) => {
      const payload = body as Record<string, unknown> | undefined;
      const ids = Array.isArray(payload?.ids) ? (payload.ids as unknown[]).map(String) : [];
      const parentId = payload?.parentId === null || payload?.parentId === undefined ? null : String(payload.parentId);
      const now = nowDate();
      categories = categories.map((c) => {
        if (!ids.includes(c.id)) return c;
        return { ...c, parentId, updatedAt: now };
      });
      return { code: 0, message: 'ok', data: true };
    },
  },
  {
    url: '/api/categories',
    method: 'delete',
    response: ({ body }: { body?: unknown }) => {
      const payload = body as Record<string, unknown> | undefined;
      const ids = Array.isArray(payload?.ids) ? (payload.ids as unknown[]).map(String) : [];
      const toDelete = new Set(ids);
      const hasChild = (id: string) => categories.some((c) => c.parentId === id && !toDelete.has(c.id));
      for (const id of ids) {
        if (hasChild(id)) return { code: 400, message: 'cannot delete category with children', data: null };
      }
      categories = categories.filter((c) => !toDelete.has(c.id));
      categoryLinks = categoryLinks.filter((l) => !toDelete.has(l.categoryId));
      return { code: 0, message: 'ok', data: true };
    },
  },
  {
    url: '/api/category-links',
    method: 'put',
    response: ({ body }: { body?: unknown }) => {
      const payload = body as Record<string, unknown> | undefined;
      const itemType: CategoryLinkRecord['itemType'] | null =
        payload?.itemType === 'api' ? 'api' : payload?.itemType === 'dataset' ? 'dataset' : null;
      const itemId = String(payload?.itemId ?? '').trim();
      const categoryIds = Array.isArray(payload?.categoryIds) ? (payload.categoryIds as unknown[]).map(String) : [];
      if (!itemType || !itemId) return { code: 400, message: 'invalid payload', data: null };
      const validCategoryId = new Set(categories.map((c) => c.id));
      const nextIds = categoryIds.filter((id) => validCategoryId.has(id));
      categoryLinks = categoryLinks.filter((l) => !(l.itemType === itemType && l.itemId === itemId));
      categoryLinks = [...categoryLinks, ...nextIds.map((id) => ({ itemType, itemId, categoryId: id }))];
      return { code: 0, message: 'ok', data: true };
    },
  },
] as MockMethod[];
