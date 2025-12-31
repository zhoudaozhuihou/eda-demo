import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Plus, Table, Search, Tag, Shield, Edit, Layers, FolderOpen, ArrowLeft, Zap, Calendar, User, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { datasetsActions, fetchDatasets } from '@/features/datasets/store';
import type { Dataset } from '@/features/datasets/types';
import { useTranslation } from 'react-i18next';

type FieldGroupId = 'key' | 'sensitive' | 'time' | 'money' | 'business' | 'search';

type DatasetField = {
  name: string;
  type: string;
  alias: string;
  masked: boolean;
  description: string;
  group: FieldGroupId;
  important?: boolean;
};

function normalizeSearchText(v: string) {
  return v.trim().toLowerCase();
}

type FieldSeed = {
  name: string;
  type: string;
  aliasKey: string;
  descriptionKey: string;
  masked: boolean;
  important?: boolean;
};

const baseByName: Record<string, FieldSeed> = {
  user_id: {
    name: 'user_id',
    type: 'bigint',
    aliasKey: 'seed.fields.user_id.alias',
    descriptionKey: 'seed.fields.user_id.description',
    masked: true,
    important: true,
  },
  order_id: {
    name: 'order_id',
    type: 'varchar',
    aliasKey: 'seed.fields.order_id.alias',
    descriptionKey: 'seed.fields.order_id.description',
    masked: false,
    important: true,
  },
  order_date: {
    name: 'order_date',
    type: 'datetime',
    aliasKey: 'seed.fields.order_date.alias',
    descriptionKey: 'seed.fields.order_date.description',
    masked: false,
    important: true,
  },
  total_amount: {
    name: 'total_amount',
    type: 'decimal',
    aliasKey: 'seed.fields.total_amount.alias',
    descriptionKey: 'seed.fields.total_amount.description',
    masked: false,
    important: true,
  },
  status: {
    name: 'status',
    type: 'varchar',
    aliasKey: 'seed.fields.status.alias',
    descriptionKey: 'seed.fields.status.description',
    masked: false,
    important: true,
  },
  sku_id: {
    name: 'sku_id',
    type: 'varchar',
    aliasKey: 'seed.fields.sku_id.alias',
    descriptionKey: 'seed.fields.sku_id.description',
    masked: false,
    important: true,
  },
  product_id: {
    name: 'product_id',
    type: 'varchar',
    aliasKey: 'seed.fields.product_id.alias',
    descriptionKey: 'seed.fields.product_id.description',
    masked: false,
    important: true,
  },
  price: {
    name: 'price',
    type: 'decimal',
    aliasKey: 'seed.fields.price.alias',
    descriptionKey: 'seed.fields.price.description',
    masked: false,
    important: true,
  },
  stock: {
    name: 'stock',
    type: 'int',
    aliasKey: 'seed.fields.stock.alias',
    descriptionKey: 'seed.fields.stock.description',
    masked: false,
    important: true,
  },
  email: {
    name: 'email',
    type: 'varchar',
    aliasKey: 'seed.fields.email.alias',
    descriptionKey: 'seed.fields.email.description',
    masked: true,
    important: true,
  },
  phone: {
    name: 'phone',
    type: 'varchar',
    aliasKey: 'seed.fields.phone.alias',
    descriptionKey: 'seed.fields.phone.description',
    masked: true,
    important: true,
  },
  created_at: {
    name: 'created_at',
    type: 'datetime',
    aliasKey: 'seed.fields.created_at.alias',
    descriptionKey: 'seed.fields.created_at.description',
    masked: false,
    important: true,
  },
  updated_at: {
    name: 'updated_at',
    type: 'datetime',
    aliasKey: 'seed.fields.updated_at.alias',
    descriptionKey: 'seed.fields.updated_at.description',
    masked: false,
    important: false,
  },
};

function buildDatasetFields(
  dataset: Dataset,
  overridesByName?: Record<string, Partial<Pick<DatasetField, 'alias' | 'description' | 'masked'>>>,
  t?: (key: string, options?: Record<string, unknown>) => string,
): DatasetField[] {
  const types = ['bigint', 'int', 'varchar', 'datetime', 'decimal', 'bool'];

  const seedNames =
    dataset.name === 'user_orders'
      ? ['order_id', 'user_id', 'order_date', 'total_amount', 'status', 'created_at', 'updated_at']
      : dataset.name === 'product_info'
        ? ['product_id', 'sku_id', 'price', 'stock', 'created_at', 'updated_at']
        : ['user_id', 'email', 'phone', 'status', 'created_at', 'updated_at'];

  const fields: DatasetField[] = [];
  for (const n of seedNames) {
    const base = baseByName[n] as FieldSeed | undefined;
    if (!base) continue;
    const o = overridesByName?.[n];
    fields.push({
      name: base.name,
      type: base.type,
      alias: o?.alias ?? t?.(base.aliasKey) ?? base.name,
      masked: o?.masked ?? base.masked,
      description: o?.description ?? t?.(base.descriptionKey) ?? '',
      important: base.important,
      group: 'key',
    });
  }

  const remaining = Math.max(0, dataset.fields - fields.length);
  for (let i = 1; i <= remaining; i += 1) {
    const name = `${dataset.name}_col_${i}`;
    const type = types[i % types.length];
    const masked = dataset.masked > 0 ? i <= dataset.masked : false;
    const group: FieldGroupId =
      masked ? 'sensitive' : type === 'datetime' ? 'time' : type === 'decimal' ? 'money' : 'business';
    const o = overridesByName?.[name];
    fields.push({
      name,
      type,
      alias: o?.alias ?? t?.('seed.generated.alias', { index: i }) ?? `col_${i}`,
      masked: o?.masked ?? masked,
      description: o?.description ?? t?.('seed.generated.description', { index: i }) ?? '',
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
  const { t, i18n } = useTranslation('datasets');
  const dispatch = useAppDispatch();
  const datasets = useAppSelector((s) => s.datasets.items);
  const datasetsStatus = useAppSelector((s) => s.datasets.status);
  const localeForSort = i18n.language.startsWith('en') ? 'en' : 'zh-Hans-CN';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const domainOptions = useMemo(() => {
    const maybeDomains = t('domains', { returnObjects: true }) as unknown;
    const keys =
      maybeDomains && typeof maybeDomains === 'object' ? Object.keys(maybeDomains as Record<string, unknown>) : [];
    return keys.sort((a, b) =>
      t(`domains.${a}` as never, { defaultValue: a }).localeCompare(
        t(`domains.${b}` as never, { defaultValue: b }),
        localeForSort,
      ),
    );
  }, [localeForSort, t]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
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

  useEffect(() => {
    if (datasetsStatus !== 'idle') return;
    dispatch(fetchDatasets());
  }, [datasetsStatus, dispatch]);

  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return null;
    return datasets.find((d) => d.id === selectedDatasetId) ?? null;
  }, [datasets, selectedDatasetId]);

  const datasetFormDefaults = {
    name: '',
    alias: '',
    source: '',
    domain: domainOptions[0] ?? '',
    tags: '',
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
      toast.error(t('permissions.noManage'));
      return;
    }
    resetDatasetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (d: Dataset) => {
    if (!canEditDatasets) {
      toast.error(t('permissions.noManage'));
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

    if (!name) errors.name = t('form.errors.nameRequired');
    if (name && !/^[a-z][a-z0-9_]*$/i.test(name)) errors.name = t('form.errors.nameInvalid');
    if (!alias) errors.alias = t('form.errors.aliasRequired');
    if (!source) errors.source = t('form.errors.sourceRequired');
    if (!Number.isFinite(fields) || fields <= 0) errors.fields = t('form.errors.fieldsMin');
    if (!Number.isFinite(masked) || masked < 0) errors.masked = t('form.errors.maskedMin');
    if (Number.isFinite(fields) && Number.isFinite(masked) && masked > fields) errors.masked = t('form.errors.maskedMax');
    if (!rowCount) errors.rowCount = t('form.errors.rowCountRequired');

    setDatasetFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const upsertDataset = (mode: 'create' | 'edit') => {
    if (!validateDatasetForm()) {
      toast.error(t('form.errors.fixFirst'));
      return;
    }
    const fields = Number(datasetForm.fields);
    const masked = Number(datasetForm.masked);
    const nextTags = datasetForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const tags = nextTags.length ? nextTags : ['uncategorized'];

    if (mode === 'create') {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
      const next: Dataset = {
        id,
        name: datasetForm.name.trim(),
        alias: datasetForm.alias.trim(),
        source: datasetForm.source.trim(),
        domain: datasetForm.domain,
        tags,
        fields,
        masked,
        rowCount: datasetForm.rowCount.trim(),
        lastUpdate: new Date().toISOString().slice(0, 10),
        relatedAPIs: [],
        description: datasetForm.description.trim() || undefined,
      };
      dispatch(datasetsActions.datasetAdded(next));
      toast.success(t('toast.created'));
      setIsCreateOpen(false);
      resetDatasetForm();
      setSearchTerm('');
      setSelectedCategory('all');
      setSelectedTag('all');
      setPage(1);
      return;
    }

    if (!editTargetId) return;
    dispatch(
      datasetsActions.datasetUpdated({
        id: editTargetId,
        patch: {
          name: datasetForm.name.trim(),
          alias: datasetForm.alias.trim(),
          source: datasetForm.source.trim(),
          domain: datasetForm.domain,
          tags,
          fields,
          masked,
          rowCount: datasetForm.rowCount.trim(),
          lastUpdate: new Date().toISOString().slice(0, 10),
          description: datasetForm.description.trim() || undefined,
        },
      }),
    );
    toast.success(t('toast.updated'));
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
    const fromWarehouse = /仓库|warehouse/i.test(selectedDataset.source);
    const upstream = fromWarehouse ? ['ODS.user_orders', 'ODS.customer_profile'] : ['prod_mysql.user_orders'];
    const downstream = (selectedDataset.relatedAPIs ?? []).map((a) => `API.${a}`);
    return [
      { title: t('lineage.upstream'), items: upstream },
      { title: t('lineage.current'), items: [`dataset.${selectedDataset.name}`] },
      { title: t('lineage.downstream'), items: downstream.length ? downstream : [t('lineage.noDownstream')] },
    ];
  };

  const seedHistory = () => {
    if (!selectedDataset) return [];
    return [
      { at: '2025-12-28 09:15', by: t('seed.users.liSi'), action: t('history.actions.fieldDescriptionUpdated'), detail: t('history.details.addedSensitiveDescription') },
      { at: '2025-12-20 18:03', by: t('seed.users.zhangSan'), action: t('history.actions.maskRuleUpdated'), detail: t('history.details.addedPhoneEmailMasking') },
      { at: '2025-11-15 14:30', by: t('seed.users.zhangSan'), action: t('history.actions.datasetCreated'), detail: t('history.details.initializedMetadataAndTags') },
    ];
  };

  const allFields = useMemo(
    () =>
      selectedDataset
        ? buildDatasetFields(selectedDataset, fieldEditsByDatasetId[selectedDataset.id], t)
        : [],
    [fieldEditsByDatasetId, selectedDataset, t],
  );
  const normalizedFieldSearch = normalizeSearchText(fieldSearch);
  const filteredFields = useMemo(() => {
    const list = normalizedFieldSearch
      ? allFields.filter((f) => {
          const groupLabel = t(`fields.groups.${f.group}` as never);
          const hay = `${f.name} ${f.type} ${f.alias} ${f.description} ${groupLabel}`;
          return hay.toLowerCase().includes(normalizedFieldSearch);
        })
      : allFields;
    return onlyKeyFields && !normalizedFieldSearch ? list.filter((f) => f.group === 'key' || f.important) : list;
  }, [allFields, normalizedFieldSearch, onlyKeyFields, t]);

  const groupedFields = useMemo(() => {
    const by = filteredFields.reduce<Record<string, DatasetField[]>>((acc, f) => {
      const g: FieldGroupId = normalizedFieldSearch ? 'search' : f.group;
      acc[g] ??= [];
      acc[g].push(f);
      return acc;
    }, {});
    return Object.entries(by)
      .map(([group, list]) => ({ group: group as FieldGroupId, label: t(`fields.groups.${group}` as never), list }))
      .sort((a, b) => a.label.localeCompare(b.label, localeForSort))
      .map((g) => [g.group, g.list] as const);
  }, [filteredFields, normalizedFieldSearch, localeForSort, t]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const categories = useMemo(() => {
    const domainCounts = datasets.reduce<Record<string, number>>((acc, d) => {
      acc[d.domain] = (acc[d.domain] ?? 0) + 1;
      return acc;
    }, {});
    const domains = Object.keys(domainCounts).sort((a, b) => a.localeCompare(b, localeForSort));
    return [{ id: 'all', count: datasets.length }, ...domains.map((d) => ({ id: d, count: domainCounts[d] }))];
  }, [datasets, localeForSort]);

  const hotTags = useMemo(() => {
    const tagCounts = datasets.flatMap((d) => d.tags).reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], localeForSort))
      .map(([tag]) => tag)
      .slice(0, 12);
  }, [datasets, localeForSort]);

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
    setSelectedDatasetId(dataset.id);
    setViewMode('detail');
    setFieldSearch('');
    setOnlyKeyFields(true);
    setCollapsedFieldGroups({});
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedDatasetId(null);
  };

  const openAPIBuilderFromDataset = (d: Dataset) => {
    if (!canCreateAPI) {
      toast.error(t('permissions.noApiBuilder'));
      return;
    }
    const fields = buildDatasetFields(d, fieldEditsByDatasetId[d.id], t).map((f) => ({
      name: f.name,
      type: f.type,
      alias: f.alias,
      masked: f.masked,
      description: f.description,
      important: f.important === true || f.group === 'key',
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
            {t('actions.backToList')}
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
              <h2 className="mb-4">{t('labels.basicInfo')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('labels.source')}</div>
                  <div>{selectedDataset.source}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('labels.domain')}</div>
                  <Badge className="bg-blue-100 text-blue-700">
                    {t(`domains.${selectedDataset.domain}` as never, { defaultValue: selectedDataset.domain })}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('labels.fieldsCount')}</div>
                  <div>{numberFormatter.format(selectedDataset.fields)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('labels.maskedFields')}</div>
                  <div className="flex items-center gap-1">
                    {selectedDataset.masked > 0 && <Shield className="size-3 text-orange-500" />}
                    {numberFormatter.format(selectedDataset.masked)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('labels.rowCount')}</div>
                  <div>{selectedDataset.rowCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">{t('labels.lastUpdate')}</div>
                  <div>{selectedDataset.lastUpdate}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">{t('labels.tags')}</div>
                <div className="flex flex-wrap gap-2">
                  {selectedDataset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="size-3" />
                      {t(`tags.${tag}` as never, { defaultValue: tag })}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">{t('labels.description')}</div>
                <p className="text-sm">{selectedDataset.description}</p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2>{t('labels.fieldsList')}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canEditDatasets}
                  onClick={() => {
                    if (!canEditDatasets) {
                      toast.error(t('permissions.noManage'));
                      return;
                    }
                    setIsFieldEditOpen(true);
                  }}
                >
                  <Edit className="size-4 mr-1" />
                  {t('actions.editFields')}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <Checkbox checked={onlyKeyFields} onCheckedChange={(v) => setOnlyKeyFields(v === true)} />
                  <span className="text-sm">{t('fields.onlyKeyFields')}</span>
                </div>
                <div className="relative w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    className="pl-9"
                    placeholder={t('search.fieldsPlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {groupedFields.map(([groupId, list]) => {
                  const isCollapsed = collapsedFieldGroups[groupId] ?? (groupId !== 'key' && groupId !== 'search');
                  const header = (
                    <div className="grid grid-cols-12 text-xs text-muted-foreground bg-muted px-3 py-2 sticky top-0 z-10">
                      <div className="col-span-3">{t('fields.columns.name')}</div>
                      <div className="col-span-2">{t('fields.columns.type')}</div>
                      <div className="col-span-3">{t('fields.columns.alias')}</div>
                      <div className="col-span-1">{t('fields.columns.masked')}</div>
                      <div className="col-span-3">{t('fields.columns.description')}</div>
                    </div>
                  );
                  const renderRow = (f: DatasetField) => (
                    <div className={`grid grid-cols-12 items-center text-sm border-t px-3 ${f.group === 'key' ? 'bg-primary/5' : ''}`}>
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
                    <div key={groupId} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent transition-colors"
                        onClick={() => setCollapsedFieldGroups((s) => ({ ...s, [groupId]: !isCollapsed }))}
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                          <span className="text-sm">{t(`fields.groups.${groupId}` as never)}</span>
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
                {t('counts.total', { count: filteredFields.length })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="mb-3 flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                {t('labels.relatedApis', { count: selectedDataset.relatedAPIs?.length || 0 })}
              </h3>
              {selectedDataset.relatedAPIs && selectedDataset.relatedAPIs.length > 0 ? (
                <div className="space-y-2">
                  {selectedDataset.relatedAPIs.map((apiName) => (
                    <Card
                      key={apiName}
                      className="p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        navigator.clipboard?.writeText(apiName).catch(() => undefined);
                        toast.message(t('toast.copied', { value: apiName }));
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-sm">{apiName}</span>
                        <Badge variant="outline" className="text-xs">{t('labels.methodGet')}</Badge>
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
                    {t('actions.createNewApi')}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">{t('empty.noRelatedApis')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      openAPIBuilderFromDataset(selectedDataset);
                    }}
                  >
                    <Zap className="size-4" />
                    {t('actions.createApi')}
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="mb-3">{t('labels.actions')}</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  disabled={!canEditDatasets}
                  onClick={() => openEdit(selectedDataset)}
                >
                  <Edit className="size-4" />
                  {t('actions.editDataset')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsLineageOpen(true)}
                >
                  <Layers className="size-4" />
                  {t('actions.viewLineage')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <Calendar className="size-4" />
                  {t('actions.viewHistory')}
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3">{t('labels.metadata')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">{t('labels.createdBy')}</div>
                  <div className="flex items-center gap-2">
                    <User className="size-3" />
                    <span>{t('seed.users.zhangSan')}</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t('labels.createdAt')}</div>
                  <div>2025-10-15 14:30</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t('labels.updatedBy')}</div>
                  <div className="flex items-center gap-2">
                    <User className="size-3" />
                    <span>{t('seed.users.liSi')}</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">{t('labels.updatedAt')}</div>
                  <div>2025-12-28 09:15</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Dialog open={isFieldEditOpen} onOpenChange={setIsFieldEditOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t('dialogs.editFields')}</DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 text-xs text-muted-foreground bg-muted px-3 py-2">
                <div className="col-span-3">{t('fields.columns.name')}</div>
                <div className="col-span-2">{t('fields.columns.type')}</div>
                <div className="col-span-3">{t('fields.columns.alias')}</div>
                <div className="col-span-1">{t('fields.columns.masked')}</div>
                <div className="col-span-3">{t('fields.columns.description')}</div>
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
                {t('actions.close')}
              </Button>
              <Button
                onClick={() => {
                  toast.success(t('toast.fieldSaved'));
                  setIsFieldEditOpen(false);
                }}
              >
                {t('actions.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isLineageOpen} onOpenChange={setIsLineageOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('dialogs.lineage')}</DialogTitle>
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
                {t('actions.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('dialogs.history')}</DialogTitle>
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
                {t('actions.close')}
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
            <h3>{t('categories.title')}</h3>
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
                <span>
                  {category.id === 'all'
                    ? t('categories.all')
                    : t(`domains.${category.id}` as never, { defaultValue: category.id })}
                </span>
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
            {t('hotTags.title')}
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
                {t(`tags.${tag}` as never, { defaultValue: tag })}
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
                {t('actions.clear')}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button className="gap-2" onClick={openCreate} disabled={!canEditDatasets}>
            <Plus className="size-4" />
            {t('actions.createDataset')}
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('search.datasetsPlaceholder')}
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
                    {t(`domains.${dataset.domain}` as never, { defaultValue: dataset.domain })}
                  </Badge>
                  {dataset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="size-3" />
                      {t(`tags.${tag}` as never, { defaultValue: tag })}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1 text-[12px]">{t('labels.fieldsCount')}</div>
                    <div className="text-[14px] font-medium">{numberFormatter.format(dataset.fields)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-[12px]">{t('labels.maskedFields')}</div>
                    <div className="flex items-center gap-1 text-[14px] font-medium">
                      {dataset.masked > 0 && <Shield className="size-3 text-orange-500" />}
                      {numberFormatter.format(dataset.masked)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1 text-[12px]">{t('labels.rowCount')}</div>
                    <div className="text-[14px] font-medium">{dataset.rowCount}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                  <span>{t('labels.lastUpdateInline', { date: dataset.lastUpdate })}</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => showDetail(dataset)}
                  >
                    {t('actions.viewDetail')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('counts.total', { count: filteredDatasets.length })}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">{t('labels.perPage')}</div>
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
                    {t('pagination.perPageOption', { count: n })}
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
            <p className="text-muted-foreground">{t('empty.noMatch')}</p>
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
            <DialogTitle>{t('dialogs.create')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.name')}</div>
              <Input
                value={datasetForm.name}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, name: e.target.value }));
                  if (datasetFormErrors.name) setDatasetFormErrors((p) => ({ ...p, name: '' }));
                }}
                placeholder={t('form.placeholders.name')}
              />
              {datasetFormErrors.name ? <div className="text-xs text-red-600">{datasetFormErrors.name}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.alias')}</div>
              <Input
                value={datasetForm.alias}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, alias: e.target.value }));
                  if (datasetFormErrors.alias) setDatasetFormErrors((p) => ({ ...p, alias: '' }));
                }}
                placeholder={t('form.placeholders.alias')}
              />
              {datasetFormErrors.alias ? <div className="text-xs text-red-600">{datasetFormErrors.alias}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.source')}</div>
              <Input
                value={datasetForm.source}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, source: e.target.value }));
                  if (datasetFormErrors.source) setDatasetFormErrors((p) => ({ ...p, source: '' }));
                }}
                placeholder={t('form.placeholders.source')}
              />
              {datasetFormErrors.source ? <div className="text-xs text-red-600">{datasetFormErrors.source}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.domain')}</div>
              <Select value={datasetForm.domain} onValueChange={(v) => setDatasetForm((p) => ({ ...p, domain: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domainOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(`domains.${d}` as never, { defaultValue: d })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.fields')}</div>
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
              <div className="text-sm">{t('form.labels.masked')}</div>
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
              <div className="text-sm">{t('form.labels.rowCount')}</div>
              <Input
                value={datasetForm.rowCount}
                onChange={(e) => {
                  setDatasetForm((p) => ({ ...p, rowCount: e.target.value }));
                  if (datasetFormErrors.rowCount) setDatasetFormErrors((p) => ({ ...p, rowCount: '' }));
                }}
                placeholder={t('form.placeholders.rowCount')}
              />
              {datasetFormErrors.rowCount ? <div className="text-xs text-red-600">{datasetFormErrors.rowCount}</div> : null}
            </div>
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.tags')}</div>
              <Input
                value={datasetForm.tags}
                onChange={(e) => setDatasetForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder={t('form.placeholders.tags')}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-sm">{t('form.labels.description')}</div>
              <Input
                value={datasetForm.description}
                onChange={(e) => setDatasetForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t('form.placeholders.description')}
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
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => upsertDataset('create')}>{t('actions.create')}</Button>
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
            <DialogTitle>{t('dialogs.edit')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.name')}</div>
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
              <div className="text-sm">{t('form.labels.alias')}</div>
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
              <div className="text-sm">{t('form.labels.source')}</div>
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
              <div className="text-sm">{t('form.labels.domain')}</div>
              <Select value={datasetForm.domain} onValueChange={(v) => setDatasetForm((p) => ({ ...p, domain: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domainOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {t(`domains.${d}` as never, { defaultValue: d })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="text-sm">{t('form.labels.fields')}</div>
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
              <div className="text-sm">{t('form.labels.masked')}</div>
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
              <div className="text-sm">{t('form.labels.rowCount')}</div>
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
              <div className="text-sm">{t('form.labels.tags')}</div>
              <Input
                value={datasetForm.tags}
                onChange={(e) => setDatasetForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder={t('form.placeholders.tags')}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-sm">{t('form.labels.description')}</div>
              <Input
                value={datasetForm.description}
                onChange={(e) => setDatasetForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t('form.placeholders.description')}
              />
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
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => upsertDataset('edit')}>{t('actions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
