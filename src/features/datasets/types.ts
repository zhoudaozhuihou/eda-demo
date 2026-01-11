export type TableMapping = {
  id: string;
  maxComputeTableName: string;
  hologresConnectionId: string;
  hologresTableName: string;
  status: 'mapped' | 'unmapped';
  fieldMappings?: Record<string, string>;
  updatedAt: string;
  updatedBy: string;
};

export type Dataset = {
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
  createdAt: string;
  updatedAt: string;
  relatedAPIs?: string[];
  description?: string;
  project?: string;
  mappings?: TableMapping[];
};
