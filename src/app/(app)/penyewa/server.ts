import "server-only";
import { q } from "@/lib/db";
import type { PaginasiParams } from "@/lib/pagination";
export async function ambilPenyewa(p: PaginasiParams){return q.daftarPenyewaPaginated(p);}