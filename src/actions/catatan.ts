"use server";

import { revalidatePath } from "next/cache";
import { q } from "@/lib/db";
import { wajibSesi, wajibPeran } from "@/lib/sesi";
import { wajibTeks, tanpaHtml, ValidasiError } from "@/lib/core/validate.mjs";

export type Hasil = { sukses?: string; error?: string };

function pesan(e: unknown): string {
  if (e instanceof ValidasiError) return e.message;
  if (e instanceof Error && e.message === "UNAUTHORIZED") return "Sesi Anda sudah berakhir.";
  if (e instanceof Error && e.message === "FORBIDDEN") return "Peran Anda tidak memiliki akses.";
  return "Terjadi kesalahan. Coba lagi.";
}

export async function simpanCatatanAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    await wajibSesi();
    const judul = tanpaHtml(wajibTeks(fd.get("judul"), "Judul", { min: 2, max: 120 }));
    const isi = tanpaHtml(wajibTeks(fd.get("isi"), "Isi", { min: 1, max: 2000 }));
    q.simpanCatatan({ judul, isi });
    revalidatePath("/catatan");
    return { sukses: "Catatan tersimpan." };
  } catch (e) {
    return { error: pesan(e) };
  }
}

export async function hapusCatatanAction(id: number): Promise<Hasil> {
  try {
    await wajibPeran(["pemilik", "admin"]);
    const ok = q.hapusCatatan(id);
    revalidatePath("/catatan");
    return ok ? { sukses: "Catatan dihapus." } : { error: "Catatan tidak ditemukan." };
  } catch (e) {
    return { error: pesan(e) };
  }
}
