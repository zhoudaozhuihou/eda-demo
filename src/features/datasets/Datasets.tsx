import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Plus, Search, Tag, FolderOpen, ChevronRight, ChevronDown, Table, Edit, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { datasetsActions, fetchDatasets } from '@/features/datasets/store';
import type { Dataset } from '@/features/datasets/types';
import { useTranslation } from 'react-i18next';
import { fetchTaxonomy } from '@/features/categories/store';

import { approvalActions } from '@/features/approval/store';
import { logAdded } from '@/features/audit-logs/store';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { DatasetFormDialog } from './components/DatasetFormDialog';
import { DatasetDetailContent } from './DatasetDetailContent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';


function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function Datasets() {
  const { t, i18n } = useTranslation('datasets');
  const dispatch = useAppDispatch();
  const datasets = useAppSelector((s) => s.datasets.items);
  const datasetsStatus = useAppSelector((s) => s.datasets.status);
  const taxonomy = useAppSelector((s) => s.categories.taxonomy);
  const taxonomyStatus = useAppSelector((s) => s.categories.status);
  const localeForSort = i18n.language.startsWith('en') ? 'en' : 'zh-Hans-CN';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Create/Edit/Apply state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [detailDatasetId, setDetailDatasetId] = useState<string | null>(null);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    project: '',
    reason: '',
    validity: 'days_30',
  });

  const handleApplySubmit = () => {
    if (!applyForm.project || !applyForm.reason) {
      toast.error(t('toasts.fillRequired', { defaultValue: 'Please fill in all required fields' }));
      return;
    }

    const selectedTables = datasets.filter((d) => selectedDatasets.has(d.id)).map((d) => d.name);

    dispatch(
      approvalActions.approvalAdded({
        id: crypto.randomUUID(),
        apiName: t('apply.title'),
        apiPath: `${t('apply.project')}: ${applyForm.project}`,
        type: 'access_package',
        requester: t('seed.users.zhangSan', { defaultValue: 'Zhang San' }),
        requesterAvatar: 'zhangSan',
        team: 'Data Team',
        reason: applyForm.reason,
        details: `${t('apply.selectedTables')}: ${selectedTables.join(', ')}`,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        packageInfo: {
          project: applyForm.project,
          validity: applyForm.validity,
          tables: selectedTables,
        },
      }),
    );

    dispatch(
      logAdded({
        id: crypto.randomUUID(),
        action: 'APPLY_ACCESS_PACKAGE',
        target: applyForm.project,
        operator: 'Zhang San', // Should be current user
        timestamp: new Date().toISOString(),
        details: `Tables: ${selectedTables.join(', ')}`,
        status: 'success',
      }),
    );

    toast.success(t('toasts.applied', { defaultValue: 'Application submitted successfully' }));
    setIsApplyDialogOpen(false);
    setSelectedDatasets(new Set());
    setApplyForm({ project: '', reason: '', validity: 'days_30' });
  };


  const canEditDatasets = true;

  useEffect(() => {
    if (datasetsStatus !== 'idle') return;
    dispatch(fetchDatasets());
  }, [datasetsStatus, dispatch]);

  useEffect(() => {
    if (taxonomyStatus !== 'idle') return;
    dispatch(fetchTaxonomy());
  }, [dispatch, taxonomyStatus]);

  const toggleDatasetSelection = (id: string) => {
    const next = new Set(selectedDatasets);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDatasets(next);
  };

  const toggleAllDatasets = (checked: boolean) => {
    if (checked) {
      setSelectedDatasets(new Set(pagedDatasets.map((d) => d.id)));
    } else {
      setSelectedDatasets(new Set());
    }
  };

  const openCreate = () => {
    if (!canEditDatasets) {
      toast.error(t('permissions.noManage'));
      return;
    }
    setIsCreateOpen(true);
  };

  const openEdit = (d: Dataset) => {
    if (!canEditDatasets) {
      toast.error(t('permissions.noManage'));
      return;
    }
    setEditTargetId(d.id);
    setIsEditOpen(true);
  };

  const handleSaveDataset = (next: Partial<Dataset>) => {
    if (isCreateOpen) {
      const id = generateId();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const newDataset: Dataset = {
        id,
        name: next.name || '',
        alias: next.alias || '',
        source: next.source || '',
        domain: next.domain || 'logistics',
        tags: next.tags || ['uncategorized'],
        fields: Number(next.fields) || 0,
        masked: Number(next.masked) || 0,
        rowCount: String(next.rowCount || '0'),
        lastUpdate: new Date().toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now,
        relatedAPIs: [],
        description: next.description || undefined,
      };
      dispatch(datasetsActions.datasetAdded(newDataset));
      toast.success(t('toast.created'));
      setIsCreateOpen(false);
      setSearchTerm('');
      setSelectedCategory('all');
      setSelectedTag('all');
      setPage(1);
    } else if (isEditOpen && editTargetId) {
      dispatch(
        datasetsActions.datasetUpdated({
          id: editTargetId,
          patch: {
            ...next,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            lastUpdate: new Date().toISOString().slice(0, 10),
          },
        }),
      );
      toast.success(t('toast.updated'));
      setIsEditOpen(false);
      setEditTargetId(null);
    }
  };

  const showDetail = (dataset: Dataset) => {
    setDetailDatasetId(dataset.id);
  };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  type CategoryNode = { id: string; name: string; count: number; children?: CategoryNode[] };

  const categoryNameById = useMemo(() => {
    return new Map((taxonomy?.categories ?? []).map((c) => [c.id, c.name] as const));
  }, [taxonomy]);

  const categoryIdsByDatasetId = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!taxonomy) return map;
    for (const l of taxonomy.links) {
      if (l.itemType !== 'dataset') continue;
      const arr = map.get(l.itemId) ?? [];
      arr.push(l.categoryId);
      map.set(l.itemId, arr);
    }
    return map;
  }, [taxonomy]);

  const categories = useMemo((): CategoryNode[] => {
    const allCount = datasets.length;
    if (!taxonomy) return [{ id: 'all', name: t('categories.all'), count: allCount }];

    const nodeById = new Map<string, CategoryNode>(
      taxonomy.categories.map((c) => [c.id, { id: c.id, name: c.name, count: 0, children: [] }] as const),
    );
    const roots: CategoryNode[] = [];
    for (const c of taxonomy.categories) {
      const node = nodeById.get(c.id)!;
      if (!c.parentId) {
        roots.push(node);
        continue;
      }
      const parent = nodeById.get(c.parentId);
      if (parent) parent.children!.push(node);
    }

    const orderById = new Map(taxonomy.categories.map((c) => [c.id, c.order] as const));
    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0) || a.name.localeCompare(b.name, localeForSort));
      nodes.forEach((n) => {
        if (n.children) sortTree(n.children);
      });
    };
    sortTree(roots);

    const itemsByCategory = taxonomy.links.reduce<Map<string, Set<string>>>((acc, l) => {
      if (l.itemType !== 'dataset') return acc;
      const set = acc.get(l.categoryId) ?? new Set<string>();
      set.add(l.itemId);
      acc.set(l.categoryId, set);
      return acc;
    }, new Map());

    const computeCounts = (node: CategoryNode): Set<string> => {
      const direct = itemsByCategory.get(node.id) ?? new Set<string>();
      const merged = new Set<string>(direct);
      for (const child of node.children ?? []) {
        const childSet = computeCounts(child);
        childSet.forEach((v) => merged.add(v));
      }
      node.count = merged.size;
      return merged;
    };
    roots.forEach((n) => computeCounts(n));

    return [{ id: 'all', name: t('categories.all'), count: allCount }, ...roots];
  }, [datasets.length, localeForSort, t, taxonomy]);

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
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = (d: Dataset) =>
      !q || d.name.toLowerCase().includes(q) || d.alias.toLowerCase().includes(q);
    const matchesTag = (d: Dataset) => selectedTag === 'all' || d.tags.includes(selectedTag);

    if (!taxonomy || selectedCategory === 'all') {
      return datasets.filter((d) => matchesSearch(d) && matchesTag(d));
    }

    const childrenByParent = taxonomy.categories.reduce<Map<string | null, string[]>>((acc, c) => {
      const list = acc.get(c.parentId) ?? [];
      list.push(c.id);
      acc.set(c.parentId, list);
      return acc;
    }, new Map());

    const acceptedCategoryIds = (() => {
      const out = new Set<string>([selectedCategory]);
      const stack = [selectedCategory];
      while (stack.length) {
        const id = stack.pop()!;
        const kids = childrenByParent.get(id) ?? [];
        for (const k of kids) {
          if (out.has(k)) continue;
          out.add(k);
          stack.push(k);
        }
      }
      return out;
    })();

    const categoriesByDatasetId = taxonomy.links.reduce<Map<string, Set<string>>>((acc, l) => {
      if (l.itemType !== 'dataset') return acc;
      const set = acc.get(l.itemId) ?? new Set<string>();
      set.add(l.categoryId);
      acc.set(l.itemId, set);
      return acc;
    }, new Map());

    return datasets.filter((d) => {
      if (!matchesSearch(d) || !matchesTag(d)) return false;
      const set = categoriesByDatasetId.get(d.id);
      if (!set) return false;
      for (const cid of set) {
        if (acceptedCategoryIds.has(cid)) return true;
      }
      return false;
    });
  }, [datasets, searchTerm, selectedCategory, selectedTag, taxonomy]);

  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedDatasets = filteredDatasets.slice(start, start + pageSize);

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

  const defaultExpandedCategoryIds = useMemo(() => {
    return categories
      .filter((c) => c.id !== 'all')
      .slice(0, 2)
      .map((c) => c.id);
  }, [categories]);

  const effectiveExpandedCategories = useMemo(() => {
    if (expandedCategories.size > 0) return expandedCategories;
    return new Set(defaultExpandedCategoryIds);
  }, [defaultExpandedCategoryIds, expandedCategories]);

  const toggleCategory = (categoryId: string) => {
    const next = new Set(effectiveExpandedCategories);
    if (next.has(categoryId)) next.delete(categoryId);
    else next.add(categoryId);
    setExpandedCategories(next);
  };

  const renderCategoryTree = (cats: CategoryNode[], level: number = 0) => {
    return cats.map((cat) => {
      const hasChildren = (cat.children?.length ?? 0) > 0;
      const isExpanded = effectiveExpandedCategories.has(cat.id);
      const isSelected = selectedCategory === cat.id;
      return (
        <div key={cat.id}>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-current={isSelected ? 'page' : undefined}
            onClick={() => {
              setSelectedCategory(cat.id);
              setPage(1);
              if (hasChildren) toggleCategory(cat.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedCategory(cat.id);
                setPage(1);
                if (hasChildren) toggleCategory(cat.id);
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
              isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(cat.id);
                  }}
                  className="flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              )}
              {!hasChildren && <span className="w-4" />}
              <span className="truncate">{cat.name}</span>
            </div>
            <Badge variant={isSelected ? 'secondary' : 'outline'} className="flex-shrink-0 ml-2">
              {cat.count}
            </Badge>
          </div>
          {hasChildren && isExpanded && <div className="mt-1">{renderCategoryTree(cat.children!, level + 1)}</div>}
        </div>
      );
    });
  };

  const detailDataset = detailDatasetId ? datasets.find((d) => d.id === detailDatasetId) ?? null : null;

  if (detailDatasetId && detailDataset) {
    return (
      <div className="p-6 h-full overflow-auto bg-background">
        <DatasetDetailContent
          dataset={detailDataset}
          onBack={() => setDetailDatasetId(null)}
          canEdit={canEditDatasets}
          canCreateAPI={true}
          onEdit={() => openEdit(detailDataset)}
        />

        <DatasetFormDialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditTargetId(null);
          }}
          initialData={datasets.find((d) => d.id === editTargetId) ?? detailDataset}
          onSave={handleSaveDataset}
        />
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
          <div className="space-y-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 340px)' }}>
            {renderCategoryTree(categories)}
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="gap-2"
              disabled={selectedDatasets.size === 0}
              onClick={() => setIsApplyDialogOpen(true)}
            >
              <Shield className="size-4" />
              {t('actions.applyAccess', { defaultValue: 'Apply Access' })}
            </Button>
            <Button className="gap-2" onClick={openCreate} disabled={!canEditDatasets}>
              <Plus className="size-4" />
              {t('actions.createDataset')}
            </Button>
          </div>
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

        <div className="overflow-y-auto pr-2 max-h-[calc(100vh-340px)]">
          <Card className="p-0 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 text-xs text-muted-foreground bg-muted px-4 py-3">
              <div className="col-span-5 flex items-center gap-3">
                <Checkbox
                  checked={pagedDatasets.length > 0 && pagedDatasets.every((d) => selectedDatasets.has(d.id))}
                  onCheckedChange={(v) => toggleAllDatasets(!!v)}
                />
                {t('labels.datasetAlias')}
              </div>
              <div className="col-span-2">{t('labels.project')}</div>
              <div className="col-span-2">{t('labels.createdAt')}</div>
              <div className="col-span-2">{t('labels.updatedAt')}</div>
              <div className="col-span-1 text-right">{t('labels.actions')}</div>
            </div>
            <div className="divide-y">
              {pagedDatasets.map((dataset) => (
                <div key={dataset.id} className="px-4 py-3 hover:bg-accent/40 transition-colors">
                  <div className="md:hidden flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Table className="size-4 text-blue-600 flex-shrink-0" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="font-medium truncate max-w-[240px]">{dataset.alias}</div>
                          </TooltipTrigger>
                          <TooltipContent sideOffset={6}>{dataset.alias}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono truncate max-w-[280px]">{dataset.name}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{dataset.source}</Badge>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {t(`domains.${dataset.domain}` as never, { defaultValue: dataset.domain })}
                        </Badge>
                        {(categoryIdsByDatasetId.get(dataset.id) ?? []).slice(0, 2).map((id) => (
                          <Badge key={id} variant="secondary">
                            {categoryNameById.get(id) ?? id}
                          </Badge>
                        ))}
                        {(categoryIdsByDatasetId.get(dataset.id) ?? []).length > 2 && (
                          <Badge variant="secondary">+{(categoryIdsByDatasetId.get(dataset.id) ?? []).length - 2}</Badge>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {t('labels.createdAt')}: {dataset.createdAt} · {t('labels.updatedAt')}: {dataset.updatedAt}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('actions.editDataset')}
                        onClick={() => openEdit(dataset)}
                        disabled={!canEditDatasets}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => showDetail(dataset)}>
                        {t('actions.viewDetail')}
                      </Button>
                    </div>
                  </div>

                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5 min-w-0 flex items-start gap-3">
                      <Checkbox
                        checked={selectedDatasets.has(dataset.id)}
                        onCheckedChange={() => toggleDatasetSelection(dataset.id)}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Table className="size-4 text-blue-600 flex-shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-medium truncate max-w-[520px]">{dataset.alias}</div>
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6}>{dataset.alias}</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="text-sm text-muted-foreground font-mono truncate max-w-[560px]">{dataset.name}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{dataset.source}</Badge>
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {t(`domains.${dataset.domain}` as never, { defaultValue: dataset.domain })}
                          </Badge>
                          {(categoryIdsByDatasetId.get(dataset.id) ?? []).slice(0, 3).map((id) => (
                            <Badge key={id} variant="secondary">
                              {categoryNameById.get(id) ?? id}
                            </Badge>
                          ))}
                          {(categoryIdsByDatasetId.get(dataset.id) ?? []).length > 3 && (
                            <Badge variant="secondary">+{(categoryIdsByDatasetId.get(dataset.id) ?? []).length - 3}</Badge>
                          )}
                          <Badge variant="secondary">
                            {t('labels.fieldsCount')}: {numberFormatter.format(dataset.fields)}
                          </Badge>
                          <Badge variant="secondary">
                            {t('labels.rowCount')}: {dataset.rowCount}
                          </Badge>
                          {dataset.masked > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="size-3 text-orange-500" />
                              {t('labels.maskedFields')}: {numberFormatter.format(dataset.masked)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm truncate" title={dataset.project ?? '-'}>
                      {dataset.project ?? '-'}
                    </div>
                    <div className="col-span-2 text-sm">{dataset.createdAt}</div>
                    <div className="col-span-2 text-sm">{dataset.updatedAt}</div>
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('actions.editDataset')}
                        onClick={() => openEdit(dataset)}
                        disabled={!canEditDatasets}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => showDetail(dataset)}>
                        {t('actions.viewDetail')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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

      <DatasetFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        initialData={null}
        onSave={handleSaveDataset}
      />

      <DatasetFormDialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) setEditTargetId(null);
        }}
        initialData={datasets.find((d) => d.id === editTargetId)}
        onSave={handleSaveDataset}
      />

      <Dialog
        open={isApplyDialogOpen}
        onOpenChange={(open) => {
          setIsApplyDialogOpen(open);
          if (!open) setApplyForm({ project: '', reason: '', validity: 'days_30' });
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('apply.title', { defaultValue: 'Apply Data Access (Auto Package)' })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('apply.project', { defaultValue: 'Target Project' })}</Label>
              <Select
                value={applyForm.project}
                onValueChange={(v) => setApplyForm((p) => ({ ...p, project: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('apply.project', { defaultValue: 'Target Project' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail_Data_Warehouse">Retail_Data_Warehouse</SelectItem>
                  <SelectItem value="Marketing_Analytics">Marketing_Analytics</SelectItem>
                  <SelectItem value="Supply_Chain_Optimization">Supply_Chain_Optimization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('apply.reason', { defaultValue: 'Reason' })}</Label>
              <Textarea
                value={applyForm.reason}
                onChange={(e) => setApplyForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder={t('apply.reason', { defaultValue: 'Reason' })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('apply.validity', { defaultValue: 'Validity' })}</Label>
              <Select
                value={applyForm.validity}
                onValueChange={(v) => setApplyForm((p) => ({ ...p, validity: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days_30">{t('apply.days_30', { defaultValue: '30 Days' })}</SelectItem>
                  <SelectItem value="days_90">{t('apply.days_90', { defaultValue: '90 Days' })}</SelectItem>
                  <SelectItem value="days_180">{t('apply.days_180', { defaultValue: '180 Days' })}</SelectItem>
                  <SelectItem value="permanent">{t('apply.permanent', { defaultValue: 'Permanent' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('apply.selectedTables', { defaultValue: 'Selected Tables' })}</Label>
              <div className="border rounded-md p-2 bg-muted/50 max-h-32 overflow-y-auto text-sm">
                {datasets
                  .filter((d) => selectedDatasets.has(d.id))
                  .map((d) => (
                    <div key={d.id} className="py-1">
                      {d.alias} <span className="text-muted-foreground">({d.name})</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApplyDialogOpen(false);
                setApplyForm({ project: '', reason: '', validity: 'days_30' });
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleApplySubmit}>{t('apply.submit', { defaultValue: 'Submit Application' })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
