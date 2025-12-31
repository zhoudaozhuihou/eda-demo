export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly payload?: unknown;

  constructor(message: string, opts: { status: number; code?: number; payload?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.payload = opts.payload;
  }
}

function getApiBaseUrl() {
  const v = (import.meta as ImportMeta).env?.VITE_API_BASE_URL as string | undefined;
  if (!v) return '';
  return v.endsWith('/') ? v.slice(0, -1) : v;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
    throw new ApiError(`HTTP ${res.status}`, { status: res.status, payload });
  }

  if (!isJson) {
    return (await res.text()) as unknown as T;
  }

  const body = (await res.json()) as ApiEnvelope<T> | T;
  if (typeof body === 'object' && body != null && 'code' in body && 'data' in body) {
    const env = body as ApiEnvelope<T>;
    if (env.code !== 0) {
      throw new ApiError(env.message || 'API Error', { status: res.status, code: env.code, payload: env });
    }
    return env.data;
  }

  return body as T;
}

