import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Table, Search, Tag, Shield, Edit, Layers, FolderOpen, ArrowLeft, Zap, Calendar, User, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Dataset {
  id: string;
  name: string;
  alias: string;
  source: string;
  domain: string;
  tags: string[];
  fields: number;
  masked: number;
  rowCount: string;
  lastUpdate: string;
  relatedAPIs?: string[];
  description?: string;
}

type DatasetField = {
  name: string;
  type: string;
  alias: string;
  masked: boolean;
  description: string;
  group: string;
  important?: boolean;
};

function normalizeSearchText(v: string) {
  return v.trim().toLowerCase();
}

function buildDatasetFields(
  dataset: Dataset,
  overridesByName?: Record<string, Partial<Pick<DatasetField, 'alias' | 'description' | 'masked'>>>,
): DatasetField[] {
  const types = ['bigint', 'int', 'varchar', 'datetime', 'decimal', 'bool'];
  const baseByName: Record<string, Omit<DatasetField, 'group'>> = {
    user_id: { name: 'user_id', type: 'bigint', alias: '用户ID', masked: true, description: '用户唯一标识', important: true },
    order_id: { name: 'order_id', type: 'varchar', alias: '订单ID', masked: false, description: '订单唯一标识', important: true },
    order_date: { name: 'order_date', type: 'datetime', alias: '下单时间', masked: false, description: '订单创建时间', important: true },
    total_amount: { name: 'total_amount', type: 'decimal', alias: '订单金额', masked: false, description: '订单总金额', important: true },
    status: { name: 'status', type: 'varchar', alias: '状态', masked: false, description: '当前状态', important: true },
    sku_id: { name: 'sku_id', type: 'varchar', alias: 'SKU', masked: false, description: '商品SKU标识', important: true },
    product_id: { name: 'product_id', type: 'varchar', alias: '商品ID', masked: false, description: '商品唯一标识', important: true },
    price: { name: 'price', type: 'decimal', alias: '价格', masked: false, description: '单价', important: true },
    stock: { name: 'stock', type: 'int', alias: '库存', masked: false, description: '当前库存', important: true },
    email: { name: 'email', type: 'varchar', alias: '邮箱', masked: true, description: '用户邮箱', important: true },
    phone: { name: 'phone', type: 'varchar', alias: '手机号', masked: true, description: '用户手机号', important: true },
    created_at: { name: 'created_at', type: 'datetime', alias: '创建时间', masked: false, description: '记录创建时间', important: true },
    updated_at: { name: 'updated_at', type: 'datetime', alias: '更新时间', masked: false, description: '记录更新时间', important: false },
  };

  const seedNames =
    dataset.name === 'user_orders'
      ? ['order_id', 'user_id', 'order_date', 'total_amount', 'status', 'created_at', 'updated_at']
      : dataset.name === 'product_info'
        ? ['product_id', 'sku_id', 'price', 'stock', 'created_at', 'updated_at']
        : ['user_id', 'email', 'phone', 'status', 'created_at', 'updated_at'];

  const fields: DatasetField[] = [];
  for (const n of seedNames) {
    const base = baseByName[n];
    if (!base) continue;
    const o = overridesByName?.[n];
    fields.push({ ...base, ...o, group: '关键字段' });
  }

  const remaining = Math.max(0, dataset.fields - fields.length);
  for (let i = 1; i <= remaining; i += 1) {
    const name = `${dataset.name}_col_${i}`;
    const type = types[i % types.length];
    const masked = dataset.masked > 0 ? i <= dataset.masked : false;
    const group =
      masked ? '敏感字段' : type === 'datetime' ? '时间字段' : type === 'decimal' ? '金额字段' : '业务字段';
    const o = overridesByName?.[name];
    fields.push({
      name,
      type,
      alias: o?.alias ?? `字段${i}`,
      masked: o?.masked ?? masked,
      description: o?.description ?? `字段说明 ${i}`,
      group,
      important: i <= 3,
    });
  }

  return fields;
}

function VirtualizedRows<T>({
  items,
  height,
  rowHeight,
  overscan = 8,
  header,
  minWidth,
  renderRow,
  getKey,
}: {
  items: readonly T[];
  height: number;
  rowHeight: number;
  overscan?: number;
  header?: React.ReactNode;
  minWidth?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        setScrollTop(el.scrollTop);
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const totalHeight = items.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / rowHeight) + overscan,
  );
  const offsetY = startIndex * rowHeight;
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  return (
    <div ref={containerRef} className="overflow-auto" style={{ height }}>
      <div style={{ minWidth, position: 'relative' }}>
        {header}
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetY}px)`,
            }}
          >
            {visibleItems.map((item, i) => {
              const absoluteIndex = startIndex + i;
              return (
                <div key={getKey(item, absoluteIndex)} style={{ height: rowHeight }}>
                  {renderRow(item, absoluteIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Datasets() {
  const [datasets, setDatasets] = useState<Dataset[]>([
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
      relatedAPIs: ['getUserOrders', 'getOrderDetail', 'createOrder'],
      description: '存储所有用户订单信息，包括订单状态、金额、时间等核心字段',
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
      relatedAPIs: ['updateInventory'],
      description: '实时库存数据表，记录各仓库的商品库存量',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');
  const [onlyKeyFields, setOnlyKeyFields] = useState(true);
  const [collapsedFieldGroups, setCollapsedFieldGroups] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isFieldEditOpen, setIsFieldEditOpen] = useState(false);
  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [fieldEditsByDatasetId, setFieldEditsByDatasetId] = useState<Record<string, Record<string, Partial<Pick<DatasetField, 'alias' | 'description' | 'masked'>>>>>({});

  const canEditDatasets = true;
  const canCreateAPI = true;

  const datasetFormDefaults = {
    name: '',
    alias: '',
    source: '',
    domain: '订单域',
    tags: '核心',
    fields: '12',
    masked: '0',
    rowCount: '0',
    description: '',
  };

  const [datasetForm, setDatasetForm] = useState(datasetFormDefaults);
  const [datasetFormErrors, setDatasetFormErrors] = useState<Record<string, string>>({});

  const resetDatasetForm = () => {
    setDatasetForm(datasetFormDefaults);
    setDatasetFormErrors({});
  };

  const openCreate = () => {
    if (!canEditDatasets) {
      toast.error('当前账号无数据集管理权限');
      return;
    }
    resetDatasetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (d: Dataset) => {
    if (!canEditDatasets) {
      toast.error('当前账号无数据集管理权限');
      return;
    }
    setEditTargetId(d.id);
    setDatasetForm({
      name: d.name,
      alias: d.alias,
      source: d.source,
      domain: d.domain,
      tags: d.tags.join(','),
      fields: String(d.fields),
      masked: String(d.masked),
      rowCount: d.rowCount,
      description: d.description ?? '',
    });
    setDatasetFormErrors({});
    setIsEditOpen(true);
  };

  const validateDatasetForm = () => {
    const errors: Record<string, string> = {};
    const name = datasetForm.name.trim();
    const alias = datasetForm.alias.trim();
    const source = datasetForm.source.trim();
    const rowCount = datasetForm.rowCount.trim();
    const fields = Number(datasetForm.fields);
    const masked = Number(datasetForm.masked);

    if (!name) errors.name = '请输入数据集名称（英文）';
    if (name && !/^[a-z][a-z0-9_]*$/i.test(name)) errors.name = '名称仅支持字母/数字/下划线，且以字母开头';
    if (!alias) errors.alias = '请输入数据集别名';
    if (!source) errors.source = '请输入数据源';
    if (!Number.isFinite(fields) || fields <= 0) errors.fields = '字段数必须大于 0';
    if (!Number.isFinite(masked) || masked < 0) errors.masked = '脱敏字段不能为负数';
    if (Number.isFinite(fields) && Number.isFinite(masked) && masked > fields) errors.masked = '脱敏字段不能大于字段数';
    if (!rowCount) errors.rowCount = '请输入数据量';

    setDatasetFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const upsertDataset = (mode: 'create' | 'edit') => {
    if (!validateDatasetForm()) {
      toast.error('请先修正表单错误');
      return;
    }
    const fields = Number(datasetForm.fields);
    const masked = Number(datasetForm.masked);
    const nextTags = datasetForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (mode === 'create') {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
      const next: Dataset = {
        id,
        name: datasetForm.name.trim(),
        alias: datasetForm.alias.trim(),
        source: datasetForm.source.trim(),
        domain: datasetForm.domain,
        tags: nextTags.length ? nextTags : ['未分类'],
        fields,
        masked,
        rowCount: datasetForm.rowCount.trim(),
        lastUpdate: new Date().toISOString().slice(0, 10),
        relatedAPIs: [],
        description: datasetForm.description.trim() || undefined,
      };
      setDatasets((prev) => [next, ...prev]);
      toast.success('数据集已创建');
      setIsCreateOpen(false);
      resetDatasetForm();
      setSearchTerm('');
      setSelectedCategory('all');
      setSelectedTag('all');
      setPage(1);
      return;
    }

    if (!editTargetId) return;
    setDatasets((prev) =>
      prev.map((d) =>
        d.id !== editTargetId
          ? d
          : {
              ...d,
              name: datasetForm.name.trim(),
              alias: datasetForm.alias.trim(),
              source: datasetForm.source.trim(),
              domain: datasetForm.domain,
              tags: nextTags.length ? nextTags : ['未分类'],
              fields,
              masked,
              rowCount: datasetForm.rowCount.trim(),
              lastUpdate: new Date().toISOString().slice(0, 10),
              description: datasetForm.description.trim() || undefined,
            },
      ),
    );
    if (selectedDataset?.id === editTargetId) {
      setSelectedDataset((prev) =>
        prev
          ? {
              ...prev,
              name: datasetForm.name.trim(),
              alias: datasetForm.alias.trim(),
              source: datasetForm.source.trim(),
              domain: datasetForm.domain,
              tags: nextTags.length ? nextTags : ['未分类'],
              fields,
              masked,
              rowCount: datasetForm.rowCount.trim(),
              lastUpdate: new Date().toISOString().slice(0, 10),
              description: datasetForm.description.trim() || undefined,
            }
          : prev,
      );
    }
    toast.success('数据集已更新');
    setIsEditOpen(false);
    setEditTargetId(null);
  };

  const setFieldEdit = (datasetId: string, fieldName: string, patch: Partial<Pick<DatasetField, 'alias' | 'description' | 'masked'>>) => {
    setFieldEditsByDatasetId((prev) => ({
      ...prev,
      [datasetId]: {
        ...(prev[datasetId] ?? {}),
        [fieldName]: {
          ...(prev[datasetId]?.[fieldName] ?? {}),
          ...patch,
        },
      },
    }));
  };

  const seedLineage = () => {
    if (!selectedDataset) return [];
    const upstream = selectedDataset.source.includes('仓库') ? ['ODS.user_orders', 'ODS.customer_profile'] : ['prod_mysql.user_orders'];
    const downstream = (selectedDataset.relatedAPIs ?? []).map((a) => `API.${a}`);
    return [
      { title: '上游', items: upstream },
      { title: '当前', items: [`dataset.${selectedDataset.name}`] },
      { title: '下游', items: downstream.length ? downstream : ['暂无下游依赖'] },
    ];
  };

  const seedHistory = () => {
    if (!selectedDataset) return [];
    return [
      { at: '2025-12-28 09:15', by: '李四', action: '字段描述更新', detail: '补充了敏感字段说明' },
      { at: '2025-12-20 18:03', by: '张三', action: '脱敏规则调整', detail: '新增 phone/email 脱敏' },
      { at: '2025-11-15 14:30', by: '张三', action: '创建数据集', detail: '初始化元数据与标签' },
    ];
  };

  const allFields = useMemo(
    () =>
      selectedDataset
        ? buildDatasetFields(selectedDataset, fieldEditsByDatasetId[selectedDataset.id])
        : [],
    [fieldEditsByDatasetId, selectedDataset],
  );
  const normalizedFieldSearch = normalizeSearchText(fieldSearch);
  const filteredFields = useMemo(() => {
    const list = normalizedFieldSearch
      ? allFields.filter((f) => {
          const hay = `${f.name} ${f.type} ${f.alias} ${f.description} ${f.group}`;
          return hay.toLowerCase().includes(normalizedFieldSearch);
        })
      : allFields;
    return onlyKeyFields && !normalizedFieldSearch ? list.filter((f) => f.group === '关键字段' || f.important) : list;
  }, [allFields, normalizedFieldSearch, onlyKeyFields]);

  const groupedFields = useMemo(() => {
    const by = filteredFields.reduce<Record<string, DatasetField[]>>((acc, f) => {
      const g = normalizedFieldSearch ? '搜索结果' : f.group;
      acc[g] ??= [];
      acc[g].push(f);
      return acc;
    }, {});
    return Object.entries(by).sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'));
  }, [filteredFields, normalizedFieldSearch]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const categories = useMemo(() => {
    const domainCounts = datasets.reduce<Record<string, number>>((acc, d) => {
      acc[d.domain] = (acc[d.domain] ?? 0) + 1;
      return acc;
    }, {});
    const domains = Object.keys(domainCounts).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    return [{ id: 'all', name: '全部数据集', count: datasets.length }, ...domains.map((d) => ({ id: d, name: d, count: domainCounts[d] }))];
  }, [datasets]);

  const hotTags = useMemo(() => {
    const tagCounts = datasets.flatMap((d) => d.tags).reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hans-CN'))
      .map(([tag]) => tag)
      .slice(0, 12);
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchesSearch =
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.alias.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || dataset.domain === selectedCategory;
      const matchesTag = selectedTag === 'all' || dataset.tags.includes(selectedTag);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [datasets, searchTerm, selectedCategory, selectedTag]);

  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedDatasets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDatasets.slice(start, start + pageSize);
  }, [currentPage, filteredDatasets, pageSize]);

  const pageModel = useMemo(() => {
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
  }, [currentPage, totalPages]);

  const showDetail = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setViewMode('detail');
    setFieldSearch('');
    setOnlyKeyFields(true);
    setCollapsedFieldGroups({});
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedDataset(null);
  };

  const openAPIBuilderFromDataset = (d: Dataset) => {
    if (!canCreateAPI) {
      toast.error('当前账号无 API 构建权限');
      return;
    }
    const fields = buildDatasetFields(d, fieldEditsByDatasetId[d.id]).map((f) => ({
      name: f.name,
      type: f.type,
      alias: f.alias,
      masked: f.masked,
      description: f.description,
      important: f.important === true || f.group === '关键字段',
    }));
    window.dispatchEvent(
      new CustomEvent('eda:navigate', {
        detail: {
          view: 'api-builder',
          apiBuilderContext: {
            source: 'dataset',
            datasetId: d.id,
            datasetName: d.name,
            datasetAlias: d.alias,
            domain: d.domain,
            fields,
          },
        },
      }),
    );
  };

  if (viewMode === 'detail' && selectedDataset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={backToList} className="gap-2">
            <ArrowLeft className="size-4" />
            返回列表
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="size-10 bg-blue-100 rounded flex items-center justify-center">
              <Table className="size-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl">{selectedDataset.alias}</h1>
              <p className="text-sm text-muted-foreground font-mono">{selectedDataset.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="mb-4">基本信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">数据源</div>
                  <div>{selectedDataset.source}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">业务域</div>
                  <Badge className="bg-blue-100 text-blue-700">{selectedDataset.domain}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">字段数量</div>
                  <div>{selectedDataset.fields}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">脱敏字段</div>
                  <div className="flex items-center gap-1">
                    {selectedDataset.masked > 0 && <Shield className="size-3 text-orange-500" />}
                    {selectedDataset.masked}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">数据量</div>
                  <div>{selectedDataset.rowCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">最后更新</div>
                  <div>{selectedDataset.lastUpdate}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {selectedDataset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="size-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">描述</div>
                <p className="text-sm">{selectedDataset.description}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2>字段列表</h2>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canEditDatasets}
                  onClick={() => {
                    if (!canEditDatasets) {
                      toast.error('当前账号无数据集管理权限');
                      return;
                    }
                    setIsFieldEditOpen(true);
                  }}
                >
                  <Edit className="size-4 mr-1" />
                  编辑字段
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={onlyKeyFields} onCheckedChange={(v) => setOnlyKeyFields(v === true)} />
                  <span className="text-sm">仅关键字段</span>
                </div>
                <div className="relative w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    className="pl-9"
                    placeholder="搜索字段名/别名/类型/描述"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {groupedFields.map(([groupName, list]) => {
                  const isCollapsed = collapsedFieldGroups[groupName] ?? (groupName !== '关键字段' && groupName !== '搜索结果');
                  const header = (
                    <div className="grid grid-cols-12 text-xs text-muted-foreground bg-muted px-3 py-2 sticky top-0 z-10">
                      <div className="col-span-3">字段名</div>
                      <div className="col-span-2">类型</div>
                      <div className="col-span-3">别名</div>
                      <div className="col-span-1">脱敏</div>
                      <div className="col-span-3">描述</div>
                    </div>
                  );
                  const renderRow = (f: DatasetField) => (
                    <div className={`grid grid-cols-12 items-center text-sm border-t px-3 ${f.group === '关键字段' ? 'bg-primary/5' : ''}`}>
                      <div className="col-span-3 py-2 font-mono truncate" title={f.name}>
                        {f.name}
                      </div>
                      <div className="col-span-2 py-2">
                        <Badge variant="outline">{f.type}</Badge>
                      </div>
                      <div className="col-span-3 py-2 truncate" title={f.alias}>
                        {f.alias}
                      </div>
                      <div className="col-span-1 py-2">
                        {f.masked ? <Shield className="size-4 text-orange-500" /> : '-'}
                      </div>
                      <div className="col-span-3 py-2 truncate" title={f.description}>
                        {f.description}
                      </div>
                    </div>
                  );

                  return (
                    <div key={groupName} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent transition-colors"
                        onClick={() => setCollapsedFieldGroups((s) => ({ ...s, [groupName]: !isCollapsed }))}
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                          <span className="text-sm">{groupName}</span>
                          <Badge variant="secondary" className="text-xs">{list.length}</Badge>
                        </div>
                      </button>
                      {!isCollapsed && (
                        <div className="border-t">
                          <VirtualizedRows
                            items={list}
                            height={320}
                            rowHeight={44}
                            header={header}
                            minWidth={900}
                            getKey={(f) => f.name}
                            renderRow={(f) => renderRow(f as DatasetField)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-muted-foreground mt-3">
                共 {filteredFields.length} 条
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                关联 API ({selectedDataset.relatedAPIs?.length || 0})
              </h3>
              {selectedDataset.relatedAPIs && selectedDataset.relatedAPIs.length > 0 ? (
                <div className="space-y-2">
                  {selectedDataset.relatedAPIs.map((apiName) => (
                    <Card
                      key={apiName}
                      className="p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        navigator.clipboard?.writeText(apiName).catch(() => undefined);
                        toast.message(`已复制：${apiName}`);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm">{apiName}</span>
                        <Badge variant="outline" className="text-xs">GET</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /api/v1/orders/...
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => {
                      openAPIBuilderFromDataset(selectedDataset);
                    }}
                  >
                    <Zap className="size-4" />
                    创建新 API
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">暂无关联 API</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      openAPIBuilderFromDataset(selectedDataset);
                    }}
                  >
                    <Zap className="size-4" />
                    创建 API
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="mb-3">操作</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled={!canEditDatasets}
                  onClick={() => openEdit(selectedDataset)}
                >
                  <Edit className="size-4" />
                  编辑数据集
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsLineageOpen(true)}
                >
                  <Layers className="size-4" />
                  查看血缘关系
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <Calendar className="size-4" />
                  变更历史
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3">元数据</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">创建人</div>
                  <div className="flex items-center gap-2">
                    <User className="size-3" />
                    <span>张三</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">创建时间</div>
                  <div>2025-10-15 14:30</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">更新人</div>
                  <div className="flex items-center gap-2">
                    <User className="size-3" />
                    <span>李四</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">更新时间</div>
                  <div>2025-12-28 09:15</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Dialog open={isFieldEditOpen} onOpenChange={setIsFieldEditOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>编辑字段</DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 text-xs text-muted-foreground bg-muted px-3 py-2">
                <div className="col-span-3">字段名</div>
                <div className="col-span-2">类型</div>
                <div className="col-span-3">别名</div>
                <div className="col-span-1">脱敏</div>
                <div className="col-span-3">描述</div>
              </div>
              <div className="max-h-[520px] overflow-auto">
                {allFields.map((f) => (
                  <div key={f.name} className="grid grid-cols-12 items-center text-sm border-t px-3">
                    <div className="col-span-3 py-2 font-mono truncate" title={f.name}>
                      {f.name}
                    </div>
                    <div className="col-span-2 py-2">
                      <Badge variant="outline">{f.type}</Badge>
                    </div>
                    <div className="col-span-3 py-2">
                      <Input
                        value={f.alias}
                        onChange={(e) => setFieldEdit(selectedDataset.id, f.name, { alias: e.target.value })}
                      />
                    </div>
                    <div className="col-span-1 py-2 flex items-center justify-center">
                      <Checkbox
                        checked={f.masked}
                        onCheckedChange={(v) => setFieldEdit(selectedDataset.id, f.name, { masked: v === true })}
                      />
                    </div>
                    <div className="col-span-3 py-2">
                      <Input
                        value={f.description}
                        onChange={(e) => setFieldEdit(selectedDataset.id, f.name, { description: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFieldEditOpen(false)}>
                关闭
              </Button>
              <Button
                onClick={() => {
                  toast.success('字段已保存');
                  setIsFieldEditOpen(false);
                }}
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isLineageOpen} onOpenChange={setIsLineageOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>血缘关系</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4">
              {seedLineage().map((col) => (
                <Card key={col.title} className="p-4">
                  <div className="text-sm text-muted-foreground mb-2">{col.title}</div>
                  <div className="space-y-2">
                    {col.items.map((it) => (
                      <div key={it} className="px-3 py-2 rounded border bg-background font-mono text-xs">
                        {it}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLineageOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>变更历史</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {seedHistory().map((h) => (
                <Card key={`${h.at}-${h.action}`} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div>{h.action}</div>
                      <div className="text-sm text-muted-foreground">{h.detail}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {h.at} · {h.by}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Category Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="size-5 text-primary" />
            <h3>数据集分类</h3>
          </div>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setPage(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <span>{category.name}</span>
                <Badge variant={selectedCategory === category.id ? 'secondary' : 'outline'}>
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 mt-4">
          <h3 className="mb-3 flex items-center gap-2">
            <Tag className="size-4" />
            热门标签
          </h3>
          <div className="flex flex-wrap gap-2">
            {hotTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'secondary'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  setSelectedTag((t) => (t === tag ? 'all' : tag));
                  setPage(1);
                }}
              >
                {tag}
              </Badge>
            ))}
            {selectedTag !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setSelectedTag('all');
                  setPage(1);
                }}
              >
                清除
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">数据集管理</h1>
            <p className="text-muted-foreground">查看和管理数据表元数据</p>
          </div>
          <Button className="gap-2" onClick={openCreate} disabled={!canEditDatasets}>
            <Plus className="size-4" />
            创建数据集
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索数据集名称或别名..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {/* Datasets Grid */}
        <div className="overflow-y-auto pr-2 max-h-[calc(100vh-340px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedDatasets.map((dataset) => (
              <Card key={dataset.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <Table className="size-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="mb-1 truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">
                            {dataset.alias}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{dataset.alias}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-mono text-muted-foreground truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">
                            {dataset.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{dataset.name}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(dataset)} disabled={!canEditDatasets}>
                    <Edit className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{dataset.source}</Badge>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {dataset.domain}
                  </Badge>
                  {dataset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="size-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1 text-[12px]">字段数</div>
                    <div className="text-[14px] font-medium">{dataset.fields}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-[12px]">脱敏字段</div>
                    <div className="flex items-center gap-1 text-[14px] font-medium">
                      {dataset.masked > 0 && <Shield className="size-3 text-orange-500" />}
                      {dataset.masked}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-[12px]">数据量</div>
                    <div className="text-[14px] font-medium">{dataset.rowCount}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                  <span>最后更新: {dataset.lastUpdate}</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => showDetail(dataset)}
                  >
                    查看详情 →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredDatasets.length} 条
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">每页</div>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
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
                  setPage((p) => Math.max(1, p - 1));
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>
            {pageModel.map((item, idx) => {
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
                    isActive={item === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(item);
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
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {filteredDatasets.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">没有找到匹配的数据集</p>
          </Card>
        )}
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetDatasetForm();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>创建数据集</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm">数据集名称（英文）</div>
              <Input
                value={datasetForm.name}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, name: e.target.value }));
                  if (datasetFormErrors.name) setDatasetFormErrors((p) => ({ ...p, name: '' }));
                }}
                placeholder="例：user_orders"
              />
              {datasetFormErrors.name ? <div className="text-xs text-red-600">{datasetFormErrors.name}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">数据集别名</div>
              <Input
                value={datasetForm.alias}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, alias: e.target.value }));
                  if (datasetFormErrors.alias) setDatasetFormErrors((p) => ({ ...p, alias: '' }));
                }}
                placeholder="例：用户订单表"
              />
              {datasetFormErrors.alias ? <div className="text-xs text-red-600">{datasetFormErrors.alias}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">数据源</div>
              <Input
                value={datasetForm.source}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, source: e.target.value }));
                  if (datasetFormErrors.source) setDatasetFormErrors((p) => ({ ...p, source: '' }));
                }}
                placeholder="例：生产数据库"
              />
              {datasetFormErrors.source ? <div className="text-xs text-red-600">{datasetFormErrors.source}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">业务域</div>
              <Select value={datasetForm.domain} onValueChange={(v) => setDatasetForm((p) => ({ ...p, domain: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['订单域', '商品域', '用户域', '库存域'].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm">字段数</div>
              <Input
                inputMode="numeric"
                value={datasetForm.fields}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, '');
                  setDatasetForm((p) => ({ ...p, fields: next }));
                  if (datasetFormErrors.fields) setDatasetFormErrors((p) => ({ ...p, fields: '' }));
                }}
              />
              {datasetFormErrors.fields ? <div className="text-xs text-red-600">{datasetFormErrors.fields}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">脱敏字段</div>
              <Input
                inputMode="numeric"
                value={datasetForm.masked}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, '');
                  setDatasetForm((p) => ({ ...p, masked: next }));
                  if (datasetFormErrors.masked) setDatasetFormErrors((p) => ({ ...p, masked: '' }));
                }}
              />
              {datasetFormErrors.masked ? <div className="text-xs text-red-600">{datasetFormErrors.masked}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">数据量</div>
              <Input
                value={datasetForm.rowCount}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, rowCount: e.target.value }));
                  if (datasetFormErrors.rowCount) setDatasetFormErrors((p) => ({ ...p, rowCount: '' }));
                }}
                placeholder="例：1.2M"
              />
              {datasetFormErrors.rowCount ? <div className="text-xs text-red-600">{datasetFormErrors.rowCount}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">标签（逗号分隔）</div>
              <Input value={datasetForm.tags} onChange={(e) => setDatasetForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-sm">描述（可选）</div>
              <Input
                value={datasetForm.description}
                onChange={(e) => setDatasetForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="简单描述用途与口径"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetDatasetForm();
              }}
            >
              取消
            </Button>
            <Button onClick={() => upsertDataset('create')}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditTargetId(null);
            resetDatasetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑数据集</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm">数据集名称（英文）</div>
              <Input
                value={datasetForm.name}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, name: e.target.value }));
                  if (datasetFormErrors.name) setDatasetFormErrors((p) => ({ ...p, name: '' }));
                }}
              />
              {datasetFormErrors.name ? <div className="text-xs text-red-600">{datasetFormErrors.name}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">数据集别名</div>
              <Input
                value={datasetForm.alias}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, alias: e.target.value }));
                  if (datasetFormErrors.alias) setDatasetFormErrors((p) => ({ ...p, alias: '' }));
                }}
              />
              {datasetFormErrors.alias ? <div className="text-xs text-red-600">{datasetFormErrors.alias}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">数据源</div>
              <Input
                value={datasetForm.source}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, source: e.target.value }));
                  if (datasetFormErrors.source) setDatasetFormErrors((p) => ({ ...p, source: '' }));
                }}
              />
              {datasetFormErrors.source ? <div className="text-xs text-red-600">{datasetFormErrors.source}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">业务域</div>
              <Select value={datasetForm.domain} onValueChange={(v) => setDatasetForm((p) => ({ ...p, domain: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['订单域', '商品域', '用户域', '库存域'].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm">字段数</div>
              <Input
                inputMode="numeric"
                value={datasetForm.fields}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, '');
                  setDatasetForm((p) => ({ ...p, fields: next }));
                  if (datasetFormErrors.fields) setDatasetFormErrors((p) => ({ ...p, fields: '' }));
                }}
              />
              {datasetFormErrors.fields ? <div className="text-xs text-red-600">{datasetFormErrors.fields}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">脱敏字段</div>
              <Input
                inputMode="numeric"
                value={datasetForm.masked}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d]/g, '');
                  setDatasetForm((p) => ({ ...p, masked: next }));
                  if (datasetFormErrors.masked) setDatasetFormErrors((p) => ({ ...p, masked: '' }));
                }}
              />
              {datasetFormErrors.masked ? <div className="text-xs text-red-600">{datasetFormErrors.masked}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">数据量</div>
              <Input
                value={datasetForm.rowCount}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, rowCount: e.target.value }));
                  if (datasetFormErrors.rowCount) setDatasetFormErrors((p) => ({ ...p, rowCount: '' }));
                }}
              />
              {datasetFormErrors.rowCount ? <div className="text-xs text-red-600">{datasetFormErrors.rowCount}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">标签（逗号分隔）</div>
              <Input value={datasetForm.tags} onChange={(e) => setDatasetForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-sm">描述（可选）</div>
              <Input value={datasetForm.description} onChange={(e) => setDatasetForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditTargetId(null);
                resetDatasetForm();
              }}
            >
              取消
            </Button>
            <Button onClick={() => upsertDataset('edit')}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
