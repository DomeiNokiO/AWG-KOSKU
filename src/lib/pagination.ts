export type PaginasiParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
} & Record<string, unknown>;

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  sort: string;
  order: "asc" | "desc";
  search: string;
};

export function hitungOffset(page: number, limit: number) {
  return Math.max(0, (page - 1) * limit);
}
export function hitungPages(total: number, limit: number) {
  return Math.max(1, Math.ceil(total / Math.max(1, limit)));
}
