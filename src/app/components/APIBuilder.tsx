import { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Sparkles, Plus, X, Link2, Syringe, Layers2 } from 'lucide-react';
import { toast } from 'sonner';

interface Field {
  name: string;
  type: string;
  isParam: boolean;
  isRequired: boolean;
  isReturn: boolean;
  defaultValue: string;
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

export function APIBuilder({
  context,
  onClearContext,
}: {
  context?: APIBuilderContext | null;
  onClearContext?: () => void;
}) {
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
  const [sqlValidation] = useState({
    syntaxValid: true,
    performanceScore: 85,
    warnings: ['建议在 user_id 字段上添加索引', '查询结果集较大，建议添加分页参数'],
  });

  const steps = [
    { id: 1, name: '构建模式', desc: '选择API构建方式' },
    { id: 2, name: '数据源配置', desc: '选择数据源和表' },
    { id: 3, name: '参数配置', desc: '定义入参和返回字段' },
    { id: 4, name: 'SQL 编写', desc: '生成查询语句' },
    { id: 5, name: '校验发布', desc: '安全检查和配置' },
  ];

  const datasetOptions = useMemo(() => {
    const base = [
      { name: 'user_orders', alias: '用户订单表', domain: '订单域' },
      { name: 'product_info', alias: '商品信息表', domain: '商品域' },
      { name: 'customer_profile', alias: '客户画像表', domain: '用户域' },
      { name: 'inventory_data', alias: '库存数据表', domain: '库存域' },
    ];

    if (context?.source !== 'dataset') return base;
    const exists = base.some((d) => d.name === context.datasetName);
    if (exists) return base;
    return [{ name: context.datasetName, alias: context.datasetAlias, domain: context.domain }, ...base];
  }, [context]);

  useEffect(() => {
    if (!context) return;
    if (context.source !== 'dataset') return;
    if (!context.datasetId || !context.datasetName) {
      toast.error('数据集信息不完整，无法基于数据集构建');
      onClearContext?.();
      return;
    }

    setBuildMode('single');
    setCurrentStep(2);
    setApiConfig((prev) => ({
      ...prev,
      dataset: context.datasetName,
      domain: context.domain,
    }));

    const list = context.fields ?? [];
    if (!list.length) {
      toast.error('未获取到数据集字段信息');
      return;
    }
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

  const generateSQL = () => {
    const returnFields = fields.filter((f) => f.isReturn).map((f) => f.name);
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

  const generateRelationalSQL = (returnFields: string[], paramFields: Field[]) => {
    let fromClause = apiConfig.dataset || 'table_name';
    
    if (buildMode === 'join' && joinTables.length > 0) {
      const joinClauses = joinTables
        .map((j) => `${j.joinType} JOIN ${j.table} ${j.alias} ON ${j.onCondition}`)
        .join('\n');
      fromClause = `${fromClause}\n${joinClauses}`;
    }

    const whereClause = paramFields.map((f) => `  AND ${f.name} = :${f.name}`).join('\n');
    const injectComment = buildMode === 'inject' ? '\n-- Inject Point: Dynamic filters will be injected here' : '';

    return `SELECT 
  ${returnFields.join(',\n  ')}
FROM ${fromClause}
WHERE 1=1
${whereClause}${injectComment}
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;  -- 分页参数`;
  };

  const generateClickHouseSQL = (returnFields: string[], paramFields: Field[]) => {
    const whereClause = paramFields.map((f) => `  AND ${f.name} = {${f.name}:${f.type}}`).join('\n');
    
    return `SELECT 
  ${returnFields.join(',\n  ')}
FROM ${apiConfig.dataset || 'table_name'}
WHERE 1=1
${whereClause}
ORDER BY created_at DESC
LIMIT 20
SETTINGS max_execution_time = 60;  -- ClickHouse特定参数`;
  };

  const generateMongoQuery = (returnFields: string[], paramFields: Field[]) => {
    const filterObj: any = {};
    paramFields.forEach(f => {
      filterObj[f.name] = `<${f.name}>`;
    });

    const projectionObj: any = {};
    returnFields.forEach(f => {
      projectionObj[f] = 1;
    });

    return `db.${apiConfig.dataset || 'collection_name'}.find(
  ${JSON.stringify(filterObj, null, 2)},
  ${JSON.stringify(projectionObj, null, 2)}
)
.sort({ created_at: -1 })
.limit(20)
.skip(0);  // 分页参数`;
  };

  const generateBigQuerySQL = (returnFields: string[], paramFields: Field[]) => {
    const whereClause = paramFields.map((f) => `  AND ${f.name} = @${f.name}`).join('\n');
    
    return `SELECT 
  ${returnFields.join(',\n  ')}
FROM \`${apiConfig.dataset || 'project.dataset.table'}\`
WHERE TRUE
${whereClause}
ORDER BY created_at DESC
LIMIT 20
OFFSET 0;  -- 分页参数`;
  };

  const generateMaxComputeSQL = (returnFields: string[], paramFields: Field[]) => {
    const whereClause = paramFields.map((f) => `  AND ${f.name} = \${${f.name}}`).join('\n');
    
    return `SELECT 
  ${returnFields.join(',\n  ')}
FROM ${apiConfig.dataset || 'table_name'}
WHERE 1=1
${whereClause}
ORDER BY created_at DESC
LIMIT 20;  -- MaxCompute分页`;
  };

  return (
    <div className="space-y-6">
      {context?.source === 'dataset' && context.datasetName ? (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-900">
            基于数据集 {context.datasetAlias || context.datasetName} 构建
          </div>
        </Card>
      ) : null}
      <div>
        <h1 className="text-3xl mb-2">API 构建器</h1>
        <p className="text-muted-foreground">支持单表、多表关联、动态注入和批量构建</p>
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
            <h2>选择构建模式</h2>
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
                    <h3 className="mb-2">单表查询</h3>
                    <p className="text-sm text-muted-foreground">
                      基于单个数据表构建API，适用于简单的CRUD操作
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">简单快速</Badge>
                      <Badge variant="secondary">标准CRUD</Badge>
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
                    <h3 className="mb-2">多表关联 (Join)</h3>
                    <p className="text-sm text-muted-foreground">
                      支持多表关联查询，通过 JOIN 语句关联多个数据表
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">INNER JOIN</Badge>
                      <Badge variant="secondary">LEFT JOIN</Badge>
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
                    <h3 className="mb-2">动态注入 (Inject)</h3>
                    <p className="text-sm text-muted-foreground">
                      运行时动态构建查询条件，支持灵活的筛选场景
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">动态条件</Badge>
                      <Badge variant="secondary">参数化查询</Badge>
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
                    <h3 className="mb-2">批量构建</h3>
                    <p className="text-sm text-muted-foreground">
                      一次性为多个数据表批量生成标准API，提高效率
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">批量生成</Badge>
                      <Badge variant="secondary">标准模板</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 2 && buildMode !== 'batch' && (
          <div className="space-y-4">
            <h2>数据源配置</h2>
            
            <div className="space-y-2">
              <Label>数据库类型</Label>
              <Select value={databaseType} onValueChange={(value: DatabaseType) => setDatabaseType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="ClickHouse">ClickHouse</SelectItem>
                  <SelectItem value="Oracle">Oracle</SelectItem>
                  <SelectItem value="MongoDB">MongoDB (NoSQL)</SelectItem>
                  <SelectItem value="BigQuery">Google BigQuery</SelectItem>
                  <SelectItem value="MaxCompute">阿里云 MaxCompute</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                系统会根据数据库类型自动生成对应的查询语句
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>API 名称</Label>
                <Input
                  placeholder="getUserOrders"
                  value={apiConfig.name}
                  onChange={(e) => setApiConfig({ ...apiConfig, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>主数据集/表</Label>
                <Select
                  value={apiConfig.dataset}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, dataset: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择数据集" />
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
            </div>

            {buildMode === 'join' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>关联表配置 (Join Tables)</Label>
                  <Button onClick={addJoinTable} size="sm" variant="outline" className="gap-2">
                    <Plus className="size-4" />
                    添加关联表
                  </Button>
                </div>

                {joinTables.length === 0 ? (
                  <Card className="p-6 text-center text-muted-foreground">
                    <p>暂无关联表，点击"添加关联表"开始配置多表关联</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {joinTables.map((join) => (
                      <Card key={join.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-4 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">关联表</Label>
                              <Select
                                value={join.table}
                                onValueChange={(value) => updateJoinTable(join.id, 'table', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择表" />
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
                              <Label className="text-xs">别名</Label>
                              <Input
                                placeholder="p"
                                value={join.alias}
                                onChange={(e) => updateJoinTable(join.id, 'alias', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">关联类型</Label>
                              <Select
                                value={join.joinType}
                                onValueChange={(value) => updateJoinTable(join.id, 'joinType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="INNER">INNER JOIN</SelectItem>
                                  <SelectItem value="LEFT">LEFT JOIN</SelectItem>
                                  <SelectItem value="RIGHT">RIGHT JOIN</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">关联条件</Label>
                              <Input
                                placeholder="t1.id = t2.order_id"
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

            <div className="space-y-2">
              <Label>请求方法</Label>
              <Select
                value={apiConfig.method}
                onValueChange={(value) => setApiConfig({ ...apiConfig, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET - 查询数据</SelectItem>
                  <SelectItem value="POST">POST - 创建数据</SelectItem>
                  <SelectItem value="PUT">PUT - 更新数据</SelectItem>
                  <SelectItem value="DELETE">DELETE - 删除数据</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {currentStep === 2 && buildMode === 'batch' && (
          <div className="space-y-4">
            <h2>批量构建配置</h2>
            
            <div className="space-y-2">
              <Label>数据库类型</Label>
              <Select value={databaseType} onValueChange={(value: DatabaseType) => setDatabaseType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="ClickHouse">ClickHouse</SelectItem>
                  <SelectItem value="MongoDB">MongoDB (NoSQL)</SelectItem>
                  <SelectItem value="BigQuery">Google BigQuery</SelectItem>
                  <SelectItem value="MaxCompute">阿里云 MaxCompute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-5 text-blue-600" />
                <h3 className="text-blue-900">批量构建说明</h3>
              </div>
              <p className="text-sm text-blue-800">
                选择需要生成API的数据表，系统将为每个表自动生成标准的 CRUD API（查询、创建、更新、删除），
                所有API将采用统一的命名规范和参数格式。
              </p>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>选择数据表</Label>
                <div className="text-sm text-muted-foreground">
                  已选择 {batchAPIs.filter(api => api.enabled).length} / {batchAPIs.length}
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
                          将生成: {api.apiName}
                        </div>
                      </div>
                    </div>
                    <Input
                      className="w-48"
                      placeholder="API名称"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>参数配置</h2>
              <Button variant="outline" size="sm" onClick={generateSQL}>
                <Sparkles className="size-4 mr-1" />
                自动生成 SQL
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">字段名</th>
                    <th className="text-left p-3">类型</th>
                    <th className="text-center p-3">作为入参</th>
                    <th className="text-center p-3">必填</th>
                    <th className="text-center p-3">返回字段</th>
                    <th className="text-left p-3">默认值</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 font-mono text-sm">{field.name}</td>
                      <td className="p-3">
                        <Badge variant="outline">{field.type}</Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={field.isParam}
                          onCheckedChange={() => toggleFieldParam(index)}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={field.isRequired}
                          disabled={!field.isParam}
                          onCheckedChange={() => {
                            const newFields = [...fields];
                            newFields[index].isRequired = !newFields[index].isRequired;
                            setFields(newFields);
                          }}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={field.isReturn}
                          onCheckedChange={() => toggleFieldReturn(index)}
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          size={1}
                          placeholder="-"
                          className="h-8"
                          disabled={!field.isParam}
                          value={field.defaultValue}
                          onChange={(e) => {
                            const newFields = [...fields];
                            newFields[index].defaultValue = e.target.value;
                            setFields(newFields);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentStep === 3 && buildMode === 'batch' && (
          <div className="space-y-4">
            <h2>批量构建预览</h2>
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="size-5 text-green-600" />
                <h3 className="text-green-900">准备生成 {batchAPIs.filter(api => api.enabled).length} 个 API</h3>
              </div>
              <div className="space-y-2 text-sm">
                {batchAPIs.filter(api => api.enabled).map((api) => (
                  <div key={api.tableName} className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="size-4" />
                    <span>{api.apiName} - 基于表 {api.tableName}</span>
                  </div>
                ))}
              </div>
            </Card>
            
            <p className="text-sm text-muted-foreground">
              点击"下一步"将为所有选中的表生成标准API，包括分页、排序、筛选等功能。
            </p>
          </div>
        )}

        {currentStep === 4 && buildMode !== 'batch' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>查询语句</h2>
              <Badge className="bg-blue-100 text-blue-700">
                {databaseType}
              </Badge>
            </div>
            <Tabs defaultValue="editor">
              <TabsList>
                <TabsTrigger value="editor">代码编辑器</TabsTrigger>
                <TabsTrigger value="preview">执行计划</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="space-y-4">
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="font-mono min-h-[300px]"
                  placeholder="编写查询语句..."
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline">格式化</Button>
                  <Button variant="outline">语法检查</Button>
                  <Button>执行测试</Button>
                </div>
              </TabsContent>
              <TabsContent value="preview">
                <Card className="p-4 bg-muted">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {`执行计划分析:
→ Limit: 20 rows
  → Order by: created_at DESC
    → Filter: user_id = :user_id AND order_id = :order_id
      → Index lookup using idx_user_id

性能评分: ${sqlValidation.performanceScore}/100
预估耗时: <50ms
索引使用: ✓ 已使用
全表扫描: ✗ 无`}
                  </pre>
                </Card>
              </TabsContent>
            </Tabs>

            {sqlValidation.warnings.length > 0 && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex gap-2 mb-2">
                  <AlertTriangle className="size-5 text-yellow-600" />
                  <h3 className="text-yellow-900">优化建议</h3>
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
            <h2>批量生成的查询语句</h2>
            <p className="text-sm text-muted-foreground">
              以下是为每个选中表生成的查询语句示例（{databaseType}）
            </p>
            
            {batchAPIs.filter(api => api.enabled).slice(0, 2).map((api) => (
              <Card key={api.tableName} className="p-4">
                <div className="mb-2">
                  <h3 className="mb-1">{api.apiName}</h3>
                  <p className="text-sm text-muted-foreground">表: {api.tableName}</p>
                </div>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {databaseType === 'MongoDB' 
                    ? `db.${api.tableName}.find({}).sort({ created_at: -1 }).limit(20).skip(0)`
                    : `SELECT * FROM ${api.tableName}\nWHERE 1=1\nORDER BY created_at DESC\nLIMIT 20 OFFSET 0;`
                  }
                </pre>
              </Card>
            ))}
            
            {batchAPIs.filter(api => api.enabled).length > 2 && (
              <p className="text-sm text-muted-foreground text-center">
                ... 还有 {batchAPIs.filter(api => api.enabled).length - 2} 个 API
              </p>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h2>安全与发布配置</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>认证方式</Label>
                <Select
                  value={apiConfig.authType}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, authType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API_KEY">API Key</SelectItem>
                    <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
                    <SelectItem value="NONE">无认证 (不推荐)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>业务域</Label>
                <Select
                  value={apiConfig.domain}
                  onValueChange={(value) => setApiConfig({ ...apiConfig, domain: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择业务域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">订单域</SelectItem>
                    <SelectItem value="product">商品域</SelectItem>
                    <SelectItem value="user">用户域</SelectItem>
                    <SelectItem value="inventory">库存域</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>QPS 限流</Label>
              <Input
                type="number"
                value={apiConfig.qpsLimit}
                onChange={(e) => setApiConfig({ ...apiConfig, qpsLimit: e.target.value })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">每秒最大请求数</p>
            </div>

            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex gap-2 mb-2">
                <CheckCircle className="size-5 text-green-600" />
                <h3 className="text-green-900">安全检查通过</h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                <li>SQL 注入风险: 通过</li>
                <li>Schema 校验: 通过</li>
                <li>性能评分: {sqlValidation.performanceScore}/100</li>
                <li>数据脱敏规则: 已应用</li>
                <li>分页参数: 已配置</li>
                {buildMode === 'inject' && <li>动态注入参数化: 已启用</li>}
                {buildMode === 'batch' && <li>批量生成数量: {batchAPIs.filter(api => api.enabled).length} 个</li>}
              </ul>
            </Card>
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
          上一步
        </Button>
        {currentStep < 5 ? (
          <Button onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}>
            下一步
            <ArrowRight className="size-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="size-4 mr-2" />
            {buildMode === 'batch' ? `提交审核 (${batchAPIs.filter(api => api.enabled).length} 个 API)` : '提交审核'}
          </Button>
        )}
      </div>
    </div>
  );
}
