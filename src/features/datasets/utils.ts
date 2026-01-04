import type { Dataset } from './types';

export type FieldGroupId = 'key' | 'sensitive' | 'time' | 'money' | 'business' | 'search';

export type DatasetField = {
  name: string;
  type: string;
  alias: string;
  masked: boolean;
  description: string;
  group: FieldGroupId;
  important?: boolean;
};

export type FieldSeed = {
  name: string;
  type: string;
  aliasKey: string;
  descriptionKey: string;
  masked: boolean;
  important?: boolean;
};

export const baseByName: Record<string, FieldSeed> = {
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

export function buildDatasetFields(
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

export function normalizeSearchText(v: string) {
  return v.trim().toLowerCase();
}
