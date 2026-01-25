import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Search, BookOpen, TrendingUp, Clock, Activity, Copy, ExternalLink, FolderOpen, BarChart, ChevronRight, ChevronDown, Plus, Network } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { apiCatalogActions, fetchCatalogApis } from '@/features/api-catalog/store';
import type { ApiCatalogApi as API } from '@/features/api-catalog/types';
import { fetchTaxonomy } from '@/features/categories/store';
import { ApiImportDialog } from './ApiImportDialog';
import { LineageGraph } from '@/features/datasets/components/LineageGraph';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  count: number;
  children?: Category[];
}

export function APICatalog() {
  const dispatch = useAppDispatch();
  const apis = useAppSelector((s) => s.apiCatalog.items);
  const apisStatus = useAppSelector((s) => s.apiCatalog.status);
  const taxonomy = useAppSelector((s) => s.categories.taxonomy);
  const taxonomyStatus = useAppSelector((s) => s.categories.status);
  const { t } = useTranslation('apiCatalog');

  const [searchTerm, setSearchTerm] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [lineageApi, setLineageApi] = useState<API | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    if (apisStatus !== 'idle') return;
    dispatch(fetchCatalogApis());
  }, [apisStatus, dispatch]);

  useEffect(() => {
    if (taxonomyStatus !== 'idle') return;
    dispatch(fetchTaxonomy());
  }, [dispatch, taxonomyStatus]);

  const categoryNameById = useMemo(() => {
    return new Map((taxonomy?.categories ?? []).map((c) => [c.id, c.name] as const));
  }, [taxonomy]);

  const categoryIdsByApiId = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!taxonomy) return map;
    for (const l of taxonomy.links) {
      if (l.itemType !== 'api') continue;
      const arr = map.get(l.itemId) ?? [];
      arr.push(l.categoryId);
      map.set(l.itemId, arr);
    }
    return map;
  }, [taxonomy]);

  useEffect(() => {
    const onDocUpdated = (e: Event) => {
      const evt = e as CustomEvent<{ api?: API; apiId?: string; patch?: Partial<API> }>;
      const nextApi = evt.detail?.api;
      const apiId = nextApi?.id ?? evt.detail?.apiId;
      const patch = evt.detail?.patch;
      if (!apiId) return;

      if (nextApi) dispatch(apiCatalogActions.apiReplaced(nextApi));
      else if (patch) dispatch(apiCatalogActions.apiUpdated({ id: apiId, patch }));
    };
    window.addEventListener('eda:api-doc-updated', onDocUpdated as EventListener);
    return () => window.removeEventListener('eda:api-doc-updated', onDocUpdated as EventListener);
  }, [dispatch]);

  const categories = useMemo((): Category[] => {
    const allCount = apis.length;
    if (!taxonomy) return [{ id: 'all', name: t('categories.all'), count: allCount }];

    const byParent = taxonomy.categories.reduce<Map<string | null, Category[]>>((acc, c) => {
      const list = acc.get(c.parentId) ?? [];
      list.push({ id: c.id, name: c.name, count: 0, children: [] });
      acc.set(c.parentId, list);
      return acc;
    }, new Map());

    const sortSiblings = (list: Category[]) => {
      const orderById = new Map(taxonomy.categories.map((c) => [c.id, c.order] as const));
      list.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0) || a.name.localeCompare(b.name));
      list.forEach((n) => {
        n.children = byParent.get(n.id) ?? [];
        sortSiblings(n.children);
      });
    };

    const roots = byParent.get(null) ?? [];
    sortSiblings(roots);

    const itemsByCategory = taxonomy.links.reduce<Map<string, Set<string>>>((acc, l) => {
      if (l.itemType !== 'api') return acc;
      const set = acc.get(l.categoryId) ?? new Set<string>();
      set.add(l.itemId);
      acc.set(l.categoryId, set);
      return acc;
    }, new Map());

    const computeCounts = (node: Category): Set<string> => {
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
  }, [apis.length, taxonomy, t]);

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
    const newExpanded = new Set(effectiveExpandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (cats: Category[], level: number = 0) => {
    return cats.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
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
              if (hasChildren) {
                toggleCategory(cat.id);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedCategory(cat.id);
                setPage(1);
                if (hasChildren) {
                  toggleCategory(cat.id);
                }
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
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
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(cat.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const filteredAPIs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = (api: API) =>
      !q || api.name.toLowerCase().includes(q) || api.description.toLowerCase().includes(q);

    if (!taxonomy || selectedCategory === 'all') {
      return apis.filter(matchesSearch);
    }

    const childrenByParent = taxonomy.categories.reduce<Map<string | null, string[]>>((acc, c) => {
      const list = acc.get(c.parentId) ?? [];
      list.push(c.id);
      acc.set(c.parentId, list);
      return acc;
    }, new Map());

    const descendants = (rootId: string) => {
      const out = new Set<string>([rootId]);
      const stack = [rootId];
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
    };

    const acceptedCategoryIds = descendants(selectedCategory);
    const categoriesByApiId = taxonomy.links.reduce<Map<string, Set<string>>>((acc, l) => {
      if (l.itemType !== 'api') return acc;
      const set = acc.get(l.itemId) ?? new Set<string>();
      set.add(l.categoryId);
      acc.set(l.itemId, set);
      return acc;
    }, new Map());

    return apis.filter((api) => {
      if (!matchesSearch(api)) return false;
      const set = categoriesByApiId.get(api.id);
      if (!set) return false;
      for (const cid of set) {
        if (acceptedCategoryIds.has(cid)) return true;
      }
      return false;
    });
  }, [apis, searchTerm, selectedCategory, taxonomy]);

  const totalPages = Math.max(1, Math.ceil(filteredAPIs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedAPIs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAPIs.slice(start, start + pageSize);
  }, [currentPage, filteredAPIs, pageSize]);

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

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500';
      case 'POST':
        return 'bg-green-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('toast.copied'));
  };

  const onNavigateToDetail = (e: React.MouseEvent, apiId: string, version: string) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('eda:navigate', { 
      detail: { view: 'api-details', params: { id: apiId, version } } 
    }));
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Category Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col">
        <Card className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <FolderOpen className="size-5 text-primary" />
            <h3>{t('page.sidebar.categories')}</h3>
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {renderCategoryTree(categories)}
          </div>
        </Card>

        <Card className="p-4 mt-4 flex-shrink-0">
          <h3 className="mb-3 flex items-center gap-2">
            <BarChart className="size-4" />
            {t('page.sidebar.stats')}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('page.stats.activeApis')}</span>
              <span className="font-semibold">{apis.filter(a => a.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('page.stats.callsToday')}</span>
              <span className="font-semibold">
                {apis.reduce((sum, api) => sum + api.callsToday, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('page.stats.avgLatency')}</span>
              <span className="font-semibold">
                {Math.round(apis.reduce((sum, api) => sum + api.avgLatency, 0) / apis.length)}ms
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">{t('page.title')}</h1>
            <p className="text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            {t('import.trigger')}
          </Button>
          <Button variant="outline">
            <ExternalLink className="size-4 mr-2" />
            {t('page.actions.exportDocs')}
          </Button>
        </div>
      </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('page.search.placeholder')}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </Card>

        {/* API List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-[calc(100vh-360px)]">
          {pagedAPIs.map((api) => (
            <Card
              key={api.id}
              className="p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Badge className={`${getMethodColor(api.method)} text-white`}>{api.method}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="truncate max-w-[260px] sm:max-w-[340px] md:max-w-[460px]">
                            {api.name}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{api.name}</TooltipContent>
                      </Tooltip>
                      <Badge variant="outline">v{api.version}</Badge>
                      <Badge className="bg-blue-100 text-blue-700">{api.domain}</Badge>
                      {(categoryIdsByApiId.get(api.id) ?? []).slice(0, 3).map((id) => (
                        <Badge key={id} variant="secondary">
                          {categoryNameById.get(id) ?? id}
                        </Badge>
                      ))}
                      {(categoryIdsByApiId.get(api.id) ?? []).length > 3 && (
                        <Badge variant="secondary">+{(categoryIdsByApiId.get(api.id) ?? []).length - 3}</Badge>
                      )}
                      {api.status === 'deprecated' && (
                        <Badge variant="destructive">{t('page.list.deprecated')}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="text-sm bg-muted px-2 py-1 rounded inline-block truncate max-w-[320px] sm:max-w-[420px] md:max-w-[560px]">
                            {api.path}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={6}>{api.path}</TooltipContent>
                      </Tooltip>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(api.path)}
                        title={t('actions.copyPath', { defaultValue: 'Copy Path' })}
                      >
                        <Copy className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLineageApi(api)}
                        title={t('actions.lineage', { defaultValue: 'Lineage' })}
                      >
                        <Network className="size-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{api.description}</p>
                  </div>
                </div>
                <a 
                  href={`/api/details/${api.id}/${api.version}`} 
                  onClick={(e) => onNavigateToDetail(e, api.id, api.version)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shrink-0 self-end md:self-start"
                >
                  <BookOpen className="size-4 mr-2" />
                  {t('page.list.viewDocs')}
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-muted-foreground">{t('page.metrics.qps')}</div>
                    <div>{api.qps}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-muted-foreground">{t('page.metrics.avgLatency')}</div>
                    <div>{api.avgLatency}ms</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-muted-foreground">{t('page.metrics.callsToday')}</div>
                    <div>{api.callsToday.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">{t('page.metrics.createdAt')}</div>
                  <div>{api.createdAt}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('pagination.total', { count: filteredAPIs.length })}
          </div>
          <div className="text-sm text-muted-foreground">{t('pagination.perPageCount', { count: pageSize })}</div>
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

        {filteredAPIs.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">{t('page.empty.noResults')}</p>
          </Card>
        )}
      </div>

      {/* Import Dialog */}
      <ApiImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />

      {/* Lineage Dialog */}
      <Dialog open={!!lineageApi} onOpenChange={(open) => !open && setLineageApi(null)}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-6">
          {lineageApi && (
            <div className="flex-1 w-full h-full min-h-0">
              <LineageGraph data={lineageApi} type="api" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
