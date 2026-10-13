"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { q } from "@/lib/db";
import { wajibSesi, wajibPeran } from "@/lib/sesi";
import {
  ValidasiError,
  tanpaHtml,
  wajibInt,
  wajibSalahSatu,
  wajibTanggal,
  wajibTeks,
  wajibTelepon,
} from "@/lib/core/validate.mjs";
import { hariIni, tambahBulan } from "@/lib/core/format.mjs";

/** Jejak audit: aksi yang mengubah data uang/status wajib meninggalkan jejak. */
async function catat(aksi: string, detail = "", sesi?: { id: number }): Promise<void> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "lokal";
  q.catatAktivitas({ penggunaId: sesi?.id ?? null, aksi, detail, ip });
}

/**
 * AWG-KOSKU — Server Action data operasional.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Aturan yang berlaku di seluruh berkas ini:
 *  - setiap aksi memanggil `wajibSesi()` lebih dulu — menyembunyikan tombol
 *    bukan kontrol akses, karena Server Action adalah endpoint POST publik;
 *  - semua masukan divalidasi di tepi handler (core/validate.mjs) sebelum
 *    menyentuh lapisan data;
 *  - semua kueri memakai prepared statement di core/db.mjs.
 */

export type Hasil = { sukses?: string; error?: string; id?: number };

function pesanDari(e: unknown): string {
  if (e instanceof ValidasiError) return e.message;
  if (e instanceof Error && e.message === "UNAUTHORIZED") return "Sesi Anda sudah berakhir. Silakan masuk kembali.";
  return "Terjadi kesalahan saat menyimpan. Coba lagi.";
}

/* ------------------------------------------------------------------ Kamar */

export async function simpanKamarAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    // Tarif & status kamar = keputusan bisnis, bukan operasi kasir harian.
    await wajibPeran(["pemilik", "admin"]);
    const nomor = wajibTeks(fd.get("nomor"), "Nomor kamar", { min: 1, max: 12 });
    const tipe = wajibTeks(fd.get("tipe"), "Tipe", { min: 1, max: 40 });
    const lantai = wajibInt(fd.get("lantai"), "Lantai", { min: 0, max: 50 });
    const tarif = wajibInt(fd.get("tarif"), "Tarif", { min: 0, max: 999_999_999 });
    const status = wajibSalahSatu(fd.get("status") ?? "kosong", ["kosong", "terisi", "perbaikan"], "Status");

    q.simpanKamar({ nomor, tipe, lantai, tarif, status });
    revalidatePath("/dashboard");
    revalidatePath("/kamar");
    return { sukses: `Kamar ${nomor} tersimpan.` };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* ---------------------------------------------------------------- Penyewa */

export async function tambahPenyewaAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    // Mendaftarkan penyewa baru mengikat kontrak sewa — keputusan bisnis.
    await wajibPeran(["pemilik", "admin"]);
    const nama = tanpaHtml(wajibTeks(fd.get("nama"), "Nama penyewa", { min: 2, max: 80 }));
    const telepon = wajibTelepon(fd.get("telepon"));
    const nomorKamar = wajibTeks(fd.get("kamar"), "Kamar", { min: 1, max: 12 });
    const masuk = wajibTanggal(fd.get("tanggal_masuk") ?? hariIni(), "tanggal masuk");
    const durasi = wajibInt(fd.get("durasi_bulan") ?? 1, "Durasi", { min: 1, max: 60 });
    const tarif = wajibInt(fd.get("tarif") ?? 0, "Tarif", { min: 0, max: 999_999_999 });

    const kamarId = q.cariKamarId(nomorKamar);
    if (!kamarId) throw new ValidasiError(`Kamar ${nomorKamar} belum terdaftar.`, "kamar");

    const id = q.simpanPenyewa({ nama, telepon, kamarId, tanggalMasuk: masuk, status: "aktif" });

    // Tagihan pertama dibuat sekaligus supaya penyewa baru tidak pernah
    // "hilang" dari tabel jatuh tempo hanya karena lupa membuat tagihan.
    const periode = masuk.slice(0, 7);
    const jatuhTempo = tambahBulan(masuk, 1);
    q.simpanTagihan({ penyewaId: id, periode, jatuhTempo, jumlah: tarif || 0, catatan: `Sewa ${durasi} bulan` });

    revalidatePath("/dashboard");
    revalidatePath("/penyewa");
    revalidatePath("/pembayaran");
    return { sukses: `${nama} masuk kamar ${nomorKamar}. Tagihan pertama jatuh tempo ${jatuhTempo}.`, id };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function ubahStatusPenyewaAction(id: number, status: "aktif" | "keluar"): Promise<Hasil> {
  try {
    // Penyewa keluar/aktif mengubah status kamar & tanggungan tagihan — bukan
    // operasi kasir harian. Sama seperti pembatalan pembayaran: pemilik/admin.
    await wajibPeran(["pemilik", "admin"]);
    const sah = wajibSalahSatu(status, ["aktif", "keluar"], "Status");
    const ok = q.ubahStatusPenyewa(wajibInt(id, "id", { min: 1 }), sah);
    revalidatePath("/penyewa");
    revalidatePath("/kamar");
    revalidatePath("/dashboard");
    return ok ? { sukses: sah === "keluar" ? "Penyewa ditandai keluar." : "Penyewa diaktifkan kembali." } : { error: "Data penyewa tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* ------------------------------------------------------------- Pembayaran */

export async function tambahTagihanAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    // Menciptakan utang penyewa = keputusan bisnis, bukan operasi kasir harian.
    await wajibPeran(["pemilik", "admin"]);
    const penyewaId = wajibInt(fd.get("penyewa_id"), "Penyewa", { min: 1 });
    const periode = wajibTeks(fd.get("periode"), "Periode", { min: 7, max: 7 });
    if (!/^\d{4}-\d{2}$/.test(periode)) throw new ValidasiError("Periode harus berformat YYYY-MM.", "periode");
    const jatuhTempo = wajibTanggal(fd.get("jatuh_tempo"), "jatuh tempo");
    const jumlah = wajibInt(fd.get("jumlah"), "Jumlah", { min: 1, max: 999_999_999 });
    const catatan = tanpaHtml(String(fd.get("catatan") ?? "")).slice(0, 200);

    q.simpanTagihan({ penyewaId, periode, jatuhTempo, jumlah, catatan });
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    return { sukses: "Tagihan tersimpan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function tandaiLunasAction(id: number): Promise<Hasil> {
  try {
    // "Tandai lunas" membuat riwayat bayar palsu tanpa uang nyata (metode
    // transfer tak terverifikasi) — setara keputusan pemilik/admin, bukan
    // operasi kasir. Kasir memakai bayarTagihanAction (uang nyata + jejak).
    const sesi = await wajibPeran(["pemilik", "admin"]);
    const ok = q.tandaiLunas(wajibInt(id, "id", { min: 1 }), "transfer");
    await catat("tandai-lunas", `Tagihan #${id} (pintasan lunas, tanpa uang masuk)`, sesi);
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    return ok ? { sukses: "Tagihan ditandai lunas." } : { error: "Tagihan sudah lunas atau tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function batalkanLunasAction(id: number): Promise<Hasil> {
  try {
    // Membatalkan status lunas menyentuh data uang yang sudah tercatat —
    // satu tingkat dengan batalkanBayarAction: pemilik + admin, berjejak.
    const sesi = await wajibPeran(["pemilik", "admin"]);
    const ok = q.batalkanLunas(wajibInt(id, "id", { min: 1 }));
    await catat("batalkan-lunas", `Tagihan #${id}`, sesi);
    revalidatePath("/dashboard");
    revalidatePath("/pembayaran");
    return ok ? { sukses: "Status lunas dibatalkan." } : { error: "Tagihan belum ditandai lunas." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* --------------------------------------------------------------- Catatan */

export async function simpanCatatanAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    await wajibSesi();
    const judul = tanpaHtml(wajibTeks(fd.get("judul"), "Judul", { min: 2, max: 120 }));
    const isi = tanpaHtml(String(fd.get("isi") ?? "")).slice(0, 2000);
    q.simpanCatatan({ judul, isi });
    revalidatePath("/catatan");
    return { sukses: "Catatan disimpan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function hapusCatatanAction(id: number): Promise<Hasil> {
  try {
    await wajibSesi();
    const ok = q.hapusCatatan(wajibInt(id, "id", { min: 1 }));
    revalidatePath("/catatan");
    return ok ? { sukses: "Catatan dihapus." } : { error: "Catatan tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

/* ----------------------------------------------------------- Laporan bug */

export async function kirimLaporanBugAction(_s: Hasil | undefined, fd: FormData): Promise<Hasil> {
  try {
    const sesi = await wajibSesi();
    const judul = tanpaHtml(wajibTeks(fd.get("judul"), "Judul", { min: 4, max: 120 }));
    const isi = tanpaHtml(String(fd.get("isi") ?? "")).slice(0, 2000);
    const halaman = tanpaHtml(String(fd.get("halaman") ?? "")).slice(0, 120);
    q.simpanLaporanBug({ pelapor: sesi.email, halaman, judul, isi });
    revalidatePath("/laporan-bug");
    return { sukses: "Laporan terkirim. Terima kasih!" };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}

export async function ubahStatusBugAction(id: number, status: string): Promise<Hasil> {
  try {
    await wajibSesi();
    const sah = wajibSalahSatu(status, ["baru", "diproses", "selesai", "ditolak"], "Status");
    const ok = q.ubahStatusBug(wajibInt(id, "id", { min: 1 }), sah);
    revalidatePath("/laporan-bug");
    return ok ? { sukses: `Status laporan diubah ke ${sah}.` } : { error: "Laporan tidak ditemukan." };
  } catch (e) {
    return { error: pesanDari(e) };
  }
}
