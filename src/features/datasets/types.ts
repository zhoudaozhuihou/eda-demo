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
  relatedAPIs?: string[];
  description?: string;
};

