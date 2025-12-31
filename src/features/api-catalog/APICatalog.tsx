import { useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/app/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { Search, BookOpen, Play, TrendingUp, Clock, Activity, Copy, ExternalLink, FolderOpen, BarChart, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { apiCatalogActions, fetchCatalogApis } from '@/features/api-catalog/store';
import type { ApiCatalogApi as API } from '@/features/api-catalog/types';

interface Category {
  id: string;
  name: string;
  count: number;
  children?: Category[];
  parent?: string;
}

type ApiDocParam = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  location: 'path' | 'query' | 'header' | 'body' | 'response';
  group: string;
  important?: boolean;
  defaultValue?: string;
  example?: string;
};

type ApiStatusCode = {
  httpStatus: number;
  title: string;
  standardDescription: string;
  scenario: string;
  responseExample: string;
};

function normalizeSearchText(v: string) {
  return v.trim().toLowerCase();
}

function includesSearch(haystack: string, needle: string) {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle);
}

function buildApiDocParams(api: API, t: TFunction): { request: ApiDocParam[]; response: ApiDocParam[] } {
  const requestBase: ApiDocParam[] = [
    {
      name: 'x-request-id',
      type: 'string',
      required: false,
      description: t('doc.params.descriptions.traceId'),
      location: 'header',
      group: 'Header',
      important: true,
      example: 'req_01J9...',
    },
  ];

  const responseBase: ApiDocParam[] = [
    {
      name: 'code',
      type: 'number',
      required: true,
      description: t('doc.params.descriptions.bizCode'),
      location: 'response',
      group: 'Envelope',
      important: true,
      example: '200',
    },
    {
      name: 'message',
      type: 'string',
      required: true,
      description: t('doc.params.descriptions.bizMessage'),
      location: 'response',
      group: 'Envelope',
      important: true,
      example: 'success',
    },
    {
      name: 'data',
      type: 'object',
      required: true,
      description: t('doc.params.descriptions.bizData'),
      location: 'response',
      group: 'Envelope',
      important: true,
    },
  ];

  if (api.name === 'getUserOrders') {
    return {
      request: [
        ...requestBase,
        {
          name: 'user_id',
          type: 'bigint',
          required: true,
          description: t('doc.params.descriptions.userId'),
          location: 'query',
          group: 'Query',
          important: true,
        },
        {
          name: 'page',
          type: 'int',
          required: false,
          description: t('doc.params.descriptions.page', { default: 1 }),
          location: 'query',
          group: 'Query',
          defaultValue: '1',
        },
        {
          name: 'page_size',
          type: 'int',
          required: false,
          description: t('doc.params.descriptions.pageSize', { default: 20 }),
          location: 'query',
          group: 'Query',
          defaultValue: '20',
        },
      ],
      response: [
        ...responseBase,
        {
          name: 'data.total',
          type: 'number',
          required: true,
          description: t('doc.params.descriptions.total'),
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.page',
          type: 'number',
          required: true,
          description: t('doc.params.descriptions.pageNo'),
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.page_size',
          type: 'number',
          required: true,
          description: t('doc.params.descriptions.pageSizeOnly'),
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.items[]',
          type: 'array',
          required: true,
          description: t('doc.params.descriptions.orderList'),
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.items[].order_id',
          type: 'string',
          required: true,
          description: t('doc.params.descriptions.orderId'),
          location: 'response',
          group: 'Item',
          important: true,
        },
        {
          name: 'data.items[].total_amount',
          type: 'number',
          required: true,
          description: t('doc.params.descriptions.orderAmount'),
          location: 'response',
          group: 'Item',
          important: true,
        },
        {
          name: 'data.items[].status',
          type: 'string',
          required: true,
          description: t('doc.params.descriptions.orderStatus'),
          location: 'response',
          group: 'Item',
          important: true,
        },
      ],
    };
  }

  if (api.name === 'getOrderDetail') {
    return {
      request: [
        ...requestBase,
        {
          name: 'id',
          type: 'string',
          required: true,
          description: t('doc.params.descriptions.orderIdPath'),
          location: 'path',
          group: 'Path',
          important: true,
          example: 'ORD20251228001',
        },
      ],
      response: [
        ...responseBase,
        {
          name: 'data.order_id',
          type: 'string',
          required: true,
          description: t('doc.params.descriptions.orderId'),
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.user_id',
          type: 'bigint',
          required: true,
          description: t('doc.params.descriptions.userId'),
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.items[]',
          type: 'array',
          required: false,
          description: t('doc.params.descriptions.orderItems'),
          location: 'response',
          group: 'Data',
        },
      ],
    };
  }

  if (api.name === 'createOrder') {
    return {
      request: [
        ...requestBase,
        {
          name: 'user_id',
          type: 'bigint',
          required: true,
          description: t('doc.params.descriptions.userId'),
          location: 'body',
          group: 'Body',
          important: true,
        },
        {
          name: 'items',
          type: 'array',
          required: true,
          description: t('doc.params.descriptions.productItems'),
          location: 'body',
          group: 'Body',
          important: true,
        },
        {
          name: 'items[].sku_id',
          type: 'string',
          required: true,
          description: t('doc.params.descriptions.skuId'),
          location: 'body',
          group: 'Body',
        },
        {
          name: 'items[].qty',
          type: 'int',
          required: true,
          description: t('doc.params.descriptions.quantity'),
          location: 'body',
          group: 'Body',
          defaultValue: '1',
        },
      ],
      response: [
        ...responseBase,
        {
          name: 'data.order_id',
          type: 'string',
          required: true,
          description: t('doc.params.descriptions.newOrderId'),
          location: 'response',
          group: 'Data',
          important: true,
        },
      ],
    };
  }

  const request: ApiDocParam[] = [...requestBase];
  const response: ApiDocParam[] = [...responseBase];

  const isSearch = api.name.toLowerCase().includes('search');
  const baseCount = isSearch ? 180 : 60;
  for (let i = 1; i <= baseCount; i += 1) {
    request.push({
      name: `${isSearch ? 'filter' : 'param'}_${i}`,
      type: i % 5 === 0 ? 'bool' : i % 3 === 0 ? 'int' : 'string',
      required: i <= 3,
      description: t('doc.params.descriptions.paramHint', { index: i }),
      location: i % 4 === 0 ? 'header' : i % 3 === 0 ? 'query' : 'body',
      group: i % 4 === 0 ? 'Header' : i % 3 === 0 ? 'Query' : 'Body',
      important: i <= 8,
      defaultValue: i % 7 === 0 ? String(i) : undefined,
      example: i % 9 === 0 ? `example_${i}` : undefined,
    });
  }
  for (let i = 1; i <= Math.max(40, Math.floor(baseCount / 2)); i += 1) {
    response.push({
      name: `data.field_${i}`,
      type: i % 3 === 0 ? 'number' : 'string',
      required: i <= 8,
      description: t('doc.params.descriptions.fieldHint', { index: i }),
      location: 'response',
      group: i <= 10 ? 'Data' : 'Extra',
      important: i <= 8,
      example: i % 5 === 0 ? String(i) : undefined,
    });
  }

  return { request, response };
}

function buildApiStatusCodes(api: API, t: TFunction): ApiStatusCode[] {
  const unauth = api.authType === 'NONE';
  const authLabel =
    api.authType === 'OAUTH2'
      ? t('authLabels.oauth2')
      : api.authType === 'API_KEY'
        ? t('authLabels.apiKey')
        : t('authLabels.auth');
  const base: ApiStatusCode[] = [
    {
      httpStatus: 200,
      title: 'OK',
      standardDescription: t('statusCodes.200.standardDescription'),
      scenario: t('statusCodes.200.scenario'),
      responseExample: `{
  "code": 200,
  "message": "success",
  "data": {}
}`,
    },
    {
      httpStatus: 400,
      title: 'Bad Request',
      standardDescription: t('statusCodes.400.standardDescription'),
      scenario: t('statusCodes.400.scenario'),
      responseExample: `{
  "code": 400,
  "message": "invalid_params",
  "data": {
    "field": "user_id",
    "reason": "must be integer"
  }
}`,
    },
    ...(unauth
      ? []
      : [
          {
            httpStatus: 401,
            title: 'Unauthorized',
            standardDescription: t('statusCodes.401.standardDescription'),
            scenario: t('statusCodes.401.scenario', { authLabel }),
            responseExample: `{
  "code": 401,
  "message": "unauthorized",
  "data": {
    "auth_type": "${api.authType}"
  }
}`,
          },
          {
            httpStatus: 403,
            title: 'Forbidden',
            standardDescription: t('statusCodes.403.standardDescription'),
            scenario: t('statusCodes.403.scenario'),
            responseExample: `{
  "code": 403,
  "message": "forbidden",
  "data": {
    "reason": "no_permission"
  }
}`,
          },
        ]),
    {
      httpStatus: 404,
      title: 'Not Found',
      standardDescription: t('statusCodes.404.standardDescription'),
      scenario: t('statusCodes.404.scenario'),
      responseExample: `{
  "code": 404,
  "message": "not_found",
  "data": {}
}`,
    },
    {
      httpStatus: 409,
      title: 'Conflict',
      standardDescription: t('statusCodes.409.standardDescription'),
      scenario: t('statusCodes.409.scenario'),
      responseExample: `{
  "code": 409,
  "message": "conflict",
  "data": {
    "reason": "duplicate"
  }
}`,
    },
    {
      httpStatus: 422,
      title: 'Unprocessable Entity',
      standardDescription: t('statusCodes.422.standardDescription'),
      scenario: t('statusCodes.422.scenario'),
      responseExample: `{
  "code": 422,
  "message": "validation_failed",
  "data": {
    "field": "status",
    "reason": "invalid_state"
  }
}`,
    },
    {
      httpStatus: 429,
      title: 'Too Many Requests',
      standardDescription: t('statusCodes.429.standardDescription'),
      scenario: t('statusCodes.429.scenario'),
      responseExample: `{
  "code": 429,
  "message": "rate_limited",
  "data": {
    "retry_after": 1
  }
}`,
    },
    {
      httpStatus: 500,
      title: 'Internal Server Error',
      standardDescription: t('statusCodes.500.standardDescription'),
      scenario: t('statusCodes.500.scenario'),
      responseExample: `{
  "code": 500,
  "message": "internal_error",
  "data": {
    "request_id": "req_01J9..."
  }
}`,
    },
    {
      httpStatus: 503,
      title: 'Service Unavailable',
      standardDescription: t('statusCodes.503.standardDescription'),
      scenario: t('statusCodes.503.scenario'),
      responseExample: `{
  "code": 503,
  "message": "service_unavailable",
  "data": {}
}`,
    },
  ];

  const seen = new Set<number>();
  return base.filter((s) => (seen.has(s.httpStatus) ? false : (seen.add(s.httpStatus), true)));
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

function ApiDocParamTable({
  title,
  params,
  editable,
}: {
  title: string;
  params: ApiDocParam[];
  editable?: boolean;
}) {
  const { t, i18n } = useTranslation('apiCatalog');
  const [search, setSearch] = useState('');
  const [onlyImportant, setOnlyImportant] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const localeForSort = i18n.language.startsWith('en') ? 'en' : 'zh-Hans-CN';
  const searchGroupId = '__search__';

  const normalized = normalizeSearchText(search);
  const matches = useMemo(() => {
    const list = normalized
      ? params.filter((p) => {
          const hay = `${p.name} ${p.type} ${p.description} ${p.group} ${p.location} ${p.defaultValue ?? ''} ${p.example ?? ''} ${editable ? values[p.name] ?? '' : ''}`;
          return includesSearch(hay, normalized);
        })
      : params;
    return onlyImportant && !normalized ? list.filter((p) => p.important) : list;
  }, [editable, normalized, onlyImportant, params, values]);

  const groups = useMemo(() => {
    const keyParams = normalized ? [] : params.filter((p) => p.important);
    const rest = normalized ? matches : params.filter((p) => !p.important);
    const byGroup = rest.reduce<Record<string, ApiDocParam[]>>((acc, p) => {
      const key = normalized ? searchGroupId : p.group;
      acc[key] ??= [];
      acc[key].push(p);
      return acc;
    }, {});
    const groupEntries = Object.entries(byGroup).sort((a, b) => a[0].localeCompare(b[0], localeForSort));
    return { keyParams, groupEntries };
  }, [localeForSort, matches, normalized, params, searchGroupId]);

  const columns = useMemo(
    () =>
      editable
        ? [
            { key: 'name', label: t('doc.paramTable.columns.name'), className: 'col-span-3' },
            { key: 'type', label: t('doc.paramTable.columns.type'), className: 'col-span-2' },
            { key: 'required', label: t('doc.paramTable.columns.required'), className: 'col-span-1' },
            { key: 'location', label: t('doc.paramTable.columns.location'), className: 'col-span-1' },
            { key: 'value', label: t('doc.paramTable.columns.value'), className: 'col-span-2' },
            { key: 'defaultValue', label: t('doc.paramTable.columns.defaultValue'), className: 'col-span-1' },
            { key: 'description', label: t('doc.paramTable.columns.description'), className: 'col-span-2' },
          ]
        : [
            { key: 'name', label: t('doc.paramTable.columns.name'), className: 'col-span-3' },
            { key: 'type', label: t('doc.paramTable.columns.type'), className: 'col-span-2' },
            { key: 'required', label: t('doc.paramTable.columns.required'), className: 'col-span-1' },
            { key: 'location', label: t('doc.paramTable.columns.location'), className: 'col-span-1' },
            { key: 'defaultValue', label: t('doc.paramTable.columns.defaultValue'), className: 'col-span-2' },
            { key: 'description', label: t('doc.paramTable.columns.description'), className: 'col-span-3' },
          ],
    [editable, t],
  );

  const validateValue = (p: ApiDocParam, value: string) => {
    const raw = value.trim();
    if (!raw) {
      if (p.required === true) return t('doc.paramTable.validation.required');
      return null;
    }
    const typeId = p.type.toLowerCase();
    if (typeId === 'int' || typeId === 'bigint') return /^-?\d+$/.test(raw) ? null : t('doc.paramTable.validation.intOnly');
    if (typeId === 'number' || typeId === 'decimal') return Number.isFinite(Number(raw)) ? null : t('doc.paramTable.validation.numberOnly');
    if (typeId === 'bool' || typeId === 'boolean') {
      const ok = raw === 'true' || raw === 'false' || raw === '1' || raw === '0';
      return ok ? null : t('doc.paramTable.validation.boolOnly');
    }
    if (typeId === 'datetime') {
      const isIso = !Number.isNaN(Date.parse(raw));
      const isSimple = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$/.test(raw);
      return isIso || isSimple ? null : t('doc.paramTable.validation.datetimeOnly');
    }
    if (typeId === 'array' || typeId === 'object') {
      try {
        JSON.parse(raw);
        return null;
      } catch {
        return t('doc.paramTable.validation.jsonOnly');
      }
    }
    return null;
  };

  const getValue = (p: ApiDocParam) => values[p.name] ?? p.defaultValue ?? p.example ?? '';

  const renderRequired = (p: ApiDocParam) => {
    if (p.required === undefined) return <span className="text-muted-foreground">-</span>;
    if (p.required) return <Badge className="bg-red-100 text-red-700 border border-red-200">{t('doc.required.required')}</Badge>;
    return <Badge variant="secondary">{t('doc.required.optional')}</Badge>;
  };

  const renderDescription = (p: ApiDocParam, colSpanClass: string) => (
    <div className={`${colSpanClass} py-2 min-w-0`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="truncate cursor-help">{p.description}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[420px]">
          <div className="space-y-2">
            <div className="text-sm">{p.description}</div>
            {(p.example || p.defaultValue) && (
              <div className="text-xs text-muted-foreground space-y-1">
                {p.example && (
                  <div>
                    <span>{t('doc.hints.example')}</span>
                    <span className="font-mono">{p.example}</span>
                  </div>
                )}
                {p.defaultValue && (
                  <div>
                    <span>{t('doc.hints.defaultValue')}</span>
                    <span className="font-mono">{p.defaultValue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const renderRow = (p: ApiDocParam) => {
    const val = getValue(p);
    const err = errors[p.name];

    return (
      <div className={`grid grid-cols-12 items-center text-sm border-t px-3 ${p.important ? 'bg-primary/5' : ''}`}>
        <div className="col-span-3 py-2 font-mono truncate" title={p.name}>
          {p.name}
        </div>
        <div className="col-span-2 py-2">
          <Badge variant="outline">{p.type}</Badge>
        </div>
        <div className="col-span-1 py-2">{renderRequired(p)}</div>
        <div className="col-span-1 py-2">
          <Badge variant="secondary">{p.location}</Badge>
        </div>
        {editable ? (
          <div className="col-span-2 py-2 min-w-0 flex items-center gap-2">
            <Tooltip open={err ? undefined : false}>
              <TooltipTrigger asChild>
                <Input
                  aria-label={t('doc.paramTable.aria.valueForParam', { name: p.name })}
                  className="h-8"
                  value={val}
                  aria-invalid={!!err}
                  onChange={(e) => {
                    const next = e.target.value;
                    setValues((s) => ({ ...s, [p.name]: next }));
                    const msg = validateValue(p, next);
                    setErrors((s) => {
                      if (!msg) {
                        if (!(p.name in s)) return s;
                        const { [p.name]: _, ...rest } = s;
                        return rest;
                      }
                      return { ...s, [p.name]: msg };
                    });
                  }}
                  placeholder={p.example ?? p.defaultValue ?? ''}
                />
              </TooltipTrigger>
              {err && <TooltipContent side="top">{err}</TooltipContent>}
            </Tooltip>
            {err && (
              <Badge variant="destructive" className="text-xs">
                {t('doc.paramTable.validation.formatError')}
              </Badge>
            )}
          </div>
        ) : null}
        <div className={`${editable ? 'col-span-1' : 'col-span-2'} py-2 font-mono text-xs truncate`} title={p.defaultValue ?? ''}>
          {p.defaultValue ?? '-'}
        </div>
        {renderDescription(p, editable ? 'col-span-2' : 'col-span-3')}
      </div>
    );
  };

  const header = (
    <div className="grid grid-cols-12 text-xs text-muted-foreground bg-muted px-3 py-2 sticky top-0 z-10">
      {columns.map((c) => (
        <div key={c.key} className={c.className}>
          {c.label}
        </div>
      ))}
    </div>
  );

  const rowHeight = 44;
  const tableHeight = 320;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="mb-0">{title}</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox checked={onlyImportant} onCheckedChange={(v) => setOnlyImportant(v === true)} />
            <span className="text-sm">{t('doc.paramTable.onlyImportant')}</span>
          </div>
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder={editable ? t('doc.paramTable.placeholders.searchEditable') : t('doc.paramTable.placeholders.searchReadonly')}
            />
          </div>
        </div>
      </div>

      {!normalized && groups.keyParams.length > 0 && !onlyImportant && (
        <div className="border rounded-lg overflow-hidden">
          <VirtualizedRows
            items={groups.keyParams}
            height={Math.min(tableHeight, groups.keyParams.length * rowHeight)}
            rowHeight={rowHeight}
            header={header}
            minWidth={860}
            getKey={(p) => p.name}
            renderRow={(p) => renderRow(p as ApiDocParam)}
          />
        </div>
      )}

      {onlyImportant && !normalized ? (
        <div className="border rounded-lg overflow-hidden">
          <VirtualizedRows
            items={matches}
            height={Math.min(tableHeight, matches.length * rowHeight)}
            rowHeight={rowHeight}
            header={header}
            minWidth={860}
            getKey={(p) => p.name}
            renderRow={(p) => renderRow(p as ApiDocParam)}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {groups.groupEntries.map(([groupName, list]) => {
            const isCollapsed = collapsed[groupName] ?? (groupName !== searchGroupId);
            const label =
              groupName === searchGroupId ? t('doc.groups.searchResults') : t(`doc.groups.${groupName}` as never, { defaultValue: groupName });
            return (
              <div key={groupName} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent transition-colors"
                  onClick={() => setCollapsed((s) => ({ ...s, [groupName]: !isCollapsed }))}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    <span className="text-sm">{label}</span>
                    <Badge variant="secondary" className="text-xs">{list.length}</Badge>
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="border-t">
                    <VirtualizedRows
                      items={list}
                      height={tableHeight}
                      rowHeight={rowHeight}
                      header={header}
                      minWidth={860}
                      getKey={(p) => p.name}
                      renderRow={(p) => renderRow(p as ApiDocParam)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {t('pagination.total', { count: matches.length })}
      </div>
    </div>
  );
}

type ApiDocTreeNode = {
  key: string;
  segment: string;
  path: string;
  type?: string;
  description?: string;
  example?: string;
  required?: boolean;
  important?: boolean;
  children: ApiDocTreeNode[];
};

function buildDocTree(params: ApiDocParam[]): ApiDocTreeNode[] {
  const root: ApiDocTreeNode = {
    key: 'root',
    segment: '',
    path: '',
    children: [],
  };
  const byPath = new Map<string, ApiDocTreeNode>();
  byPath.set('', root);

  for (const p of params) {
    const segments = p.name.split('.').filter(Boolean);
    let current = root;
    let currentPath = '';
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i];
      currentPath = currentPath ? `${currentPath}.${seg}` : seg;
      const existing = byPath.get(currentPath);
      if (existing) {
        current = existing;
        continue;
      }
      const next: ApiDocTreeNode = {
        key: currentPath,
        segment: seg,
        path: currentPath,
        children: [],
      };
      current.children.push(next);
      byPath.set(currentPath, next);
      current = next;
    }

    current.type = p.type;
    current.description = p.description;
    current.example = p.example ?? p.defaultValue;
    current.required = p.required;
    current.important = p.important;
  }

  const sortNodes = (nodes: ApiDocTreeNode[]) => {
    nodes.sort((a, b) => a.segment.localeCompare(b.segment, 'zh-Hans-CN'));
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(root.children);

  return root.children;
}

function filterDocTree(nodes: ApiDocTreeNode[], q: string, onlyRequired: boolean): ApiDocTreeNode[] {
  const normalized = normalizeSearchText(q);
  const keepNode = (n: ApiDocTreeNode) => {
    const hay = `${n.segment} ${n.path} ${n.type ?? ''} ${n.description ?? ''} ${n.example ?? ''}`;
    const okQuery = !normalized || includesSearch(hay, normalized);
    const okRequired = !onlyRequired || n.required === true;
    return okQuery && okRequired;
  };

  const walk = (list: ApiDocTreeNode[]): ApiDocTreeNode[] => {
    const out: ApiDocTreeNode[] = [];
    for (const n of list) {
      const children = walk(n.children);
      if (keepNode(n) || children.length > 0) {
        out.push({ ...n, children });
      }
    }
    return out;
  };

  return walk(nodes);
}

function flattenDocTree(nodes: ApiDocTreeNode[]) {
  const out: Array<{ node: ApiDocTreeNode; depth: number }> = [];
  const walk = (list: ApiDocTreeNode[], depth: number) => {
    for (const n of list) {
      out.push({ node: n, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(nodes, 0);
  return out;
}

function ApiDocResponseTree({ params }: { params: ApiDocParam[] }) {
  const { t } = useTranslation('apiCatalog');
  const [search, setSearch] = useState('');
  const [onlyRequired, setOnlyRequired] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const tree = useMemo(() => buildDocTree(params), [params]);
  const filteredTree = useMemo(() => filterDocTree(tree, search, onlyRequired), [onlyRequired, search, tree]);
  const normalized = normalizeSearchText(search);

  const flat = useMemo(() => {
    if (normalized) return flattenDocTree(filteredTree);
    const out: Array<{ node: ApiDocTreeNode; depth: number }> = [];
    const walk = (list: ApiDocTreeNode[], depth: number) => {
      for (const n of list) {
        out.push({ node: n, depth });
        const isCollapsed = collapsed[n.path] ?? (depth >= 1 && n.children.length > 0);
        if (!isCollapsed) walk(n.children, depth + 1);
      }
    };
    walk(filteredTree, 0);
    return out;
  }, [collapsed, filteredTree, normalized]);

  const columns = [
    { key: 'name', label: t('doc.responseTree.columns.name'), className: 'col-span-4' },
    { key: 'type', label: t('doc.responseTree.columns.type'), className: 'col-span-2' },
    { key: 'required', label: t('doc.responseTree.columns.required'), className: 'col-span-1' },
    { key: 'example', label: t('doc.responseTree.columns.example'), className: 'col-span-2' },
    { key: 'description', label: t('doc.responseTree.columns.description'), className: 'col-span-3' },
  ];

  const header = (
    <div className="grid grid-cols-12 text-xs text-muted-foreground bg-muted px-3 py-2 sticky top-0 z-10">
      {columns.map((c) => (
        <div key={c.key} className={c.className}>
          {c.label}
        </div>
      ))}
    </div>
  );

  const renderRequired = (required?: boolean) => {
    if (required === undefined) return <span className="text-muted-foreground">-</span>;
    if (required) return <Badge className="bg-red-100 text-red-700 border border-red-200">{t('doc.required.required')}</Badge>;
    return <Badge variant="secondary">{t('doc.required.optional')}</Badge>;
  };

  const renderRow = ({ node, depth }: { node: ApiDocTreeNode; depth: number }) => {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed[node.path] ?? (depth >= 1 && hasChildren);
    const pad = Math.min(depth, 8) * 14;

    return (
      <div className={`grid grid-cols-12 items-center text-sm border-t px-3 ${node.important ? 'bg-primary/5' : ''}`}>
        <div className="col-span-4 py-2 min-w-0">
          <div className="flex items-center min-w-0" style={{ paddingLeft: pad }}>
            {hasChildren ? (
              <button
                type="button"
                className="mr-1 text-muted-foreground hover:text-foreground"
                aria-label={
                  isCollapsed
                    ? t('doc.responseTree.aria.expandNode', { path: node.path })
                    : t('doc.responseTree.aria.collapseNode', { path: node.path })
                }
                onClick={() => setCollapsed((s) => ({ ...s, [node.path]: !(s[node.path] ?? (depth >= 1 && hasChildren)) }))}
              >
                {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            ) : (
              <span className="mr-1 w-4" />
            )}
            <span className="font-mono truncate" title={node.path}>
              {node.segment}
            </span>
          </div>
        </div>
        <div className="col-span-2 py-2">
          {node.type ? <Badge variant="outline">{node.type}</Badge> : <span className="text-muted-foreground">-</span>}
        </div>
        <div className="col-span-1 py-2">{renderRequired(node.required)}</div>
        <div className="col-span-2 py-2 font-mono text-xs truncate" title={node.example ?? ''}>
          {node.example ?? '-'}
        </div>
        <div className="col-span-3 py-2 min-w-0">
          {node.description ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-help">{node.description}</div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[420px]">
                <div className="space-y-2">
                  <div className="text-sm">{node.description}</div>
                  {node.example && (
                    <div className="text-xs text-muted-foreground">
                      <span>{t('doc.hints.example')}</span>
                      <span className="font-mono">{node.example}</span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="mb-0">{t('doc.sections.responseParams')}</h3>
          <Badge variant="secondary" className="text-xs">
            {flat.length}
          </Badge>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox checked={onlyRequired} onCheckedChange={(v) => setOnlyRequired(v === true)} />
            <span className="text-sm">{t('doc.responseTree.onlyRequired')}</span>
          </div>
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder={t('doc.responseTree.placeholders.search')}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <VirtualizedRows
          items={flat}
          height={360}
          rowHeight={44}
          header={header}
          minWidth={900}
          getKey={(r) => r.node.path}
          renderRow={(r) => renderRow(r as { node: ApiDocTreeNode; depth: number })}
        />
      </div>
    </div>
  );
}

function ApiDocStatusCodes({ api }: { api: API }) {
  const { t } = useTranslation('apiCatalog');
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState<'all' | '2xx' | '4xx' | '5xx'>('all');
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const list = useMemo(() => buildApiStatusCodes(api, t), [api, t]);
  const normalized = normalizeSearchText(search);
  const filtered = useMemo(() => {
    return list
      .filter((s) => {
        if (family === '2xx') return s.httpStatus >= 200 && s.httpStatus < 300;
        if (family === '4xx') return s.httpStatus >= 400 && s.httpStatus < 500;
        if (family === '5xx') return s.httpStatus >= 500 && s.httpStatus < 600;
        return true;
      })
      .filter((s) => {
        if (!normalized) return true;
        const hay = `${s.httpStatus} ${s.title} ${s.standardDescription} ${s.scenario}`;
        return includesSearch(hay, normalized);
      });
  }, [family, list, normalized]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="mb-0">{t('doc.statusCodes.title')}</h3>
          <Badge variant="secondary" className="text-xs">
            {filtered.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={family} onValueChange={(v) => setFamily(v as 'all' | '2xx' | '4xx' | '5xx')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('doc.statusCodes.families.all')}</SelectItem>
              <SelectItem value="2xx">{t('doc.statusCodes.families.2xx')}</SelectItem>
              <SelectItem value="4xx">{t('doc.statusCodes.families.4xx')}</SelectItem>
              <SelectItem value="5xx">{t('doc.statusCodes.families.5xx')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder={t('doc.statusCodes.placeholders.search')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => {
          const isCollapsed = collapsed[s.httpStatus] ?? false;
          const badgeClass =
            s.httpStatus >= 200 && s.httpStatus < 300
              ? 'bg-green-100 text-green-700'
              : s.httpStatus >= 400 && s.httpStatus < 500
                ? 'bg-orange-100 text-orange-700'
                : 'bg-red-100 text-red-700';

          return (
            <Card key={s.httpStatus} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={badgeClass}>{s.httpStatus}</Badge>
                    <span className="font-medium">{s.title}</span>
                    <span className="text-sm text-muted-foreground">{s.standardDescription}</span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">{t('doc.statusCodes.labels.scenario')}</span>
                    <span>{s.scenario}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCollapsed((m) => ({ ...m, [s.httpStatus]: !isCollapsed }))}
                >
                  {isCollapsed ? t('doc.statusCodes.actions.expandExample') : t('doc.statusCodes.actions.collapseExample')}
                </Button>
              </div>
              {!isCollapsed && (
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto mt-3">
                  {s.responseExample}
                </pre>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ApiDocContent({ api }: { api: API }) {
  const { t } = useTranslation('apiCatalog');
  const doc = useMemo(() => buildApiDocParams(api, t), [api, t]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">{t('doc.sections.basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('doc.labels.requestMethod')}</span>
            <Badge className={`ml-2 ${api.method === 'GET' ? 'bg-green-500' : api.method === 'POST' ? 'bg-blue-500' : api.method === 'PUT' ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
              {api.method}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">{t('doc.labels.version')}</span>
            <span className="ml-2">{api.version}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('doc.labels.authType')}</span>
            <span className="ml-2">{api.authType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('doc.labels.domain')}</span>
            <span className="ml-2">{api.domain}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2">{t('doc.sections.requestPath')}</h3>
        <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
          {api.method} {api.path}
        </code>
      </div>

      <Tabs defaultValue="request">
        <TabsList>
          <TabsTrigger value="request">{t('doc.tabs.request')}</TabsTrigger>
          <TabsTrigger value="response">{t('doc.tabs.response')}</TabsTrigger>
          <TabsTrigger value="status">{t('doc.tabs.status')}</TabsTrigger>
          <TabsTrigger value="example">{t('doc.tabs.example')}</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-4">
          <ApiDocParamTable title={t('doc.sections.requestParams')} params={doc.request} editable />
        </TabsContent>

        <TabsContent value="response" className="space-y-4">
          <ApiDocResponseTree params={doc.response} />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <ApiDocStatusCodes api={api} />
        </TabsContent>

        <TabsContent value="example" className="space-y-4">
          <div>
            <h3 className="mb-2">{t('doc.sections.successResponseExample')}</h3>
            <pre className="bg-muted p-4 rounded text-xs font-mono overflow-x-auto">
{`{
  "code": 200,
  "message": "success",
  "data": {
    "total": 156,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "order_id": "ORD20251228001",
        "user_id": 123456,
        "order_date": "2025-12-28 10:30:00",
        "total_amount": 299.99,
        "status": "completed"
      }
    ]
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="mb-2">{t('doc.sections.onlineTest')}</h3>
            <Button className="gap-2">
              <Play className="size-4" />
              {t('doc.actions.openTestTool')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiDocDialogBody({
  api,
  onResetSelection,
}: {
  api: API | null;
  onResetSelection: () => void;
}) {
  const { t } = useTranslation('apiCatalog');
  const [size, setSize] = useState<{ width: number; height: number; manual: boolean }>({
    width: 980,
    height: 720,
    manual: false,
  });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const apiId = api?.id;

  const getConstraints = () => {
    const vw = typeof window === 'undefined' ? 1200 : window.innerWidth;
    const vh = typeof window === 'undefined' ? 900 : window.innerHeight;
    const maxWidth = Math.max(360, Math.min(1280, vw - 32));
    const maxHeight = Math.max(360, Math.min(920, vh - 32));
    const minWidth = Math.min(720, maxWidth);
    const minHeight = Math.min(520, maxHeight);
    return { minWidth, minHeight, maxWidth, maxHeight };
  };

  useEffect(() => {
    if (!apiId) return;
    if (size.manual) return;
    const { minWidth, minHeight, maxWidth, maxHeight } = getConstraints();
    const nextWidth = Math.max(minWidth, Math.min(maxWidth, 980));
    const baseHeight = Math.max(minHeight, Math.min(maxHeight, 720));

    let raf1 = 0;
    let raf2 = 0;

    raf1 = window.requestAnimationFrame(() => {
      setSize((s) => ({ ...s, width: nextWidth, height: baseHeight }));

      raf2 = window.requestAnimationFrame(() => {
        if (!contentRef.current) return;
        const desired = contentRef.current.scrollHeight + 96;
        setSize((s) => ({
          ...s,
          width: nextWidth,
          height: Math.max(minHeight, Math.min(maxHeight, desired)),
        }));
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [apiId, size.manual]);

  useEffect(() => {
    const onResize = () => {
      const { minWidth, minHeight, maxWidth, maxHeight } = getConstraints();
      setSize((s) => ({
        ...s,
        width: Math.max(minWidth, Math.min(maxWidth, s.width)),
        height: Math.max(minHeight, Math.min(maxHeight, s.height)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startResize = (mode: 'e' | 's' | 'se', e: React.PointerEvent) => {
    e.preventDefault();
    const { minWidth, minHeight, maxWidth, maxHeight } = getConstraints();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;
    setSize((s) => ({ ...s, manual: true }));

    const onMove = (evt: PointerEvent) => {
      const dx = evt.clientX - startX;
      const dy = evt.clientY - startY;
      const nextW = mode === 's' ? startW : Math.max(minWidth, Math.min(maxWidth, startW + dx));
      const nextH = mode === 'e' ? startH : Math.max(minHeight, Math.min(maxHeight, startH + dy));
      setSize((s) => ({ ...s, width: nextW, height: nextH, manual: true }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <DialogContent
      className="p-0 w-auto max-w-none overflow-hidden"
      style={{ width: size.width, height: size.height }}
    >
      <div className="flex flex-col h-full">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="truncate">{api?.name ?? t('doc.dialog.defaultTitle')}</DialogTitle>
              {api ? (
                <div className="text-sm text-muted-foreground mt-1 font-mono truncate">
                  {api.method} {api.path}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const { minWidth, minHeight, maxWidth, maxHeight } = getConstraints();
                  setSize({
                    width: Math.max(minWidth, Math.min(maxWidth, 980)),
                    height: Math.max(minHeight, Math.min(maxHeight, 720)),
                    manual: false,
                  });
                }}
              >
                {t('doc.dialog.actions.resetSize')}
              </Button>
              {!api && (
                <Button variant="outline" size="sm" onClick={onResetSelection}>
                  {t('doc.dialog.actions.backToList')}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
          {api ? <ApiDocContent api={api} /> : <div className="text-sm text-muted-foreground">{t('doc.dialog.apiMissing')}</div>}
        </div>
      </div>

      <div
        data-slot="api-doc-resize-handle-e"
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize"
        onPointerDown={(e) => startResize('e', e)}
      />
      <div
        data-slot="api-doc-resize-handle-s"
        className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize"
        onPointerDown={(e) => startResize('s', e)}
      />
      <div
        data-slot="api-doc-resize-handle-se"
        className="absolute right-1 bottom-1 size-4 rounded border bg-background cursor-nwse-resize opacity-70 hover:opacity-100"
        onPointerDown={(e) => startResize('se', e)}
      />
    </DialogContent>
  );
}

export function APICatalog() {
  const dispatch = useAppDispatch();
  const apis = useAppSelector((s) => s.apiCatalog.items);
  const apisStatus = useAppSelector((s) => s.apiCatalog.status);
  const { t } = useTranslation('apiCatalog');

  const [searchTerm, setSearchTerm] = useState('');
  const [openDocApiId, setOpenDocApiId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (apisStatus !== 'idle') return;
    dispatch(fetchCatalogApis());
  }, [apisStatus, dispatch]);

  const docAPI = useMemo(() => {
    if (!openDocApiId) return null;
    return apis.find((a) => a.id === openDocApiId) ?? null;
  }, [apis, openDocApiId]);

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

  // Generate hierarchical categories
  const buildCategoryTree = (): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Add "all" category
    rootCategories.push({ id: 'all', name: t('categories.all'), count: apis.length });

    // Build category hierarchy
    apis.forEach((api) => {
      const parts = api.category.split('/');
      let currentPath = '';

      parts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!categoryMap.has(currentPath)) {
          const category: Category = {
            id: currentPath,
            name: part,
            count: 0,
            children: [],
            parent: parentPath || undefined,
          };
          categoryMap.set(currentPath, category);

          if (index === 0) {
            rootCategories.push(category);
          } else if (parentPath) {
            const parent = categoryMap.get(parentPath);
            if (parent) {
              parent.children!.push(category);
            }
          }
        }

        // Increment count
        const category = categoryMap.get(currentPath);
        if (category) {
          category.count++;
        }
      });
    });

    return rootCategories;
  };

  const categories = buildCategoryTree();

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

  const filteredAPIs = apis.filter(
    (api) => {
      const matchesSearch = 
        api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        api.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || api.category.startsWith(selectedCategory);
      return matchesSearch && matchesCategory;
    }
  );

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
          <Button variant="outline">
            <ExternalLink className="size-4 mr-2" />
            {t('page.actions.exportDocs')}
          </Button>
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
        <div className="space-y-4 overflow-y-auto pr-2 max-h-[calc(100vh-360px)]">
          {pagedAPIs.map((api) => (
            <Card key={api.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <Badge className={`${getMethodColor(api.method)} text-white`}>{api.method}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
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
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{api.description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setOpenDocApiId(api.id)}
                  className="shrink-0"
                >
                  <BookOpen className="size-4 mr-2" />
                  {t('page.list.viewDocs')}
                </Button>
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
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">{t('pagination.perPage')}</div>
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
                    {t('pagination.perPageCount', { count: n })}
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

        {filteredAPIs.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">{t('page.empty.noResults')}</p>
          </Card>
        )}
      </div>

      <Dialog
        open={!!openDocApiId}
        onOpenChange={(open) => {
          if (!open) setOpenDocApiId(null);
        }}
      >
        <ApiDocDialogBody api={docAPI} onResetSelection={() => setOpenDocApiId(null)} />
      </Dialog>
    </div>
  );
}
