"use server";
import "server-only";
import { daftarPenyewaPaginated } from "@/lib/db";
import type { PaginasiParams } from "@/lib/pagination";
export async function ambilPenyewa(p: PaginasiParams) {
  return daftarPenyewaPaginated(p);
}