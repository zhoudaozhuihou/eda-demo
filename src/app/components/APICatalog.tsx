import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Search, BookOpen, Play, TrendingUp, Clock, Activity, Copy, ExternalLink, FolderOpen, BarChart, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface API {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  domain: string;
  category: string;
  description: string;
  version: string;
  status: 'active' | 'deprecated';
  qps: number;
  avgLatency: number;
  callsToday: number;
  authType: string;
  createdAt: string;
  datasets?: string[];
}

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

function buildApiDocParams(api: API): { request: ApiDocParam[]; response: ApiDocParam[] } {
  const requestBase: ApiDocParam[] = [
    {
      name: 'x-request-id',
      type: 'string',
      required: false,
      description: '请求链路追踪ID（建议传入，便于定位问题）',
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
      description: '业务状态码',
      location: 'response',
      group: 'Envelope',
      important: true,
      example: '200',
    },
    {
      name: 'message',
      type: 'string',
      required: true,
      description: '状态描述',
      location: 'response',
      group: 'Envelope',
      important: true,
      example: 'success',
    },
    {
      name: 'data',
      type: 'object',
      required: true,
      description: '业务数据',
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
          description: '用户ID',
          location: 'query',
          group: 'Query',
          important: true,
        },
        {
          name: 'page',
          type: 'int',
          required: false,
          description: '页码，默认1',
          location: 'query',
          group: 'Query',
          defaultValue: '1',
        },
        {
          name: 'page_size',
          type: 'int',
          required: false,
          description: '每页数量，默认20',
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
          description: '总数',
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.page',
          type: 'number',
          required: true,
          description: '页码',
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.page_size',
          type: 'number',
          required: true,
          description: '每页数量',
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.items[]',
          type: 'array',
          required: true,
          description: '订单列表',
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.items[].order_id',
          type: 'string',
          required: true,
          description: '订单ID',
          location: 'response',
          group: 'Item',
          important: true,
        },
        {
          name: 'data.items[].total_amount',
          type: 'number',
          required: true,
          description: '订单金额',
          location: 'response',
          group: 'Item',
          important: true,
        },
        {
          name: 'data.items[].status',
          type: 'string',
          required: true,
          description: '订单状态',
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
          description: '订单ID（路径参数）',
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
          description: '订单ID',
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.user_id',
          type: 'bigint',
          required: true,
          description: '用户ID',
          location: 'response',
          group: 'Data',
          important: true,
        },
        {
          name: 'data.items[]',
          type: 'array',
          required: false,
          description: '订单明细',
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
          description: '用户ID',
          location: 'body',
          group: 'Body',
          important: true,
        },
        {
          name: 'items',
          type: 'array',
          required: true,
          description: '商品项列表',
          location: 'body',
          group: 'Body',
          important: true,
        },
        {
          name: 'items[].sku_id',
          type: 'string',
          required: true,
          description: 'SKU ID',
          location: 'body',
          group: 'Body',
        },
        {
          name: 'items[].qty',
          type: 'int',
          required: true,
          description: '购买数量',
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
          description: '新创建的订单ID',
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
      description: `参数说明 ${i}`,
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
      description: `字段说明 ${i}`,
      location: 'response',
      group: i <= 10 ? 'Data' : 'Extra',
      important: i <= 8,
      example: i % 5 === 0 ? String(i) : undefined,
    });
  }

  return { request, response };
}

function buildApiStatusCodes(api: API): ApiStatusCode[] {
  const unauth = api.authType === 'NONE';
  const authLabel = api.authType === 'OAUTH2' ? 'OAuth2' : api.authType === 'API_KEY' ? 'API Key' : '认证';
  const base: ApiStatusCode[] = [
    {
      httpStatus: 200,
      title: 'OK',
      standardDescription: '请求成功',
      scenario: '请求参数校验通过，成功返回业务数据。',
      responseExample: `{
  "code": 200,
  "message": "success",
  "data": {}
}`,
    },
    {
      httpStatus: 400,
      title: 'Bad Request',
      standardDescription: '请求参数错误',
      scenario: '参数缺失、格式不合法或类型不匹配。',
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
            standardDescription: '未认证',
            scenario: `${authLabel} 缺失或无效。`,
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
            standardDescription: '无权限访问',
            scenario: '认证通过但无该 API 的访问权限或命中策略拦截。',
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
      standardDescription: '资源不存在',
      scenario: '路径参数指向的资源不存在，或路由未匹配。',
      responseExample: `{
  "code": 404,
  "message": "not_found",
  "data": {}
}`,
    },
    {
      httpStatus: 409,
      title: 'Conflict',
      standardDescription: '资源冲突',
      scenario: '并发写入导致版本冲突，或业务规则不允许重复创建。',
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
      standardDescription: '语义校验失败',
      scenario: '参数格式正确但不满足业务约束（如范围、状态机）。',
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
      standardDescription: '请求过多',
      scenario: '超过 QPS 配额或触发限流策略。',
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
      standardDescription: '服务内部错误',
      scenario: '服务端异常或依赖服务返回不可预期结果。',
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
      standardDescription: '服务不可用',
      scenario: '服务降级、发布中或依赖不可用导致无法处理请求。',
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
  const [search, setSearch] = useState('');
  const [onlyImportant, setOnlyImportant] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalized = normalizeSearchText(search);
  const matches = useMemo(() => {
    const list = normalized
      ? params.filter((p) => {
          const hay = `${p.name} ${p.type} ${p.description} ${p.group} ${p.location} ${p.defaultValue ?? ''} ${p.example ?? ''} ${editable ? values[p.name] ?? '' : ''}`;
          return includesSearch(hay, normalized);
        })
      : params;
    return onlyImportant && !normalized ? list.filter((p) => p.important) : list;
  }, [editable, normalized, onlyImportant, params, search, values]);

  const groups = useMemo(() => {
    const keyParams = normalized ? [] : params.filter((p) => p.important);
    const rest = normalized ? matches : params.filter((p) => !p.important);
    const byGroup = rest.reduce<Record<string, ApiDocParam[]>>((acc, p) => {
      const key = normalized ? '搜索结果' : p.group;
      acc[key] ??= [];
      acc[key].push(p);
      return acc;
    }, {});
    const groupEntries = Object.entries(byGroup).sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'));
    return { keyParams, groupEntries };
  }, [matches, normalized, params]);

  const columns = useMemo(
    () =>
      editable
        ? [
            { key: 'name', label: '参数名', className: 'col-span-3' },
            { key: 'type', label: '类型', className: 'col-span-2' },
            { key: 'required', label: '必填', className: 'col-span-1' },
            { key: 'location', label: '位置', className: 'col-span-1' },
            { key: 'value', label: '值', className: 'col-span-2' },
            { key: 'defaultValue', label: '默认值', className: 'col-span-1' },
            { key: 'description', label: '说明', className: 'col-span-2' },
          ]
        : [
            { key: 'name', label: '参数名', className: 'col-span-3' },
            { key: 'type', label: '类型', className: 'col-span-2' },
            { key: 'required', label: '必填', className: 'col-span-1' },
            { key: 'location', label: '位置', className: 'col-span-1' },
            { key: 'defaultValue', label: '默认值', className: 'col-span-2' },
            { key: 'description', label: '说明', className: 'col-span-3' },
          ],
    [editable],
  );

  const validateValue = (p: ApiDocParam, value: string) => {
    const raw = value.trim();
    if (!raw) {
      if (p.required === true) return '必填参数不能为空';
      return null;
    }
    const t = p.type.toLowerCase();
    if (t === 'int' || t === 'bigint') return /^-?\d+$/.test(raw) ? null : '仅支持整数';
    if (t === 'number' || t === 'decimal') return Number.isFinite(Number(raw)) ? null : '仅支持数字';
    if (t === 'bool' || t === 'boolean') {
      const ok = raw === 'true' || raw === 'false' || raw === '1' || raw === '0';
      return ok ? null : '仅支持 true/false/1/0';
    }
    if (t === 'datetime') {
      const isIso = !Number.isNaN(Date.parse(raw));
      const isSimple = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}:\d{2})?$/.test(raw);
      return isIso || isSimple ? null : '仅支持 ISO 或 YYYY-MM-DD[ HH:mm:ss]';
    }
    if (t === 'array' || t === 'object') {
      try {
        JSON.parse(raw);
        return null;
      } catch {
        return '仅支持合法 JSON';
      }
    }
    return null;
  };

  const getValue = (p: ApiDocParam) => values[p.name] ?? p.defaultValue ?? p.example ?? '';

  const renderRequired = (p: ApiDocParam) => {
    if (p.required === undefined) return <span className="text-muted-foreground">-</span>;
    if (p.required) return <Badge className="bg-red-100 text-red-700 border border-red-200">必填</Badge>;
    return <Badge variant="secondary">可选</Badge>;
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
                    <span>示例：</span>
                    <span className="font-mono">{p.example}</span>
                  </div>
                )}
                {p.defaultValue && (
                  <div>
                    <span>默认值：</span>
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
            <Tooltip open={!!err ? undefined : false}>
              <TooltipTrigger asChild>
                <Input
                  aria-label={`参数值 ${p.name}`}
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
                格式错误
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
            <span className="text-sm">仅关键参数</span>
          </div>
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder={editable ? '搜索参数名/说明/类型/值' : '搜索参数名/说明/类型'}
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
            const isCollapsed = collapsed[groupName] ?? (groupName !== '搜索结果');
            return (
              <div key={groupName} className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 bg-card hover:bg-accent transition-colors"
                  onClick={() => setCollapsed((s) => ({ ...s, [groupName]: !isCollapsed }))}
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
        共 {matches.length} 条
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
    { key: 'name', label: '字段名', className: 'col-span-4' },
    { key: 'type', label: '类型', className: 'col-span-2' },
    { key: 'required', label: '必填', className: 'col-span-1' },
    { key: 'example', label: '示例', className: 'col-span-2' },
    { key: 'description', label: '描述', className: 'col-span-3' },
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
    if (required) return <Badge className="bg-red-100 text-red-700 border border-red-200">必填</Badge>;
    return <Badge variant="secondary">可选</Badge>;
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
                aria-label={`${isCollapsed ? '展开' : '折叠'} ${node.path}`}
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
                      <span>示例：</span>
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
          <h3 className="mb-0">响应参数</h3>
          <Badge variant="secondary" className="text-xs">
            {flat.length}
          </Badge>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox checked={onlyRequired} onCheckedChange={(v) => setOnlyRequired(v === true)} />
            <span className="text-sm">仅必填</span>
          </div>
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="搜索字段名/类型/描述"
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
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState<'all' | '2xx' | '4xx' | '5xx'>('all');
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const list = useMemo(() => buildApiStatusCodes(api), [api]);
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
          <h3 className="mb-0">状态码</h3>
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
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="2xx">2xx 成功</SelectItem>
              <SelectItem value="4xx">4xx 客户端错误</SelectItem>
              <SelectItem value="5xx">5xx 服务端错误</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="搜索状态码/描述/场景"
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
                    <span className="text-muted-foreground">业务场景：</span>
                    <span>{s.scenario}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCollapsed((m) => ({ ...m, [s.httpStatus]: !isCollapsed }))}
                >
                  {isCollapsed ? '展开示例' : '收起示例'}
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
  const doc = useMemo(() => buildApiDocParams(api), [api]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2">基本信息</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">请求方法:</span>
            <Badge className={`ml-2 ${api.method === 'GET' ? 'bg-green-500' : api.method === 'POST' ? 'bg-blue-500' : api.method === 'PUT' ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
              {api.method}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">版本:</span>
            <span className="ml-2">{api.version}</span>
          </div>
          <div>
            <span className="text-muted-foreground">认证方式:</span>
            <span className="ml-2">{api.authType}</span>
          </div>
          <div>
            <span className="text-muted-foreground">业务域:</span>
            <span className="ml-2">{api.domain}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2">请求路径</h3>
        <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
          {api.method} {api.path}
        </code>
      </div>

      <Tabs defaultValue="request">
        <TabsList>
          <TabsTrigger value="request">请求参数</TabsTrigger>
          <TabsTrigger value="response">响应参数</TabsTrigger>
          <TabsTrigger value="status">状态码</TabsTrigger>
          <TabsTrigger value="example">示例与测试</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-4">
          <ApiDocParamTable title="请求参数" params={doc.request} editable />
        </TabsContent>

        <TabsContent value="response" className="space-y-4">
          <ApiDocResponseTree params={doc.response} />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <ApiDocStatusCodes api={api} />
        </TabsContent>

        <TabsContent value="example" className="space-y-4">
          <div>
            <h3 className="mb-2">成功响应示例</h3>
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
            <h3 className="mb-2">在线测试</h3>
            <Button className="gap-2">
              <Play className="size-4" />
              打开测试工具
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
  const [size, setSize] = useState<{ width: number; height: number; manual: boolean }>({
    width: 980,
    height: 720,
    manual: false,
  });
  const contentRef = useRef<HTMLDivElement | null>(null);

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
    if (!api) return;
    if (size.manual) return;
    const { minWidth, minHeight, maxWidth, maxHeight } = getConstraints();
    const nextWidth = Math.max(minWidth, Math.min(maxWidth, 980));
    setSize((s) => ({ ...s, width: nextWidth, height: Math.max(minHeight, Math.min(maxHeight, 720)) }));

    const raf = window.requestAnimationFrame(() => {
      if (!contentRef.current) return;
      const desired = contentRef.current.scrollHeight + 96;
      setSize((s) => ({
        ...s,
        width: nextWidth,
        height: Math.max(minHeight, Math.min(maxHeight, desired)),
      }));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [api?.id, size.manual]);

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
              <DialogTitle className="truncate">{api?.name ?? 'API 文档'}</DialogTitle>
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
                重置尺寸
              </Button>
              {!api && (
                <Button variant="outline" size="sm" onClick={onResetSelection}>
                  返回列表
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div ref={contentRef} className="flex-1 overflow-y-auto px-6 py-5">
          {api ? <ApiDocContent api={api} /> : <div className="text-sm text-muted-foreground">API 不存在或已被移除</div>}
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
  const [apis, setApis] = useState<API[]>([
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
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [openDocApiId, setOpenDocApiId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['订单域', '商品域']));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

      setApis((prev) =>
        prev.map((a) => {
          if (a.id !== apiId) return a;
          if (nextApi) return nextApi;
          if (patch) return { ...a, ...patch };
          return a;
        }),
      );
    };
    window.addEventListener('eda:api-doc-updated', onDocUpdated as EventListener);
    return () => window.removeEventListener('eda:api-doc-updated', onDocUpdated as EventListener);
  }, []);

  // Generate hierarchical categories
  const buildCategoryTree = (): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Add "all" category
    rootCategories.push({ id: 'all', name: '全部 API', count: apis.length });

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

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
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
      const isExpanded = expandedCategories.has(cat.id);
      const isSelected = selectedCategory === cat.id;

      return (
        <div key={cat.id}>
          <button
            onClick={() => {
              setSelectedCategory(cat.id);
              setPage(1);
              if (hasChildren) {
                toggleCategory(cat.id);
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
          </button>
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
    toast.success('已复制到剪贴板');
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Category Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col">
        <Card className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <FolderOpen className="size-5 text-primary" />
            <h3>API 分类</h3>
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {renderCategoryTree(categories)}
          </div>
        </Card>

        <Card className="p-4 mt-4 flex-shrink-0">
          <h3 className="mb-3 flex items-center gap-2">
            <BarChart className="size-4" />
            API 统计
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">活跃 API</span>
              <span className="font-semibold">{apis.filter(a => a.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">今日总调用</span>
              <span className="font-semibold">
                {apis.reduce((sum, api) => sum + api.callsToday, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">平均延迟</span>
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
            <h1 className="text-3xl mb-2">API 目录</h1>
            <p className="text-muted-foreground">浏览和测试已发布的 API</p>
          </div>
          <Button variant="outline">
            <ExternalLink className="size-4 mr-2" />
            导出文档
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索 API 名称或描述..."
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
                        <Badge variant="destructive">已弃用</Badge>
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
                  查看文档
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-muted-foreground">QPS</div>
                    <div>{api.qps}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-muted-foreground">平均延迟</div>
                    <div>{api.avgLatency}ms</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="text-muted-foreground">今日调用</div>
                    <div>{api.callsToday.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground">创建时间</div>
                  <div>{api.createdAt}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredAPIs.length} 条
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

        {filteredAPIs.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">没有找到匹配的 API</p>
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
