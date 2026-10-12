import "server-only";
import { q } from "./db";
import type { PaginasiParams, Paginated } from "./pagination";

export function daftarPenyewaServer(params: PaginasiParams) {
  const db = (q as any).db ?? (global as any).__KDB__; // fallback aman
  // akses via q tidak langsung; kita buat lewat core? tapi q wrap
  // gunakan q.daftarPenyewa saja jika filter sederhana; buat baru
  return (q as any).daftarPenyewaPaginated?.(params) || { data: [], total: 0, page: 1, limit: params.limit||10, pages:1, sort:"id", order:"desc", search:params.search||"" };
}
