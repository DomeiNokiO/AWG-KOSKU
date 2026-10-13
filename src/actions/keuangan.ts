"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { q } from "@/lib/db";
import { wajibSesi, wajibPeran } from "@/lib/sesi";
import { ValidasiError, wajibInt, wajibTanggal, wajibTeks, wajibSalahSatu, tanpaHtml } from "@/lib/core/validate.mjs";
import { rateLimit } from "@/lib/rate-limit";

/**
 * AWG-KOSKU — Server Action keuangan & pengaturan.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Aturan yang sama dengan actions/kosku.ts:
 *  - `wajibSesi()` di setiap aksi (Server Action = endpoint POST publik);
 *  - operasi uang (bayar, generate, pelunasan) hanya untuk peran `pemilik`
 *    dan `admin` — `kasir` boleh mencatat, tidak boleh menghapus/membatalkan;
 *  - semua masukan divalidasi di tepi handler sebelum menyentuh lapisan data.
 */

export type Hasil = { sukses?: string; error?: string; id?: number; data?: unknown };

function pesanDari(e: unknown): string {
  if (e instanceof ValidasiError) return e.message;
  if (e instanceof Error && e.message === "UNAUTHORIZED") return "Sesi Anda sudah berakhir. Silakan masuk kembali.";
  if (e instanceof Error && e.message === "FORBIDDEN") return "Peran Anda tidak memiliki akses untuk aksi ini.";
  // Pesan ValidasiError/bisnis boleh tampil (sudah disusun untuk pengguna);
  // pesan tak dikenal disamarkan agar detail internal tidak bocor ke klien.
  if (e instanceof Error && /^(Periode|Jatuh tempo|Jumlah|Tagihan|Terlalu)/.test(e.message)) return e.message;
  return "Terjadi kesalahan saat menyimpan. Coba lagi.";
}

async function catat(aksi: string, detail = "") {
  const sesi = await wajibSesi().catch(() => null);
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "lokal";
  q.catatAktivitas({ penggunaId: sesi?.id ?? null, aksi, detail, ip });
}

function muatLimit(fd: FormData) {
  const id = wajibInt(fd.get("tagihan_id"), "Tagihan", { min: 1 });
  const jumlah = wajibInt(fd.get("jumlah"), "Jumlah", { min: 1, max: 999_999_999 });
  const metode = wajibSalahSatu(fd.get("metode") ?? "tunai", ["tunai", "transfer", "qris", "deposit"], "Metode");
  return { id, jumlah, metode };
}

/* ------------------------------------------------------------- Bayar tagihan */

export async function bayarTagihanAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    const sesi = await wajibSesi();
    const { id, jumlah, metode } = muatLimit(fd);
    const catatan = tanpaHtml(String(fd.get("catatan") ?? "")).slice(0, 200);

    const hasil = q.bayarTagihan({ tagihanId: id, jumlah, metode, penggunaId: sesi.id, catatan });
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    revalidatePath("/laporan");
    await catat("bayar", `Tagihan #${id} ${jumlah} (${metode})${hasil.lunas ? " — lunas" : `, sisa ${hasil.sisa}`}`);
    return {
      sukses: hasil.lunas
        ? `Lunas. Terima kasih ${jumlah.toLocaleString("id-ID")}.`
        : `Tercatat. Sisa tagihan Rp ${hasil.sisa.toLocaleString("id-ID")}.`,
    };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function batalkanBayarAction(riwayatId: number): Promise<Hasil> {
  try {
    const sesi = await wajibPeran(["pemilik", "admin"]);
    const ok = q.batalkanBayar(riwayatId, sesi.id);
    revalidatePath("/pembayaran");
    revalidatePath("/laporan");
    await catat("batalkan-bayar", `Riwayat #${riwayatId}`);
    return ok ? { sukses: "Pembayaran dibatalkan & sisa tagihan dihitung ulang." } : { error: "Riwayat tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function pelunasanPenuhAction(id: number): Promise<Hasil> {
  try {
    await wajibSesi();
    const ok = q.tandaiLunas(id, "tunai");
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    await catat("lunas", `Tagihan #${id}`);
    return ok ? { sukses: "Tagihan ditandai lunas." } : { error: "Tagihan sudah lunas atau tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* --------------------------------------------------- Generate tagihan massal */

export async function generateTagihanAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    const sesi = await wajibPeran(["pemilik", "admin"]);

    // Rate limit: generate menyentuh seluruh penyewa aktif — jangan biarkan
    // dipanggil berulang dalam hitungan detik oleh satu sesi.
    const batas = rateLimit(`generate:${sesi.id}`, 6, 60 * 1000);
    if (!batas.diizinkan) return { error: `Terlalu sering. Coba lagi dalam ${batas.sisaDetik} detik.` };

    const periode = wajibTeks(fd.get("periode"), "Periode", { min: 7, max: 7 });
    if (!/^\d{4}-\d{2}$/.test(periode)) throw new ValidasiError("Periode harus YYYY-MM.", "periode");
    const jatuhTempo = wajibTanggal(fd.get("jatuh_tempo"), "jatuh tempo");
    const basis = wajibSalahSatu(fd.get("basis") ?? "kamar", ["kamar", "tetap"], "Basis tarif");
    const tambahan = wajibInt(fd.get("jumlah_tambahan") ?? 0, "Biaya tambahan", { min: -99_999_999, max: 999_999_999 });

    const hasil = q.generateTagihan({ periode, jatuhTempo, metodeBasis: basis, jumlahTambahan: tambahan });
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    await catat("generate-tagihan", `${periode}: ${hasil.dibuat} dibuat, ${hasil.dilewati} dilewati`);
    return { sukses: `${hasil.dibuat} tagihan dibuat, ${hasil.dilewati} sudah ada (dilewati).` };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* -------------------------------------------------------------- Pengeluaran */

export async function simpanPengeluaranAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    const sesi = await wajibSesi();
    const kategoriId = fd.get("kategori_id") ? wajibInt(fd.get("kategori_id"), "Kategori", { min: 1 }) : null;
    const tgl = wajibTanggal(fd.get("tgl"), "tanggal");
    const jumlah = wajibInt(fd.get("jumlah"), "Jumlah", { min: 1, max: 999_999_999 });
    const keterangan = tanpaHtml(wajibTeks(fd.get("keterangan"), "Keterangan", { min: 2, max: 200 }));
    const penerima = tanpaHtml(String(fd.get("penerima") ?? "")).slice(0, 80);

    const id = q.simpanPengeluaran({ kategoriId, tgl, jumlah, keterangan, penerima, penggunaId: sesi.id });
    revalidatePath("/pengeluaran");
    revalidatePath("/laporan");
    await catat("pengeluaran", `${keterangan} Rp ${jumlah}`);
    return { sukses: "Pengeluaran tercatat.", id };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function hapusPengeluaranAction(id: number): Promise<Hasil> {
  try {
    await wajibPeran(["pemilik", "admin"]);
    const ok = q.hapusPengeluaran(id);
    revalidatePath("/pengeluaran");
    revalidatePath("/laporan");
    await catat("hapus-pengeluaran", `#${id}`);
    return ok ? { sukses: "Pengeluaran dihapus." } : { error: "Data tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function simpanKategoriAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    await wajibSesi();
    const nama = tanpaHtml(wajibTeks(fd.get("nama"), "Nama kategori", { min: 2, max: 60 }));
    q.simpanKategoriPengeluaran(nama);
    revalidatePath("/pengeluaran");
    return { sukses: `Kategori "${nama}" tersimpan.` };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function hapusKategoriAction(id: number): Promise<Hasil> {
  try {
    await wajibPeran(["pemilik", "admin"]);
    q.hapusKategoriPengeluaran(id);
    revalidatePath("/pengeluaran");
    return { sukses: "Kategori dinonaktifkan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* --------------------------------------------------------------- Pengaturan */

export async function simpanPengaturanAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    await wajibPeran(["pemilik", "admin"]);
    const kunciSah = ["nama_kos", "alamat", "telepon", "template_wa", "denda_per_hari", "batas_gratis", "denda_aktif"];
    const obj: Record<string, string> = {};
    for (const k of kunciSah) {
      const v = fd.get(k);
      if (v !== null) obj[k] = tanpaHtml(String(v)).slice(0, 1000);
    }
    if (obj.denda_per_hari !== undefined) {
      const n = wajibInt(obj.denda_per_hari, "Denda per hari", { min: 0, max: 1_000_000 });
      obj.denda_per_hari = String(n);
    }
    if (obj.batas_gratis !== undefined) obj.batas_gratis = String(wajibInt(obj.batas_gratis, "Batas gratis", { min: 0, max: 60 }));
    q.simpanPengaturan(obj);

    // Aturan denda disimpan juga ke denda_konfig — tabel yang dibaca hitungDenda.
    q.simpanKonfigDenda({
      aktif: obj.denda_aktif === undefined ? 1 : Number(obj.denda_aktif),
      denda_per_hari: obj.denda_per_hari === undefined ? 0 : Number(obj.denda_per_hari),
      batas_gratis: obj.batas_gratis === undefined ? 0 : Number(obj.batas_gratis),
    });
    revalidatePath("/setting");
    revalidatePath("/laporan");
    await catat("pengaturan", Object.keys(obj).join(", "));
    return { sukses: "Pengaturan tersimpan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}
