export type ApiCatalogApi = {
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
};

