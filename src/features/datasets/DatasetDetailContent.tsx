import { useMemo, useRef, useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Search, Tag, Shield, Edit, ArrowLeft, Table, ChevronRight, ChevronDown, Zap, Layers, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Dataset } from '@/features/datasets/types';
import { buildDatasetFields, normalizeSearchText, type DatasetField, type FieldGroupId } from './utils';
import { LineageGraph } from './components/LineageGraph';
import { ChangeHistory } from './components/ChangeHistory';

// VirtualizedRows component extracted from Datasets.tsx
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

interface DatasetDetailContentProps {
  dataset: Dataset;
  onBack: () => void;
  canEdit?: boolean;
  canCreateAPI?: boolean;
  onEdit?: () => void;
}

export function DatasetDetailContent({ dataset, onBack, canEdit = true, canCreateAPI = true, onEdit }: DatasetDetailContentProps) {
  const { t, i18n } = useTranslation('datasets');
  const localeForSort = i18n.language.startsWith('en') ? 'en' : 'zh-Hans-CN';
  const numberFormatter = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);

  const [fieldSearch, setFieldSearch] = useState('');
  const [onlyKeyFields, setOnlyKeyFields] = useState(true);
  const [collapsedFieldGroups, setCollapsedFieldGroups] = useState<Record<string, boolean>>({});
  const [isFieldEditOpen, setIsFieldEditOpen] = useState(false);
  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Local state for field edits within this view
  const [fieldEdits, setFieldEdits] = useState<Record<string, Partial<Pick<DatasetField, 'alias' | 'description' | 'masked'>>>>({});

  const setFieldEdit = (fieldName: string, patch: Partial<Pick<DatasetField, 'alias' | 'description' | 'masked'>>) => {
    setFieldEdits((prev) => ({
      ...prev,
      [fieldName]: {
        ...(prev[fieldName] ?? {}),
        ...patch,
      },
    }));
  };

  const allFields = useMemo(
    () => buildDatasetFields(dataset, fieldEdits, t),
    [dataset, fieldEdits, t],
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

  const openAPIBuilderFromDataset = (d: Dataset) => {
    if (!canCreateAPI) {
      toast.error(t('permissions.noApiBuilder'));
      return;
    }
    const fields = buildDatasetFields(d, fieldEdits, t).map((f) => ({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="size-4" />
          {t('actions.backToList')}
        </Button>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-3">
          <div className="size-10 bg-blue-100 rounded flex items-center justify-center">
            <Table className="size-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl">{dataset.alias}</h1>
            <p className="text-sm text-muted-foreground font-mono">{dataset.name}</p>
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
                <div>{dataset.source}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('labels.project')}</div>
                <div>{dataset.project ?? '-'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('labels.domain')}</div>
                <Badge className="bg-blue-100 text-blue-700">
                  {t(`domains.${dataset.domain}` as never, { defaultValue: dataset.domain })}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('labels.fieldsCount')}</div>
                <div>{numberFormatter.format(dataset.fields)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('labels.maskedFields')}</div>
                <div className="flex items-center gap-1">
                  {dataset.masked > 0 && <Shield className="size-3 text-orange-500" />}
                  {numberFormatter.format(dataset.masked)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('labels.rowCount')}</div>
                <div>{dataset.rowCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('labels.lastUpdate')}</div>
                <div>{dataset.lastUpdate}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">{t('labels.tags')}</div>
              <div className="flex flex-wrap gap-2">
                {dataset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="size-3" />
                    {t(`tags.${tag}` as never, { defaultValue: dataset.tag ?? tag })}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">{t('labels.description')}</div>
              <p className="text-sm">{dataset.description}</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2>{t('labels.fieldsList')}</h2>
              <Button
                variant="outline"
                size="sm"
                disabled={!canEdit}
                onClick={() => {
                  if (!canEdit) {
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
              {t('labels.relatedApis', { count: dataset.relatedAPIs?.length || 0 })}
            </h3>
            {dataset.relatedAPIs && dataset.relatedAPIs.length > 0 ? (
              <div className="space-y-2">
                {dataset.relatedAPIs.map((apiName) => (
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
                    openAPIBuilderFromDataset(dataset);
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
                    openAPIBuilderFromDataset(dataset);
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
                disabled={!canEdit}
                onClick={onEdit}
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
                      onChange={(e) => setFieldEdit(f.name, { alias: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 py-2 flex items-center justify-center">
                    <Checkbox
                      checked={f.masked}
                      onCheckedChange={(v) => setFieldEdit(f.name, { masked: v === true })}
                    />
                  </div>
                  <div className="col-span-3 py-2">
                    <Input
                      value={f.description}
                      onChange={(e) => setFieldEdit(f.name, { description: e.target.value })}
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('dialogs.lineage')}</DialogTitle>
          </DialogHeader>
          <LineageGraph dataset={dataset} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLineageOpen(false)}>
              {t('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[90vw] w-[90vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('dialogs.history')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            <ChangeHistory />
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
