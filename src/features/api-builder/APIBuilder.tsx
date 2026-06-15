import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Sparkles, Plus, X, Link2, Syringe, Layers2, Search, ChevronDown, ChevronRight, Pin, PinOff, BarChart2, Database, FolderPlus, Info, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { useTranslation } from 'react-i18next';

// Mock Data for Connections
const MOCK_CONNECTIONS = [
  { id: 'conn_1', name: 'Production DB (MySQL)', type: 'MySQL' },
  { id: 'conn_2', name: 'Analytics DB (ClickHouse)', type: 'ClickHouse' },
  { id: 'conn_3', name: 'MaxCompute Prod', type: 'MaxCompute' },
];

type TableInfo = {
  name: string;
  type: 'TABLE' | 'VIEW';
  createdAt: string;
};

// Mock Data for Tables
const MOCK_TABLES: Record<string, TableInfo[]> = {
  conn_1: [
    { name: 'user_orders', type: 'TABLE', createdAt: '2024-08-12 09:32' },
    { name: 'product_info', type: 'TABLE', createdAt: '2024-06-01 14:05' },
    { name: 'customer_profile', type: 'VIEW', createdAt: '2024-05-22 18:40' },
    { name: 'order_items', type: 'TABLE', createdAt: '2024-04-10 11:21' },
    { name: 'refund_records', type: 'TABLE', createdAt: '2024-03-03 08:12' },
    { name: 'user_order_summary', type: 'VIEW', createdAt: '2024-02-15 16:30' },
  ],
  conn_2: [
    { name: 'ads_sales_daily', type: 'TABLE', createdAt: '2024-09-02 09:00' },
    { name: 'ads_user_retention', type: 'TABLE', createdAt: '2024-09-01 09:00' },
    { name: 'ads_campaign_overview', type: 'VIEW', createdAt: '2024-08-20 10:15' },
    { name: 'ads_cost_breakdown', type: 'TABLE', createdAt: '2024-08-05 13:50' },
  ],
  conn_3: [
    { name: 'dwd_transaction_log', type: 'TABLE', createdAt: '2024-07-28 07:30' },
    { name: 'dim_sku_info', type: 'TABLE', createdAt: '2024-07-16 12:10' },
    { name: 'dws_user_activity', type: 'VIEW', createdAt: '2024-07-10 15:45' },
  ],
};

// Mock Data for Table -> Dataset Mapping
const INITIAL_DATASET_MAPPING: Record<string, { id: string; name: string; alias: string; domain: string }> = {
  'conn_1:user_orders': { id: 'ds_1', name: 'user_orders', alias: 'User Orders Dataset', domain: 'Order' },
  'conn_1:product_info': { id: 'ds_2', name: 'product_info', alias: 'Product Info Dataset', domain: 'Product' },
  // 'conn_1:customer_profile' is unmapped to test creation flow
};

interface Field {
  name: string;
  type: string;
  isParam: boolean;
  isRequired: boolean;
  isReturn: boolean;
  defaultValue: string;
  alias?: string;
  table?: string;
  description?: string;
  category?: string;
  isPinned?: boolean;
  usageScore?: number;
  validation?: {
    format?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    errorMessage?: string;
  };
}

interface JoinTable {
  id: string;
  table: string;
  alias: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT';
  onCondition: string;
}

interface BatchAPIConfig {
  tableName: string;
  apiName: string;
  method: string;
  enabled: boolean;
}

type DatabaseType = 'MySQL' | 'PostgreSQL' | 'SQL Server' | 'ClickHouse' | 'Oracle' | 'MongoDB' | 'Redis' | 'BigQuery' | 'MaxCompute';

export type APIBuilderContext = {
  source: 'dataset';
  datasetId: string;
  datasetName: string;
  datasetAlias: string;
  domain: string;
  fields: Array<{
    name: string;
    type: string;
    alias?: string;
    masked?: boolean;
    description?: string;
    important?: boolean;
  }>;
};

const toSnakeCase = (str: string) => str.trim().replace(/\s+/g, '_').toLowerCase();

export function APIBuilder({
  context,
  onClearContext,
}: {
  context?: APIBuilderContext | null;
  onClearContext?: () => void;
}) {
  const { t } = useTranslation('apiBuilder');
  const [currentStep, setCurrentStep] = useState(1);
  const [buildMode, setBuildMode] = useState<'single' | 'join' | 'inject' | 'batch' | 'aggregate' | 'complex'>('single');
  const [databaseType, setDatabaseType] = useState<DatabaseType>('MySQL');
  const [apiConfig, setApiConfig] = useState({
    name: '',
    dataset: '',
    method: 'GET',
    authType: 'API_KEY',
    domain: '',
    qpsLimit: '100',
    paramValidation: 'joi'
  });
  const [editingFieldRule, setEditingFieldRule] = useState<number | null>(null);

  const [joinTables, setJoinTables] = useState<JoinTable[]>([]);
  const [batchAPIs, setBatchAPIs] = useState<BatchAPIConfig[]>([
    { tableName: 'user_orders', apiName: 'getUserOrders', method: 'GET', enabled: true },
    { tableName: 'product_info', apiName: 'getProductInfo', method: 'GET', enabled: true },
    { tableName: 'customer_profile', apiName: 'getCustomerProfile', method: 'GET', enabled: false },
    { tableName: 'inventory_data', apiName: 'getInventoryData', method: 'GET', enabled: true },
  ]);

  const [fields, setFields] = useState<Field[]>([
    { name: 'user_id', type: 'bigint', isParam: true, isRequired: true, isReturn: true, defaultValue: '' },
    { name: 'order_id', type: 'varchar', isParam: true, isRequired: true, isReturn: true, defaultValue: '' },
    { name: 'order_date', type: 'datetime', isParam: false, isRequired: false, isReturn: true, defaultValue: '' },
    { name: 'total_amount', type: 'decimal', isParam: false, isRequired: false, isReturn: true, defaultValue: '' },
    { name: 'status', type: 'varchar', isParam: false, isRequired: false, isReturn: true, defaultValue: '' },
  ]);

  const [sqlQuery, setSqlQuery] = useState('');
  
  // New State for Data Source Linkage
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [datasetStatus, setDatasetStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [linkedDataset, setLinkedDataset] = useState<{ id: string; name: string; alias: string; domain: string } | null>(null);
  const [datasetMapping, setDatasetMapping] = useState(INITIAL_DATASET_MAPPING);

  // Large Dataset & Virtual Scroll State
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const generateLargeDataset = () => {
    setLoading(true);
    const startTime = performance.now();
    // Simulate backend lazy loading
    setTimeout(() => {
      const largeFields: Field[] = Array.from({ length: 300 }, (_, i) => ({
        name: `field_${i + 1}`,
        type: ['varchar', 'bigint', 'datetime', 'decimal', 'boolean'][i % 5],
        isParam: i < 10,
        isRequired: i < 5,
        isReturn: true,
        defaultValue: '',
        alias: `Field ${i + 1}`,
        description: `Description for field ${i + 1} - ${['User ID', 'Order Amount', 'Created Time', 'Status', 'Is Active'][i % 5]}`,
        category: `Group ${Math.floor(i / 50) + 1}`,
        isPinned: false,
        usageScore: Math.floor(Math.random() * 100),
      }));
      setFields(largeFields);
      setLoading(false);
      const endTime = performance.now();
      toast.success(`Loaded 300+ fields in ${Math.round(endTime - startTime)}ms (Simulated Backend Delay: 800ms)`);
    }, 800);
  };

  const togglePin = (index: number) => {
    const newFields = [...fields];
    newFields[index].isPinned = !newFields[index].isPinned;
    setFields(newFields);
  };

  const toggleGroup = (group: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  const processedFields = useMemo(() => {
    let result = [...fields];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(lower) || 
        (f.alias && f.alias.toLowerCase().includes(lower)) || 
        (f.description && f.description.toLowerCase().includes(lower)) ||
        f.type.toLowerCase().includes(lower)
      );
    }

    // Sort: Pinned > Usage Score > Original
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      // if ((a.usageScore || 0) !== (b.usageScore || 0)) return (b.usageScore || 0) - (a.usageScore || 0);
      return 0;
    });

    const grouped: Record<string, Field[]> = {};
    result.forEach(f => {
      const group = f.category || 'Default';
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(f);
    });

    return grouped;
  }, [fields, searchTerm]);

  const paramStats = useMemo(() => {
    const params = fields.filter((f) => f.isParam);
    return {
      required: params.filter((f) => f.isRequired).length,
      optional: params.filter((f) => !f.isRequired).length,
    };
  }, [fields]);

  const filteredTables = useMemo(() => {
    const list = selectedConnection ? MOCK_TABLES[selectedConnection] || [] : [];
    if (!tableSearch.trim()) return list;
    const keyword = tableSearch.trim().toLowerCase();
    return list.filter((table) => table.name.toLowerCase().includes(keyword));
  }, [selectedConnection, tableSearch]);

  const totalTables = filteredTables.length;
  const totalTablePages = Math.max(1, Math.ceil(totalTables / tablePageSize));
  const currentTablePage = Math.min(tablePage, totalTablePages);
  const tableStartIndex = (currentTablePage - 1) * tablePageSize;
  const pagedTables = filteredTables.slice(tableStartIndex, tableStartIndex + tablePageSize);
  const tableRangeStart = totalTables === 0 ? 0 : tableStartIndex + 1;
  const tableRangeEnd = Math.min(tableStartIndex + tablePageSize, totalTables);

  const flatList = useMemo(() => {
    type FlatListItem = 
      | { type: 'header'; data: { name: string; count: number }; originalIndex?: undefined }
      | { type: 'row'; data: Field; originalIndex: number };

    const list: FlatListItem[] = [];
    Object.entries(processedFields).forEach(([group, groupFields]) => {
      list.push({ type: 'header', data: { name: group, count: groupFields.length } });
      if (!collapsedGroups.has(group)) {
        groupFields.forEach((f) => {
           const originalIndex = fields.findIndex(field => field.name === f.name);
           list.push({ type: 'row', data: f, originalIndex });
        });
      }
    });
    return list;
  }, [processedFields, collapsedGroups, fields]);

  const sqlValidation = useMemo(() => {
    return {
      syntaxValid: true,
      performanceScore: 85,
      warnings: [t('sql.optimization.warnings.addIndex', { field: 'user_id' }), t('sql.optimization.warnings.largeResult')],
    };
  }, [t]);

  const singleSteps = useMemo(() => [
    { id: 1, name: t('steps.1.name'), desc: t('steps.1.desc') },
    { id: 2, name: t('steps.2.name'), desc: t('steps.2.desc') },
    { id: 3, name: t('steps.3.name'), desc: t('steps.3.desc') },
    { id: 4, name: t('steps.4.name'), desc: t('steps.4.desc') },
    { id: 5, name: t('steps.5.name'), desc: t('steps.5.desc') },
  ], [t]);

  const joinSteps = useMemo(() => [
    { id: 1, name: t('steps.1.name'), desc: t('steps.1.desc') },
    { id: 2, name: t('steps.2.name'), desc: t('join.steps.2.desc') },
    { id: 3, name: t('join.steps.3.name'), desc: t('join.steps.3.desc') },
    { id: 4, name: t('join.steps.4.name'), desc: t('join.steps.4.desc') },
    { id: 5, name: t('steps.4.name'), desc: t('steps.4.desc') },
    { id: 6, name: t('steps.5.name'), desc: t('steps.5.desc') },
  ], [t]);

  const injectSteps = useMemo(() => [
    { id: 1, name: t('steps.1.name'), desc: t('steps.1.desc') },
    { id: 2, name: t('steps.2.name'), desc: t('steps.2.desc') },
    { id: 3, name: t('steps.3.name'), desc: t('steps.3.desc') },
    { id: 4, name: t('steps.4.name'), desc: t('steps.4.desc') },
    { id: 5, name: t('steps.5.name'), desc: t('steps.5.desc') },
  ], [t]);

  const batchSteps = useMemo(() => [
    { id: 1, name: t('steps.1.name'), desc: t('batch.steps.1.desc') },
    { id: 2, name: t('batch.steps.2.name'), desc: t('batch.steps.2.desc') },
    { id: 3, name: t('batch.steps.3.name'), desc: t('batch.steps.3.desc') },
    { id: 4, name: t('batch.steps.4.name'), desc: t('batch.steps.4.desc') },
  ], [t]);

  const aggregateSteps = useMemo(() => [
    { id: 1, name: t('steps.1.name'), desc: t('steps.1.desc') },
    { id: 2, name: t('steps.2.name'), desc: t('steps.2.desc') },
    { id: 3, name: t('aggregate.steps.3.name'), desc: t('aggregate.steps.3.desc') },
    { id: 4, name: t('aggregate.steps.4.name'), desc: t('aggregate.steps.4.desc') },
    { id: 5, name: t('aggregate.steps.5.name'), desc: t('aggregate.steps.5.desc') },
    { id: 6, name: t('steps.4.name'), desc: t('steps.4.desc') },
    { id: 7, name: t('steps.5.name'), desc: t('steps.5.desc') },
  ], [t]);

  const complexSteps = useMemo(() => [
    { id: 1, name: t('steps.1.name'), desc: t('steps.1.desc') },
    { id: 2, name: t('steps.2.name'), desc: t('steps.2.desc') },
    { id: 3, name: t('complex.steps.3.name'), desc: t('complex.steps.3.desc') },
    { id: 4, name: t('complex.steps.4.name'), desc: t('complex.steps.4.desc') },
    { id: 5, name: t('complex.steps.5.name'), desc: t('complex.steps.5.desc') },
    { id: 6, name: t('complex.steps.6.name'), desc: t('complex.steps.6.desc') },
    { id: 7, name: t('steps.4.name'), desc: t('steps.4.desc') },
    { id: 8, name: t('steps.5.name'), desc: t('steps.5.desc') },
  ], [t]);

  const steps = useMemo(() => {
    switch (buildMode) {
      case 'join':
        return joinSteps;
      case 'inject':
        return injectSteps;
      case 'batch':
        return batchSteps;
      case 'aggregate':
        return aggregateSteps;
      case 'complex':
        return complexSteps;
      default:
        return singleSteps;
    }
  }, [buildMode, singleSteps, joinSteps, injectSteps, batchSteps, aggregateSteps, complexSteps]);

  const getMaxSteps = useCallback(() => {
    switch (buildMode) {
      case 'join': return 6;
      case 'inject': return 5;
      case 'batch': return 4;
      case 'aggregate': return 7;
      case 'complex': return 8;
      default: return 5;
    }
  }, [buildMode]);

  useEffect(() => {
    if (!context) return;
    if (context.source !== 'dataset') return;
    if (!context.datasetId || !context.datasetName) {
      toast.error(t('toast.errors.contextIncomplete'));
      onClearContext?.();
      return;
    }

    const list = context.fields ?? [];
    if (!list.length) {
      toast.error(t('toast.errors.noDatasetFields'));
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      setBuildMode('single');
      setCurrentStep(2);
      setApiConfig((prev) => ({
        ...prev,
        dataset: context.datasetName,
        domain: context.domain,
      }));
      setFields(
        list.map((f, idx) => ({
          name: f.name,
          type: f.type,
          isParam: f.important === true || idx < 2,
          isRequired: f.important === true || idx < 2,
          isReturn: true,
          defaultValue: '',
        })),
      );
    });

    return () => window.cancelAnimationFrame(raf);
  }, [context, onClearContext, t]);

  const handleFormatSQL = () => {
    // Mock format
    setSqlQuery((prev) => prev.trim());
    toast.success(t('toast.sqlFormatted') || 'SQL formatted');
  };

  const handleSyntaxCheck = () => {
    // Mock check
    toast.success(t('toast.syntaxValid') || 'Syntax valid');
  };

  const handleRunTest = () => {
    // Mock run
    toast.success(t('toast.testRunSuccess') || 'Test run successful');
  };

  const handleSubmit = () => {
    // Mock submit
    toast.success(t('toast.apiSubmitted') || 'API submitted successfully');
  };

  const addJoinTable = () => {
    setJoinTables([
      ...joinTables,
      {
        id: Date.now().toString(),
        table: '',
        alias: '',
        joinType: 'INNER',
        onCondition: '',
      },
    ]);
  };

  const removeJoinTable = (id: string) => {
    setJoinTables(joinTables.filter((t) => t.id !== id));
  };

  const updateJoinTable = (id: string, field: keyof JoinTable, value: string) => {
    setJoinTables(
      joinTables.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const toggleFieldParam = (index: number) => {
    const newFields = [...fields];
    newFields[index].isParam = !newFields[index].isParam;
    if (!newFields[index].isParam) {
      newFields[index].isRequired = false;
    }
    setFields(newFields);
  };

  const toggleFieldReturn = (index: number) => {
    const newFields = [...fields];
    newFields[index].isReturn = !newFields[index].isReturn;
    setFields(newFields);
  };

  const getPreviewData = (): {
    method: string;
    url: string;
    headers: { 'Content-Type': string; Authorization?: string };
    params: Field[];
    requestBody: Record<string, unknown> | null;
    responseBody: Record<string, unknown>;
    timestamp: string;
  } => {
    const params = fields.filter((f) => f.isParam);
    const returns = fields.filter((f) => f.isReturn);
    
    const requestBody = apiConfig.method === 'get' || apiConfig.method === 'delete' 
      ? null 
      : params.reduce((acc, f) => ({ ...acc, [f.alias || f.name]: f.type === 'number' ? 0 : 'string' }), {});
      
    const responseBody = {
      code: 200,
      data: returns.reduce((acc, f) => ({ ...acc, [f.alias || f.name]: f.type === 'number' ? 123 : 'example_value' }), {}),
      message: 'success'
    };

    return {
      method: apiConfig.method || 'GET',
      url: `/api/v1/${apiConfig.domain || 'domain'}/${apiConfig.name || 'resource'}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiConfig.authType === 'none' ? undefined : `${apiConfig.authType === 'apiKey' ? 'ApiKey' : 'Bearer'} <token>`
      },
      params,
      requestBody,
      responseBody,
      timestamp: new Date().toISOString()
    };
  };

  const generateSQL = () => {
    const returnFields = fields.filter((f) => f.isReturn);
    const paramFields = fields.filter((f) => f.isParam);

    let sql = '';

    switch (databaseType) {
      case 'MySQL':
      case 'PostgreSQL':
      case 'SQL Server':
      case 'Oracle':
        sql = generateRelationalSQL(returnFields, paramFields);
        break;
      case 'ClickHouse':
        sql = generateClickHouseSQL(returnFields, paramFields);
        break;
      case 'MongoDB':
        sql = generateMongoQuery(returnFields, paramFields);
        break;
      case 'BigQuery':
        sql = generateBigQuerySQL(returnFields, paramFields);
        break;
      case 'MaxCompute':
        sql = generateMaxComputeSQL(returnFields, paramFields);
        break;
      default:
        sql = generateRelationalSQL(returnFields, paramFields);
    }

    setSqlQuery(sql);
  };

  const validateSingleStep = (step: number) => {
    if (step === 2) {
      if (!selectedConnection) {
        toast.error('请先选择数据库连接');
        return false;
      }
      if (!selectedTable) {
        toast.error('请先选择表或视图');
        return false;
      }
      if (!apiConfig.dataset) {
        toast.error('请先关联或创建数据集');
        return false;
      }
    }
    if (step === 3) {
      if (!fields.some((f) => f.isReturn)) {
        toast.error('请至少选择一个返回字段');
        return false;
      }
      if (fields.some((f) => f.isRequired && !f.isParam)) {
        toast.error('必填参数必须勾选为请求参数');
        return false;
      }
    }
    return true;
  };

  const validateJoinStep = (step: number) => {
    if (step === 2) {
      if (!selectedConnection) {
        toast.error('请先选择数据库连接');
        return false;
      }
      if (!selectedTable) {
        toast.error('请先选择主表');
        return false;
      }
    }
    if (step === 3) {
      if (joinTables.length === 0) {
        toast.error('请至少添加一个关联表');
        return false;
      }
      for (const jt of joinTables) {
        if (!jt.table || !jt.onCondition) {
          toast.error('请完善关联表配置');
          return false;
        }
      }
      if (!fields.some((f) => f.isReturn)) {
        toast.error('请至少选择一个返回字段');
        return false;
      }
    }
    if (step === 5) {
      if (!sqlQuery.trim()) {
        toast.error('请输入SQL语句');
        return false;
      }
    }
    return true;
  };

  const validateInjectStep = (step: number) => {
    if (step === 2) {
      if (!selectedConnection) {
        toast.error('请先选择数据库连接');
        return false;
      }
      if (!selectedTable) {
        toast.error('请先选择目标表');
        return false;
      }
    }
    if (step === 4) {
      if (!sqlQuery.trim()) {
        toast.error('请输入SQL语句');
        return false;
      }
      if (!sqlQuery.toLowerCase().includes('select')) {
        toast.error('Inject模式仅支持SELECT查询');
        return false;
      }
    }
    return true;
  };

  const validateBatchStep = (step: number) => {
    if (step === 2) {
      if (!selectedConnection) {
        toast.error('请先选择数据库连接');
        return false;
      }
    }
    if (step === 3) {
      if (!batchAPIs.some((api) => api.enabled)) {
        toast.error('请至少启用一个API');
        return false;
      }
    }
    return true;
  };

  const validateAggregateStep = (step: number) => {
    if (step === 2) {
      if (!selectedConnection) {
        toast.error('请先选择数据库连接');
        return false;
      }
      if (!selectedTable) {
        toast.error('请先选择主表');
        return false;
      }
    }
    if (step === 6) {
      if (!sqlQuery.trim()) {
        toast.error('请输入SQL语句');
        return false;
      }
    }
    return true;
  };

  const validateComplexStep = (step: number) => {
    if (step === 2) {
      if (!selectedConnection) {
        toast.error('请先选择数据库连接');
        return false;
      }
      if (!selectedTable) {
        toast.error('请先选择主表');
        return false;
      }
    }
    if (step === 7) {
      if (!sqlQuery.trim()) {
        toast.error('请输入SQL语句');
        return false;
      }
    }
    return true;
  };

  const validateStep = (step: number) => {
    switch (buildMode) {
      case 'join':
        return validateJoinStep(step);
      case 'inject':
        return validateInjectStep(step);
      case 'batch':
        return validateBatchStep(step);
      case 'aggregate':
        return validateAggregateStep(step);
      case 'complex':
        return validateComplexStep(step);
      default:
        return validateSingleStep(step);
    }
  };

  const generateRelationalSQL = (returnFields: Field[], paramFields: Field[]) => {
    const mainTable = apiConfig.dataset || 'table_name';
    let fromClause = mainTable;
    
    if (buildMode === 'join' && joinTables.length > 0) {
      const joinClauses = joinTables
        .map((j) => `${j.joinType} JOIN ${j.table} ${j.alias} ON ${j.onCondition}`)
        .join('\n');
      fromClause = `${fromClause}\n${joinClauses}`;
    }

    const selectClause = returnFields.map((f) => {
      const tableName = f.table || mainTable;
      const col = buildMode === 'join' ? `${tableName}.${f.name}` : f.name;
      
      if (f.alias) {
        return `${col} AS ${f.alias}`;
      }
      
      // Default behavior for JOIN mode: use fully qualified name and alias with table prefix
      // to avoid column name collisions
      if (buildMode === 'join') {
        return `${col} AS ${tableName}_${f.name}`;
      }

      return col;
    }).join(',\n  ');

    const whereClause = paramFields.map((f) => {
      const tableName = f.table || mainTable;
      const col = buildMode === 'join' ? `${tableName}.${f.name}` : f.name;
      const condition = `${col} = :${f.name}`;
      return f.isRequired ? `  AND ${condition}` : `  AND (${condition} OR :${f.name} IS NULL)`;
    }).join('\n');

    const injectComment = buildMode === 'inject' ? `\n-- ${t('sql.comments.injectPoint')}` : '';

    return `SELECT 
  ${selectClause}
FROM ${fromClause}
WHERE 1=1
${whereClause}${injectComment}
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;  -- ${t('sql.comments.pagination')}`;
  };

  const generateClickHouseSQL = (returnFields: Field[], paramFields: Field[]) => {
    const whereClause = paramFields.map((f) => {
      const condition = `${f.name} = {${f.name}:${f.type}}`;
      return f.isRequired ? `  AND ${condition}` : `  AND (${condition} OR {${f.name}:${f.type}} IS NULL)`;
    }).join('\n');
    
    return `SELECT 
  ${returnFields.map(f => f.alias ? `${f.name} AS ${f.alias}` : f.name).join(',\n  ')}
FROM ${apiConfig.dataset || 'table_name'}
WHERE 1=1
${whereClause}
ORDER BY created_at DESC
LIMIT 20
SETTINGS max_execution_time = 60;  -- ${t('sql.comments.clickhouseSettings')}`;
  };

  const generateMongoQuery = (returnFields: Field[], paramFields: Field[]) => {
    const filterConditions = paramFields.map((f) => {
      const placeholder = `<${f.name}>`;
      if (f.isRequired) {
        return { [f.name]: placeholder };
      }
      return {
        $or: [
          { [f.name]: placeholder },
          { $expr: { $eq: [placeholder, null] } },
        ],
      };
    });

    const filterObj = filterConditions.length ? { $and: filterConditions } : {};

    const projectionObj: Record<string, number> = {};
    returnFields.forEach((f) => {
      projectionObj[f.alias || f.name] = 1;
    });

    return `db.${apiConfig.dataset || 'collection_name'}.find(
  ${JSON.stringify(filterObj, null, 2)},
  ${JSON.stringify(projectionObj, null, 2)}
)
.sort({ created_at: -1 })
.limit(20)
.skip(0);  // ${t('sql.comments.pagination')}`;
  };

  const generateBigQuerySQL = (returnFields: Field[], paramFields: Field[]) => {
    const whereClause = paramFields.map((f) => {
      const condition = `${f.name} = @${f.name}`;
      return f.isRequired ? `  AND ${condition}` : `  AND (${condition} OR @${f.name} IS NULL)`;
    }).join('\n');
    
    return `SELECT 
  ${returnFields.map(f => f.alias ? `${f.name} AS ${f.alias}` : f.name).join(',\n  ')}
FROM \`${apiConfig.dataset || 'project.dataset.table'}\`
WHERE TRUE
${whereClause}
ORDER BY created_at DESC
LIMIT 20
OFFSET 0;  -- ${t('sql.comments.pagination')}`;
  };

  const generateMaxComputeSQL = (returnFields: Field[], paramFields: Field[]) => {
    const whereClause = paramFields.map((f) => {
      const condition = `${f.name} = \${${f.name}}`;
      return f.isRequired ? `  AND ${condition}` : `  AND (${condition} OR \${${f.name}} IS NULL)`;
    }).join('\n');
    
    return `SELECT 
  ${returnFields.map(f => f.alias ? `${f.name} AS ${f.alias}` : f.name).join(',\n  ')}
FROM ${apiConfig.dataset || 'table_name'}
WHERE 1=1
${whereClause}
ORDER BY created_at DESC
LIMIT 20;  -- ${t('sql.comments.maxComputePagination')}`;
  };

  const handleCreateDataset = () => {
    if (!selectedConnection || !selectedTable) return;
    
    const key = `${selectedConnection}:${selectedTable}`;
    const newDataset = {
      id: `ds_${Date.now()}`,
      name: selectedTable,
      alias: `${selectedTable} Dataset`,
      domain: 'Custom'
    };
    
    setDatasetMapping(prev => ({
      ...prev,
      [key]: newDataset
    }));
    
    setDatasetStatus('found');
    setLinkedDataset(newDataset);
    
    // Auto-select the new dataset
    setApiConfig(prev => ({ 
      ...prev, 
      dataset: newDataset.name, 
      name: toSnakeCase(newDataset.name) 
    }));
    
    toast.success('Dataset created and linked successfully!');
  };

  const handleTableSelect = (table: string) => {
    setSelectedTable(table);
    const key = `${selectedConnection}:${table}`;
    const mapping = datasetMapping[key];
    
    if (mapping) {
      setDatasetStatus('found');
      setLinkedDataset(mapping);
      setApiConfig(prev => ({ 
        ...prev, 
        dataset: mapping.name, 
        name: toSnakeCase(mapping.name) 
      }));
      
      // Simulating field load
      if (!fields.some(f => f.table === mapping.name)) {
         const newFields = fields.map(f => ({ ...f, table: mapping.name }));
         setFields(newFields);
      }
    } else {
      setDatasetStatus('not_found');
      setLinkedDataset(null);
      setApiConfig(prev => ({ ...prev, dataset: '' })); // Clear dataset
    }
  };

  return (
    <div className="space-y-6">
      {context?.source === 'dataset' && context.datasetName ? (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-900">
            {t('context.banner', { name: context.datasetAlias || context.datasetName })}
          </div>
        </Card>
      ) : null}
      <div>
        <h1 className="text-3xl mb-2">{t('page.title')}</h1>
        <p className="text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`size-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="size-5" /> : step.id}
                </div>
                <div className="text-center">
                  <div className="text-sm mb-1">{step.name}</div>
                  <div className="text-xs text-muted-foreground">{step.desc}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 -mt-12 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2>{t('buildMode.title')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`p-6 cursor-pointer transition-all ${
                  buildMode === 'single'
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setBuildMode('single')}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-green-100 rounded flex items-center justify-center">
                    <Layers2 className="size-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('buildModes.single.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('buildModes.single.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{t('buildModes.single.badges.fast')}</Badge>
                      <Badge variant="secondary">{t('buildModes.single.badges.crud')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all ${
                  buildMode === 'join'
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setBuildMode('join')}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-blue-100 rounded flex items-center justify-center">
                    <Link2 className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('buildModes.join.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('buildModes.join.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{t('join.badges.innerJoin')}</Badge>
                      <Badge variant="secondary">{t('join.badges.leftJoin')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all ${
                  buildMode === 'inject'
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setBuildMode('inject')}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-purple-100 rounded flex items-center justify-center">
                    <Syringe className="size-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('buildModes.inject.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('buildModes.inject.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{t('buildModes.inject.badges.dynamic')}</Badge>
                      <Badge variant="secondary">{t('buildModes.inject.badges.parameterized')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all ${
                  buildMode === 'batch'
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setBuildMode('batch')}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-orange-100 rounded flex items-center justify-center">
                    <Sparkles className="size-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('buildModes.batch.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('buildModes.batch.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{t('buildModes.batch.badges.bulk')}</Badge>
                      <Badge variant="secondary">{t('buildModes.batch.badges.template')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all ${
                  buildMode === 'aggregate'
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setBuildMode('aggregate')}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-cyan-100 rounded flex items-center justify-center">
                    <BarChart2 className="size-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('buildModes.aggregate.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('buildModes.aggregate.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{t('buildModes.aggregate.badges.sum')}</Badge>
                      <Badge variant="secondary">{t('buildModes.aggregate.badges.count')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all ${
                  buildMode === 'complex'
                    ? 'border-primary border-2 bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setBuildMode('complex')}
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-red-100 rounded flex items-center justify-center">
                    <Layers2 className="size-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="mb-2">{t('buildModes.complex.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('buildModes.complex.description')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{t('buildModes.complex.badges.workflow')}</Badge>
                      <Badge variant="secondary">{t('buildModes.complex.badges.logic')}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 2 && buildMode !== 'batch' && (
          <div className="space-y-4">
            <div>
              <h2>{t('dataSource.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('dataSource.selectPrimary.label')}</p>
            </div>

            <div className="space-y-4">
              {/* Connection Selection */}
              <div className="space-y-2">
                <Label>Database Connection</Label>
                <Select
                  value={selectedConnection}
                  onValueChange={(val) => {
                    setSelectedConnection(val);
                    setSelectedTable('');
                    setDatasetStatus('idle');
                    setLinkedDataset(null);
                    setApiConfig(prev => ({ ...prev, dataset: '' }));
                    setTableSearch('');
                    setTablePage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Database Connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CONNECTIONS.map(conn => (
                      <SelectItem key={conn.id} value={conn.id}>
                        <div className="flex items-center gap-2">
                          <Database className="size-4 text-muted-foreground" />
                          <span>{conn.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">{conn.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Database Type</Label>
                <Select value={databaseType} onValueChange={(value: DatabaseType) => setDatabaseType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MySQL">MySQL</SelectItem>
                    <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                    <SelectItem value="SQL Server">SQL Server</SelectItem>
                    <SelectItem value="Oracle">Oracle</SelectItem>
                    <SelectItem value="ClickHouse">ClickHouse</SelectItem>
                    <SelectItem value="MongoDB">{t('dataSource.databaseType.options.mongoDb')}</SelectItem>
                    <SelectItem value="BigQuery">{t('dataSource.databaseType.options.bigQuery')}</SelectItem>
                    <SelectItem value="MaxCompute">{t('dataSource.databaseType.options.maxCompute')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedConnection && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Tables / Views</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Rows per page</span>
                      <Select
                        value={String(tablePageSize)}
                        onValueChange={(value) => {
                          setTablePageSize(Number(value));
                          setTablePage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tables or views..."
                        value={tableSearch}
                        onChange={(e) => {
                          setTableSearch(e.target.value);
                          setTablePage(1);
                        }}
                        className="pl-8"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tableRangeStart}-{tableRangeEnd} of {totalTables}
                    </div>
                  </div>

                  <Card className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead className="w-[120px] text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedTables.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                              No tables or views found
                            </TableCell>
                          </TableRow>
                        ) : (
                          pagedTables.map((table) => (
                            <TableRow
                              key={table.name}
                              className={`cursor-pointer ${selectedTable === table.name ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                              onClick={() => handleTableSelect(table.name)}
                            >
                              <TableCell className="font-mono">{table.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{table.type}</Badge>
                              </TableCell>
                              <TableCell>{table.createdAt}</TableCell>
                              <TableCell className="text-right">
                                {selectedTable === table.name ? (
                                  <Badge variant="secondary">Selected</Badge>
                                ) : (
                                  <Button size="sm" variant="outline">
                                    Select
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Page {currentTablePage} of {totalTablePages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTablePage((prev) => Math.max(1, Math.min(totalTablePages, prev - 1)))}
                        disabled={currentTablePage === 1}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTablePage((prev) => Math.max(1, Math.min(totalTablePages, prev + 1)))}
                        disabled={currentTablePage === totalTablePages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dataset Linkage Status */}
              {selectedTable && (
                <div className="mt-4">
                  {datasetStatus === 'found' && linkedDataset ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="size-4 text-green-600" />
                      <AlertTitle className="text-green-800">Dataset Linked</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Using dataset <strong>{linkedDataset.alias}</strong> ({linkedDataset.name})
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="size-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">No Linked Dataset</AlertTitle>
                      <AlertDescription className="text-amber-700 flex flex-col gap-2">
                        <p>No dataset exists for this table yet. You must create one to proceed.</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-fit bg-white border-amber-300 hover:bg-amber-100 text-amber-900"
                          onClick={handleCreateDataset}
                        >
                          <FolderPlus className="size-4 mr-2" />
                          Create & Link Dataset
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Existing Field Preview (only show if dataset is linked) */}
              {apiConfig.dataset && (
                <Card className="p-4 bg-muted/50">
                  <Label className="mb-3 block text-xs font-medium uppercase text-muted-foreground">{t('dataSource.fieldsPreview.label')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {fields.map((f) => (
                      <Badge key={f.name} variant="outline" className="bg-background">
                        {f.name}
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{f.type}</span>
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && buildMode === 'batch' && (
          <div className="space-y-4">
            <h2>{t('batch.config.title')}</h2>
            
            <div className="space-y-2">
              <Label>{t('batch.config.databaseType.label')}</Label>
              <Select value={databaseType} onValueChange={(value: DatabaseType) => setDatabaseType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="SQL Server">SQL Server</SelectItem>
                  <SelectItem value="ClickHouse">ClickHouse</SelectItem>
                  <SelectItem value="MongoDB">{t('dataSource.databaseType.options.mongoDb')}</SelectItem>
                  <SelectItem value="BigQuery">{t('dataSource.databaseType.options.bigQuery')}</SelectItem>
                  <SelectItem value="MaxCompute">{t('dataSource.databaseType.options.maxCompute')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5 text-blue-600" />
                <h3 className="text-blue-900">{t('batch.config.description.title')}</h3>
              </div>
              <p className="text-sm text-blue-800">
                {t('batch.config.description.body')}
              </p>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('batch.config.selectTables.label')}</Label>
                <div className="text-sm text-muted-foreground">
                  {t('batch.config.selectTables.selected', {
                    selected: batchAPIs.filter((api) => api.enabled).length,
                    total: batchAPIs.length,
                  })}
                </div>
              </div>
              
              {batchAPIs.map((api, index) => (
                <Card key={api.tableName} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={api.enabled}
                        onCheckedChange={(checked) => {
                          const newBatchAPIs = [...batchAPIs];
                          newBatchAPIs[index].enabled = checked as boolean;
                          setBatchAPIs(newBatchAPIs);
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono">{api.tableName}</span>
                          <Badge variant="outline">{api.method}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('batch.config.selectTables.willGenerate', { name: api.apiName })}
                        </div>
                      </div>
                    </div>
                    <Input
                      className="w-48"
                      placeholder={t('batch.config.selectTables.apiNamePlaceholder')}
                      value={api.apiName}
                      onChange={(e) => {
                        const newBatchAPIs = [...batchAPIs];
                        newBatchAPIs[index].apiName = e.target.value;
                        setBatchAPIs(newBatchAPIs);
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && buildMode !== 'batch' && (
          <div className="space-y-6">
            {buildMode === 'aggregate' && (
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('aggregate.steps.3.name')}</h3>
                </div>
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>{t('aggregate.groupBy.label')}</Label>
                      <div className="flex flex-wrap gap-2">
                        {fields.slice(0, 5).map((field, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10"
                          >
                            {field.name}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('aggregate.groupBy.hint')}</p>
                    </div>
                    <div className="space-y-3">
                      <Label>{t('aggregate.functions.label')}</Label>
                      <div className="grid grid-cols-4 gap-3">
                        {['SUM', 'COUNT', 'AVG', 'MAX', 'MIN'].map((func) => (
                          <Card key={func} className="p-3 text-center cursor-pointer hover:bg-primary/5">
                            <span className="font-mono text-sm">{func}</span>
                          </Card>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>{t('aggregate.having.label')}</Label>
                      <Input placeholder={t('aggregate.having.placeholder')} />
                      <p className="text-xs text-muted-foreground">{t('aggregate.having.hint')}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {buildMode === 'complex' && (
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('complex.steps.3.name')}</h3>
                </div>
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>{t('complex.workflow.label')}</Label>
                      <div className="border rounded-lg p-4 min-h-[120px]">
                        <p className="text-sm text-muted-foreground">{t('complex.workflow.placeholder')}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>{t('complex.steps.4.name')}</Label>
                      <div className="space-y-2">
                        {['Step 1: Data Filter', 'Step 2: Transformation', 'Step 3: Aggregation'].map((step, index) => (
                          <Card key={index} className="p-3 flex items-center gap-3">
                            <span className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">{index + 1}</span>
                            <span className="text-sm">{step}</span>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {buildMode === 'join' && (
              <div className="space-y-4 border-b pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t('join.title')}</h3>
                  <Button onClick={addJoinTable} size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    {t('join.actions.add')}
                  </Button>
                </div>

                {joinTables.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground">
                    <p>{t('join.empty')}</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {joinTables.map((join) => (
                      <Card key={join.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">{t('join.fields.table.label')}</Label>
                              <Select
                                value={join.table}
                                onValueChange={(value) => updateJoinTable(join.id, 'table', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('join.fields.table.placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="product_info">product_info</SelectItem>
                                  <SelectItem value="customer_profile">customer_profile</SelectItem>
                                  <SelectItem value="order_items">order_items</SelectItem>
                                  <SelectItem value="payments">payments</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">{t('join.fields.alias.label')}</Label>
                              <Input
                                placeholder={t('join.fields.alias.placeholder')}
                                value={join.alias}
                                onChange={(e) => updateJoinTable(join.id, 'alias', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">{t('join.fields.joinType.label')}</Label>
                              <Select
                                value={join.joinType}
                                onValueChange={(value) => updateJoinTable(join.id, 'joinType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INNER">{t('join.fields.joinType.options.inner')}</SelectItem>
                                  <SelectItem value="LEFT">{t('join.fields.joinType.options.left')}</SelectItem>
                                  <SelectItem value="RIGHT">{t('join.fields.joinType.options.right')}</SelectItem>
                                  <SelectItem value="FULL">FULL JOIN (全连接)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">{t('join.fields.onCondition.label')}</Label>
                              <Input
                                placeholder={t('join.fields.onCondition.placeholder')}
                                value={join.onCondition}
                                onChange={(e) =>
                                  updateJoinTable(join.id, 'onCondition', e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeJoinTable(join.id)}
                            className="mt-6"
                          >
                            <X className="size-4 text-red-600" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2>{t('params.title')}</h2>
                  <Badge className="bg-green-100 text-green-700">
                    Required {paramStats.required}
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700">
                    Optional {paramStats.optional}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={generateLargeDataset} disabled={loading}>
                    {loading ? <div className="animate-spin mr-2">C</div> : <BarChart2 className="size-4 mr-2" />}
                    Simulate Large Table (300+)
                  </Button>
                </div>
              </div>

              <div 
                ref={scrollContainerRef}
                className="border rounded-lg overflow-auto h-[600px] relative bg-white"
                onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              >
                <div style={{ height: `${flatList.length * 50}px` }} className="relative">
                  {/* Sticky Header */}
                  <div className="sticky top-0 z-20 bg-muted border-b grid grid-cols-[200px_120px_100px_100px_80px_80px_80px_1fr_40px] font-medium text-sm shadow-sm">
                    <div className="p-3 pl-4">Field Name</div>
                    <div className="p-3">Source</div>
                    <div className="p-3">Alias</div>
                    <div className="p-3">Type</div>
                    <div className="p-3 text-center">Param</div>
                    <div className="p-3 text-center">Required</div>
                    <div className="p-3 text-center">Return</div>
                    <div className="p-3">Default</div>
                    <div className="p-3 text-center"></div>
                  </div>

                  {(() => {
                    const ROW_HEIGHT = 50;
                    const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
                    const endIndex = Math.min(flatList.length - 1, startIndex + Math.ceil(600 / ROW_HEIGHT) + 5);
                    const visibleItems = [];

                    for (let i = startIndex; i <= endIndex; i++) {
                      const item = flatList[i];
                      if (!item) continue;
                      
                      const top = i * ROW_HEIGHT;
                      
                      if (item.type === 'header') {
                        const headerData = item.data as { name: string; count: number };
                        const groupName = headerData.name;
                        const count = headerData.count;
                        const isCollapsed = collapsedGroups.has(groupName);
                        
                        visibleItems.push(
                          <div 
                            key={`group-${groupName}`}
                            className="absolute left-0 right-0 flex items-center px-4 bg-muted/30 hover:bg-muted/50 cursor-pointer border-b z-10"
                            style={{ top: `${top}px`, height: `${ROW_HEIGHT}px` }}
                            onClick={() => toggleGroup(groupName)}
                          >
                            {isCollapsed ? <ChevronRight className="size-4 mr-2" /> : <ChevronDown className="size-4 mr-2" />}
                            <span className="font-medium">{groupName}</span>
                            <Badge variant="secondary" className="ml-2">{count}</Badge>
                          </div>
                        );
                      } else {
                        const field = item.data as Field;
                        const index = item.originalIndex!;
                        
                        visibleItems.push(
                          <div 
                            key={field.name}
                            className={`absolute left-0 right-0 grid grid-cols-[200px_120px_100px_100px_80px_80px_80px_1fr_40px] items-center border-b hover:bg-muted/10 transition-colors ${field.isPinned ? 'bg-blue-50/50' : ''}`}
                            style={{ top: `${top}px`, height: `${ROW_HEIGHT}px` }}
                          >
                            <div className="p-3 pl-4 flex items-center gap-2 overflow-hidden">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 shrink-0"
                                onClick={() => togglePin(index)}
                              >
                                {field.isPinned ? <Pin className="size-3 fill-blue-500 text-blue-500" /> : <PinOff className="size-3 text-muted-foreground" />}
                              </Button>
                              <div className="flex flex-col truncate">
                                <span className="font-mono text-sm truncate" title={field.name}>{field.name}</span>
                                {field.description && <span className="text-[10px] text-muted-foreground truncate">{field.description}</span>}
                              </div>
                            </div>
                            <div className="p-3 text-sm text-muted-foreground truncate" title={field.table || apiConfig.dataset || '-'}>
                              {field.table || apiConfig.dataset || '-'}
                            </div>
                            <div className="p-3">
                              <Input
                                size={1}
                                className="h-8 w-full"
                                placeholder={field.name}
                                value={field.alias || ''}
                                onChange={(e) => {
                                  const newFields = [...fields];
                                  newFields[index].alias = e.target.value;
                                  setFields(newFields);
                                }}
                              />
                            </div>
                            <div className="p-3">
                               <Badge variant="outline" className="text-xs">{field.type}</Badge>
                            </div>
                            <div className="p-3 text-center">
                              <Checkbox
                                checked={field.isParam}
                                onCheckedChange={() => toggleFieldParam(index)}
                              />
                            </div>
                            <div className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <Checkbox
                                  checked={field.isRequired}
                                  disabled={!field.isParam}
                                  onCheckedChange={() => {
                                    const newFields = [...fields];
                                    newFields[index].isRequired = !newFields[index].isRequired;
                                    setFields(newFields);
                                  }}
                                />
                                {field.isParam && (
                                  <Badge
                                    variant={field.isRequired ? 'default' : 'secondary'}
                                    className="text-[10px]"
                                  >
                                    {field.isRequired ? 'Required' : 'Optional'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="p-3 text-center">
                              <Checkbox
                                checked={field.isReturn}
                                onCheckedChange={() => toggleFieldReturn(index)}
                              />
                            </div>
                            <div className="p-3">
                              <Input
                                size={1}
                                className="h-8 w-full"
                                placeholder="-"
                                disabled={!field.isParam}
                                value={field.defaultValue}
                                onChange={(e) => {
                                  const newFields = [...fields];
                                  newFields[index].defaultValue = e.target.value;
                                  setFields(newFields);
                                }}
                              />
                            </div>
                            <div className="p-3 text-center">
                              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                setEditingFieldRule(index);
                              }}>
                                <Settings className="size-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    }
                    return visibleItems;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && buildMode === 'batch' && (
          <div className="space-y-4">
            <h2>{t('batch.preview.title')}</h2>
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="size-5 text-green-600" />
                <h3 className="text-green-900">
                  {t('batch.preview.ready', { count: batchAPIs.filter((api) => api.enabled).length })}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                {batchAPIs.filter((api) => api.enabled).map((api) => (
                  <div key={api.tableName} className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="size-4" />
                    <span>{t('batch.preview.item', { apiName: api.apiName, table: api.tableName })}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            <p className="text-sm text-muted-foreground">
              {t('batch.preview.hint')}
            </p>
          </div>
        )}

        {currentStep === 4 && buildMode === 'join' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2>{t('join.steps.4.name')}</h2>
              <Badge className="bg-purple-100 text-purple-700">
                {t('join.steps.4.desc')}
              </Badge>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>{t('join.optimization.indexStrategy')}</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">{t('join.optimization.indexStrategy.auto')}</SelectItem>
                        <SelectItem value="force_index">{t('join.optimization.indexStrategy.forceIndex')}</SelectItem>
                        <SelectItem value="no_index">{t('join.optimization.indexStrategy.noIndex')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t('join.optimization.indexStrategy.hint')}</p>
                  </div>
                  <div className="space-y-3">
                    <Label>{t('join.optimization.joinOrder')}</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">{t('join.optimization.joinOrder.auto')}</SelectItem>
                        <SelectItem value="straight">{t('join.optimization.joinOrder.straight')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{t('join.optimization.joinOrder.hint')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>{t('join.optimization.subquery')}</Label>
                  <Textarea
                    className="font-mono min-h-[100px]"
                    placeholder={t('join.optimization.subquery.placeholder')}
                  />
                  <p className="text-xs text-muted-foreground">{t('join.optimization.subquery.hint')}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t('join.optimization.tables', { count: joinTables.length + 1 })}
                  </div>
                  <Button variant="outline" size="sm">
                    {t('join.optimization.analyze')}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <Info className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t('join.optimization.tip')}</span>
              </div>
            </Card>
          </div>
        )}

        {currentStep === 6 && buildMode === 'complex' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>{t('complex.steps.6.name')}</h2>
              <Badge className="bg-red-100 text-red-700">
                {t('complex.steps.6.desc')}
              </Badge>
            </div>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>{t('complex.cache.label', 'Cache Strategy')}</Label>
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Cache</SelectItem>
                      <SelectItem value="redis">Redis Cache</SelectItem>
                      <SelectItem value="memory">Local Memory</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('complex.cache.hint')}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {((currentStep === 4 && !['batch', 'join', 'aggregate', 'complex'].includes(buildMode)) || 
          (currentStep === 5 && buildMode === 'join') ||
          (currentStep === 6 && buildMode === 'aggregate') ||
          (currentStep === 7 && buildMode === 'complex')) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>{t('sql.title')}</h2>
              <Badge className="bg-blue-100 text-blue-700">
                {databaseType}
              </Badge>
            </div>
            <div className="space-y-4">
              <Textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="font-mono min-h-[400px]"
                placeholder={t('sql.editor.placeholder')}
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleFormatSQL}>{t('sql.actions.format')}</Button>
                <Button variant="outline" onClick={handleSyntaxCheck}>{t('sql.actions.syntaxCheck')}</Button>
                <Button onClick={handleRunTest}>{t('sql.actions.runTest')}</Button>
              </div>
            </div>

            {sqlValidation.warnings.length > 0 && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex gap-2 mb-2">
                  <AlertTriangle className="size-5 text-yellow-600" />
                  <h3 className="text-yellow-900">{t('sql.optimization.title')}</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  {sqlValidation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {currentStep === 4 && buildMode === 'aggregate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>{t('aggregate.steps.4.name')}</h2>
              <Badge className="bg-cyan-100 text-cyan-700">
                {t('aggregate.steps.4.desc')}
              </Badge>
            </div>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>{t('aggregate.outputFormat.label')}</Label>
                    <Select defaultValue="json">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>{t('aggregate.dateFormat.label')}</Label>
                    <Select defaultValue="iso">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iso">ISO 8601</SelectItem>
                        <SelectItem value="unix">Unix Timestamp</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>{t('aggregate.nesting.label')}</Label>
                  <Input placeholder={t('aggregate.nesting.placeholder')} />
                  <p className="text-xs text-muted-foreground">{t('aggregate.nesting.hint')}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStep === 4 && buildMode === 'complex' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>{t('complex.steps.4.name')}</h2>
              <Badge className="bg-red-100 text-red-700">
                {t('complex.steps.4.desc')}
              </Badge>
            </div>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>{t('complex.transaction.label')}</Label>
                  <div className="flex items-center gap-3">
                    <Checkbox id="enableTransaction" />
                    <Label htmlFor="enableTransaction" className="text-sm font-normal">
                      {t('complex.transaction.enable')}
                    </Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>{t('complex.errorHandling.label')}</Label>
                  <Select defaultValue="rollback">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rollback">Rollback on Error</SelectItem>
                      <SelectItem value="continue">Continue on Error</SelectItem>
                      <SelectItem value="stop">Stop Execution</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>{t('complex.timeout.label')}</Label>
                  <Input type="number" defaultValue="30" className="w-32" />
                  <p className="text-xs text-muted-foreground">{t('complex.timeout.hint')}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStep === 4 && buildMode === 'batch' && (
          <div className="space-y-4">
            <h2>{t('batch.sql.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('batch.sql.subtitle', { databaseType })}
            </p>
            
            {batchAPIs.filter((api) => api.enabled).slice(0, 2).map((api) => (
              <Card key={api.tableName} className="p-4">
                <div className="mb-2">
                  <h3 className="mb-1">{api.apiName}</h3>
                  <p className="text-sm text-muted-foreground">{t('batch.sql.tableLabel', { table: api.tableName })}</p>
                </div>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {databaseType === 'MongoDB' 
                    ? `db.${api.tableName}.find({}).sort({ created_at: -1 }).limit(20).skip(0)`
                    : `SELECT * FROM ${api.tableName}\nWHERE 1=1\nORDER BY created_at DESC\nLIMIT 20 OFFSET 0;`
                  }
                </pre>
              </Card>
            ))}
            
            {batchAPIs.filter((api) => api.enabled).length > 2 && (
              <p className="text-sm text-muted-foreground text-center">
                {t('batch.sql.more', { count: batchAPIs.filter((api) => api.enabled).length - 2 })}
              </p>
            )}
          </div>
        )}

        {currentStep === 5 && buildMode === 'aggregate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>{t('aggregate.steps.5.name')}</h2>
              <Badge className="bg-cyan-100 text-cyan-700">
                {t('aggregate.steps.5.desc')}
              </Badge>
            </div>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>{t('aggregate.having.label')}</Label>
                  <Textarea 
                    placeholder={t('aggregate.having.placeholder')}
                    className="font-mono min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">{t('aggregate.having.hint')}</p>
                </div>
                <div className="space-y-3">
                  <Label>{t('aggregate.conditions.label', 'Additional Conditions')}</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <Badge variant="outline">user_id</Badge>
                      <span className="text-sm">=</span>
                      <Badge variant="outline">10</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStep === 5 && buildMode === 'complex' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>{t('complex.steps.5.name')}</h2>
              <Badge className="bg-red-100 text-red-700">
                {t('complex.steps.5.desc')}
              </Badge>
            </div>
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>{t('complex.codeEditor.label', 'Business Logic Code')}</Label>
                  <Textarea 
                    className="font-mono min-h-[300px]"
                    placeholder={`// Example business logic\nconst result = await processData(input);\nreturn transform(result);`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">{t('complex.codeEditor.validate', 'Validate')}</Button>
                  <Button variant="outline" size="sm">{t('complex.codeEditor.format', 'Format')}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {((currentStep === 5 && !['batch', 'join', 'aggregate', 'complex'].includes(buildMode)) ||
          (currentStep === 6 && buildMode === 'join') ||
          (currentStep === 7 && buildMode === 'aggregate') ||
          (currentStep === 8 && buildMode === 'complex')) && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('dataSource.apiName.label')}</label>
                <Input
                  value={apiConfig.name}
                  onChange={(e) => setApiConfig({ ...apiConfig, name: e.target.value })}
                  placeholder={t('dataSource.apiName.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('dataSource.method.label')}</label>
                <Select
                  value={apiConfig.method}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, method: value as 'get' | 'post' | 'put' | 'delete' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="get">GET</SelectItem>
                    <SelectItem value="post">POST</SelectItem>
                    <SelectItem value="put">PUT</SelectItem>
                    <SelectItem value="delete">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('publish.authType.label')}</label>
                <Select
                  value={apiConfig.authType}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, authType: value as 'apiKey' | 'oauth2' | 'none' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apiKey">{t('publish.authType.options.apiKey')}</SelectItem>
                    <SelectItem value="oauth2">{t('publish.authType.options.oauth2')}</SelectItem>
                    <SelectItem value="none">{t('publish.authType.options.none')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">参数验证与解析框架</label>
                <Select
                  value={apiConfig.paramValidation}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, paramValidation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joi">Joi (推荐)</SelectItem>
                    <SelectItem value="zod">Zod</SelectItem>
                    <SelectItem value="yup">Yup</SelectItem>
                    <SelectItem value="custom">自定义框架</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">选择用于解析和验证 HTTP 请求参数的底层框架。</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('publish.domain.label')}</label>
                <Select
                  value={apiConfig.domain}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, domain: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('publish.domain.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">{t('domains.order')}</SelectItem>
                    <SelectItem value="product">{t('domains.product')}</SelectItem>
                    <SelectItem value="user">{t('domains.user')}</SelectItem>
                    <SelectItem value="inventory">{t('domains.inventory')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('publish.qpsLimit.label')}</label>
                <Input
                  type="number"
                  value={apiConfig.qpsLimit}
                  onChange={(e) => setApiConfig({ ...apiConfig, qpsLimit: e.target.value })}
                  placeholder={t('publish.qpsLimit.placeholder')}
                />
                <p className="text-xs text-muted-foreground">{t('publish.qpsLimit.hint')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="p-4">
                <h3 className="font-medium mb-4">{t('publish.security.title')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('publish.security.items.sqlInjection', { status: '' })}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="size-3 mr-1" />
                      {t('publish.security.status.pass')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('publish.security.items.schema', { status: '' })}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="size-3 mr-1" />
                      {t('publish.security.status.enabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('publish.security.items.performanceScore', { score: sqlValidation.performanceScore })}</span>
                    <Badge variant="outline" className={sqlValidation.performanceScore > 80 ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
                      {sqlValidation.performanceScore > 80 ? <CheckCircle className="size-3 mr-1" /> : <AlertTriangle className="size-3 mr-1" />}
                      {sqlValidation.performanceScore > 80 ? t('publish.security.status.pass') : 'Warning'}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4">{t('preview.title')}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">{t('preview.table.category')}</TableHead>
                      <TableHead>{t('preview.table.details')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium align-top">{t('preview.headers.title')}</TableCell>
                      <TableCell>
                        <div className="space-y-2 text-sm font-mono bg-muted p-2 rounded">
                          <div>Content-Type: application/json</div>
                          {apiConfig.authType !== 'none' && (
                            <div>Authorization: {apiConfig.authType === 'apiKey' ? 'ApiKey' : 'Bearer'} *******</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium align-top">{t('preview.request.title')}</TableCell>
                      <TableCell>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="font-semibold mr-2">{getPreviewData().method.toUpperCase()}</span>
                            <span className="font-mono bg-muted px-1 rounded">{getPreviewData().url}</span>
                          </div>
                          {getPreviewData().requestBody && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">{t('preview.request.body')}:</div>
                              <pre className="font-mono bg-muted p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(getPreviewData().requestBody, null, 2)}
                              </pre>
                            </div>
                          )}
                          {getPreviewData().params.length > 0 && (!getPreviewData().requestBody) && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">{t('preview.request.params')}:</div>
                              <div className="space-y-1">
                                {getPreviewData().params.map(p => (
                                  <div key={p.name} className="flex gap-2 font-mono text-xs">
                                    <span>{p.alias || p.name}</span>
                                    <span className="text-muted-foreground">({p.type})</span>
                                    {p.isRequired && <span className="text-red-500">*</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium align-top">{t('preview.response.title')}</TableCell>
                      <TableCell>
                        <div className="space-y-2 text-sm">
                          <div className="flex gap-2">
                            <span className="font-semibold">{t('preview.response.status')}:</span>
                            <span className="text-green-600">200 OK</span>
                          </div>
                          <pre className="font-mono bg-muted p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(getPreviewData().responseBody, null, 2)}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium align-top">{t('preview.errors.title')}</TableCell>
                      <TableCell>
                        <div className="space-y-3 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium text-red-600">400 Bad Request</div>
                            <pre className="font-mono bg-muted p-2 rounded text-xs">
                              {JSON.stringify({ code: 400, message: 'Invalid parameter', details: '...' }, null, 2)}
                            </pre>
                          </div>
                          {apiConfig.authType !== 'none' && (
                            <div className="space-y-1">
                              <div className="font-medium text-orange-600">401 Unauthorized</div>
                              <div className="text-xs text-muted-foreground">{t('preview.errors.suggestion')}: Check token validity</div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium align-top">{t('preview.meta.title')}</TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('preview.meta.version')}:</span>
                            <span className="ml-2 font-mono">v1.0.0</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('preview.meta.latency')}:</span>
                            <span className="ml-2 font-mono">≤500ms</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">{t('preview.meta.timestamp')}:</span>
                            <span className="ml-2 font-mono">{getPreviewData().timestamp}</span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="size-4 mr-2" />
          {t('nav.prev')}
        </Button>
        {currentStep < getMaxSteps() ? (
          <Button
            onClick={() => {
              if (!validateStep(currentStep)) {
                return;
              }
              const nextStep = Math.min(getMaxSteps(), currentStep + 1);
              if ((nextStep === 4 && !['batch', 'join', 'aggregate', 'complex'].includes(buildMode)) ||
                  (nextStep === 5 && buildMode === 'join') ||
                  (nextStep === 6 && buildMode === 'aggregate') ||
                  (nextStep === 7 && buildMode === 'complex')) {
                generateSQL();
              }
              setCurrentStep(nextStep);
            }}
          >
            {t('nav.next')}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit}>
            <CheckCircle className="size-4 mr-2" />
            {buildMode === 'batch'
              ? t('nav.submitBatch', { count: batchAPIs.filter((api) => api.enabled).length })
              : t('nav.submit')}
          </Button>
        )}
      </div>

      {/* Field Validation Dialog */}
      <Dialog open={editingFieldRule !== null} onOpenChange={(open) => !open && setEditingFieldRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>参数高级配置 ({editingFieldRule !== null ? fields[editingFieldRule]?.name : ''})</DialogTitle>
          </DialogHeader>
          {editingFieldRule !== null && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>数据格式转换规则</Label>
                <Select 
                  value={fields[editingFieldRule]?.validation?.format || 'none'}
                  onValueChange={(val) => {
                    const newFields = [...fields];
                    newFields[editingFieldRule].validation = {
                      ...newFields[editingFieldRule].validation,
                      format: val
                    };
                    setFields(newFields);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    <SelectItem value="trim">去除前后空格 (Trim)</SelectItem>
                    <SelectItem value="lowercase">转小写</SelectItem>
                    <SelectItem value="uppercase">转大写</SelectItem>
                    <SelectItem value="date_iso">转换为 ISO 8601 日期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>校验规则 - 最小长度/最小值</Label>
                <Input 
                  type="number" 
                  placeholder="例如：0"
                  value={fields[editingFieldRule]?.validation?.minLength || ''}
                  onChange={(e) => {
                    const newFields = [...fields];
                    newFields[editingFieldRule].validation = {
                      ...newFields[editingFieldRule].validation,
                      minLength: e.target.value ? Number(e.target.value) : undefined
                    };
                    setFields(newFields);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>校验规则 - 最大长度/最大值</Label>
                <Input 
                  type="number" 
                  placeholder="例如：255" 
                  value={fields[editingFieldRule]?.validation?.maxLength || ''}
                  onChange={(e) => {
                    const newFields = [...fields];
                    newFields[editingFieldRule].validation = {
                      ...newFields[editingFieldRule].validation,
                      maxLength: e.target.value ? Number(e.target.value) : undefined
                    };
                    setFields(newFields);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>正则校验</Label>
                <Input 
                  placeholder="例如：^[a-zA-Z0-9_]+$" 
                  value={fields[editingFieldRule]?.validation?.pattern || ''}
                  onChange={(e) => {
                    const newFields = [...fields];
                    newFields[editingFieldRule].validation = {
                      ...newFields[editingFieldRule].validation,
                      pattern: e.target.value
                    };
                    setFields(newFields);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>自定义错误提示</Label>
                <Input 
                  placeholder="例如：参数格式不正确" 
                  value={fields[editingFieldRule]?.validation?.errorMessage || ''}
                  onChange={(e) => {
                    const newFields = [...fields];
                    newFields[editingFieldRule].validation = {
                      ...newFields[editingFieldRule].validation,
                      errorMessage: e.target.value
                    };
                    setFields(newFields);
                  }}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingFieldRule(null)}>取消</Button>
            <Button onClick={() => {
              toast.success('校验规则已保存');
              setEditingFieldRule(null);
            }}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
