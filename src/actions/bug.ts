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

export async function simpanBugAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    const sesi = await wajibSesi();
    const judul = tanpaHtml(wajibTeks(fd.get("judul"), "Judul", { min: 3, max: 120 }));
    const halaman = tanpaHtml(String(fd.get("halaman") ?? "")).slice(0, 80);
    const isi = tanpaHtml(wajibTeks(fd.get("isi"), "Deskripsi", { min: 5, max: 2000 }));
    q.simpanLaporanBug({ pelapor: sesi.nama, halaman, judul, isi });
    revalidatePath("/laporan-bug");
    return { sukses: "Laporan terkirim. Terima kasih!" };
  } catch (e) {
    return { error: pesan(e) };
  }
}

export async function selesaikanBugAction(id: number): Promise<Hasil> {
  try {
    await wajibPeran(["pemilik", "admin"]);
    q.ubahStatusBug(id, "selesai");
    revalidatePath("/laporan-bug");
    return { sukses: "Laporan ditandai selesai." };
  } catch (e) {
    return { error: pesan(e) };
  }
}
