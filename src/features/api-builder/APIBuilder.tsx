import { useEffect, useMemo, useState, useRef } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Sparkles, Plus, X, Link2, Syringe, Layers2, Search, ChevronDown, ChevronRight, Pin, PinOff, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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

type DatabaseType = 'MySQL' | 'PostgreSQL' | 'ClickHouse' | 'Oracle' | 'MongoDB' | 'Redis' | 'BigQuery' | 'MaxCompute';

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
  const [buildMode, setBuildMode] = useState<'single' | 'join' | 'inject' | 'batch'>('single');
  const [databaseType, setDatabaseType] = useState<DatabaseType>('MySQL');
  const [apiConfig, setApiConfig] = useState({
    name: '',
    dataset: '',
    method: 'GET',
    authType: 'API_KEY',
    domain: '',
    qpsLimit: '100',
  });

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
  
  // Large Dataset & Virtual Scroll State
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

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

  const flatList = useMemo(() => {
    const list: Array<{ type: 'header' | 'row'; data: { name: string; count: number } | Field; originalIndex?: number }> = [];
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

  const steps = useMemo(() => {
    return [
      { id: 1, name: t('steps.1.name'), desc: t('steps.1.desc') },
      { id: 2, name: t('steps.2.name'), desc: t('steps.2.desc') },
      { id: 3, name: t('steps.3.name'), desc: t('steps.3.desc') },
      { id: 4, name: t('steps.4.name'), desc: t('steps.4.desc') },
      { id: 5, name: t('steps.5.name'), desc: t('steps.5.desc') },
    ];
  }, [t]);

  const datasetOptions = useMemo(() => {
    const base = [
      { name: 'user_orders', alias: t('datasets.userOrders'), domain: t('domains.order') },
      { name: 'product_info', alias: t('datasets.productInfo'), domain: t('domains.product') },
      { name: 'customer_profile', alias: t('datasets.customerProfile'), domain: t('domains.user') },
      { name: 'inventory_data', alias: t('datasets.inventoryData'), domain: t('domains.inventory') },
    ];

    if (context?.source !== 'dataset') return base;
    const exists = base.some((d) => d.name === context.datasetName);
    if (exists) return base;
    return [{ name: context.datasetName, alias: context.datasetAlias, domain: context.domain }, ...base];
  }, [context, t]);

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
  }, [context, onClearContext]);

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
      return `  AND ${col} = :${f.name}`;
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
    const whereClause = paramFields.map((f) => `  AND ${f.name} = {${f.name}:${f.type}}`).join('\n');
    
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
    const filterObj: Record<string, string> = {};
    paramFields.forEach((f) => {
      filterObj[f.name] = `<${f.name}>`;
    });

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
    const whereClause = paramFields.map((f) => `  AND ${f.name} = @${f.name}`).join('\n');
    
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
    const whereClause = paramFields.map((f) => `  AND ${f.name} = \${${f.name}}`).join('\n');
    
    return `SELECT 
  ${returnFields.map(f => f.alias ? `${f.name} AS ${f.alias}` : f.name).join(',\n  ')}
FROM ${apiConfig.dataset || 'table_name'}
WHERE 1=1
${whereClause}
ORDER BY created_at DESC
LIMIT 20;  -- ${t('sql.comments.maxComputePagination')}`;
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
              <div className="space-y-2">
                <Label>{t('dataSource.dataset.label')}</Label>
                <Select
                  value={apiConfig.dataset}
                  onValueChange={(value) => {
                    const newName = toSnakeCase(value);
                    setApiConfig({ ...apiConfig, dataset: value, name: newName });
                    // Simulating field load for preview
                    if (!fields.some(f => f.table === value)) {
                       const newFields = fields.map(f => ({ ...f, table: value }));
                       setFields(newFields);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('dataSource.dataset.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetOptions.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name} ({d.alias})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <h2>{t('params.title')}</h2>
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
                  <div className="sticky top-0 z-20 bg-muted border-b grid grid-cols-[200px_120px_100px_100px_80px_80px_80px_1fr] font-medium text-sm shadow-sm">
                    <div className="p-3 pl-4">Field Name</div>
                    <div className="p-3">Source</div>
                    <div className="p-3">Alias</div>
                    <div className="p-3">Type</div>
                    <div className="p-3 text-center">Param</div>
                    <div className="p-3 text-center">Required</div>
                    <div className="p-3 text-center">Return</div>
                    <div className="p-3">Default</div>
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
                        const groupName = item.data.name;
                        const count = item.data.count;
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
                            className={`absolute left-0 right-0 grid grid-cols-[200px_120px_100px_100px_80px_80px_80px_1fr] items-center border-b hover:bg-muted/10 transition-colors ${field.isPinned ? 'bg-blue-50/50' : ''}`}
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
                              <Checkbox
                                checked={field.isRequired}
                                disabled={!field.isParam}
                                onCheckedChange={() => {
                                  const newFields = [...fields];
                                  newFields[index].isRequired = !newFields[index].isRequired;
                                  setFields(newFields);
                                }}
                              />
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

        {currentStep === 4 && buildMode !== 'batch' && (
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
                <Button variant="outline">{t('sql.actions.format')}</Button>
                <Button variant="outline">{t('sql.actions.syntaxCheck')}</Button>
                <Button>{t('sql.actions.runTest')}</Button>
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

        {currentStep === 5 && (
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
                            <span className="ml-2 font-mono">~50ms</span>
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
        {currentStep < 5 ? (
          <Button
            onClick={() => {
              const nextStep = Math.min(5, currentStep + 1);
              if (nextStep === 4) {
                generateSQL();
              }
              setCurrentStep(nextStep);
            }}
          >
            {t('nav.next')}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="size-4 mr-2" />
            {buildMode === 'batch'
              ? t('nav.submitBatch', { count: batchAPIs.filter((api) => api.enabled).length })
              : t('nav.submit')}
          </Button>
        )}
      </div>
    </div>
  );
}
