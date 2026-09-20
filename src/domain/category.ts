export interface Category {
  id: string;
  server_id: string;
  name: string;
  position: number;
}

export interface CategoryFieldErrors {
  name?: string;
}

export type CreateCategoryResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };

export type UpdateCategoryResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };
