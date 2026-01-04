export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryLink = {
  itemType: 'dataset' | 'api';
  itemId: string;
  categoryId: string;
};

export type Taxonomy = {
  categories: Category[];
  links: CategoryLink[];
};

