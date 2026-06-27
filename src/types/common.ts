export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

/** Forma del error que devuelve el backend (error.middleware). */
export interface ApiErrorBody {
  codigo?: string;
  mensaje?: string;
  meta?: Record<string, unknown>;
  correlationId?: string;
}
