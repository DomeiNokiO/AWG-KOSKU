"use server";

import { q } from "@/lib/db";
import { wajibSesi } from "@/lib/sesi";
import type { PaginasiParams, Paginated } from "@/lib/pagination";
import type { BarisTagihan, BarisRiwayat, BarisPengeluaran, BarisAktivitas, BarisRincianBayar } from "@/lib/tipe-baris";

/**
 * AWG-KOSKU — pengambil data server-side untuk DataTable.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Semua parameter datang dari URL (page/limit/search/sort/order + filter) —
 * klien tidak pernah menerima seluruh tabel, dan setiap panggilan wajib sesi
 * karena Server Action bisa dipanggil langsung tanpa lewat UI.
 */

export async function ambilTagihan(p: PaginasiParams): Promise<Paginated<BarisTagihan>> {
  await wajibSesi();
  return q.paginan({
    table: "pembayaran b",
    select: "b.id, p.nama, p.telepon, k.nomor AS kamar, b.periode, b.jatuh_tempo, b.jumlah, b.terbayar, b.sisa, b.status, b.dibayar_pada, b.metode",
    joins: "JOIN penyewa p ON p.id = b.penyewa_id LEFT JOIN kamar k ON k.id = p.kamar_id",
    where: p.status && p.status !== "semua" ? ["b.status = ?"] : [],
    params: p.status && p.status !== "semua" ? [String(p.status)] : [],
    search: p.search || "",
    searchCols: ["p.nama", "p.telepon", "k.nomor", "b.periode"],
    sort: p.sort || "jatuh_tempo",
    sortWhitelist: ["jatuh_tempo", "periode", "jumlah", "sisa", "nama", "kamar"],
    // JOIN membuat jumlah/nama/kamar ambigu — semua sort dipetakan eksplisit.
    sortMap: {
      id: "b.id",
      jatuh_tempo: "b.jatuh_tempo",
      periode: "b.periode",
      jumlah: "b.jumlah",
      sisa: "b.sisa",
      nama: "p.nama",
      kamar: "k.nomor",
    },
    order: p.order === "asc" ? "asc" : "desc",
    page: Number(p.page || 1),
    limit: Number(p.limit || 10),
  });
}

export async function ambilRiwayatBayar(p: PaginasiParams): Promise<Paginated<BarisRiwayat>> {
  await wajibSesi();
  return q.paginan({
    table: "riwayat_bayar r",
    select: "r.id, r.tagihan_id, p.nama, k.nomor AS kamar, b.periode, r.jumlah, r.metode, r.tanggal, r.catatan",
    joins: "JOIN penyewa p ON p.id = r.penyewa_id LEFT JOIN kamar k ON k.id = p.kamar_id LEFT JOIN pembayaran b ON b.id = r.tagihan_id",
    search: p.search || "",
    searchCols: ["p.nama", "k.nomor", "b.periode", "r.metode"],
    sort: p.sort || "tanggal",
    sortWhitelist: ["tanggal", "jumlah", "nama"],
    sortMap: { id: "r.id", tanggal: "r.tanggal", jumlah: "r.jumlah", nama: "p.nama" },
    order: p.order === "asc" ? "asc" : "desc",
    page: Number(p.page || 1),
    limit: Number(p.limit || 10),
  });
}

export async function ambilPengeluaran(p: PaginasiParams): Promise<Paginated<BarisPengeluaran>> {
  await wajibSesi();
  return q.paginan({
    table: "pengeluaran x",
    select: "x.id, x.tgl, x.jumlah, x.keterangan, x.penerima, COALESCE(k.nama,'Tanpa kategori') AS kategori",
    joins: "LEFT JOIN kategori_pengeluaran k ON k.id = x.kategori_id",
    search: p.search || "",
    searchCols: ["x.keterangan", "x.penerima", "k.nama"],
    sort: p.sort || "tgl",
    sortWhitelist: ["tgl", "jumlah", "keterangan"],
    sortMap: { id: "x.id", tgl: "x.tgl", jumlah: "x.jumlah", keterangan: "x.keterangan" },
    order: p.order === "asc" ? "asc" : "desc",
    page: Number(p.page || 1),
    limit: Number(p.limit || 10),
  });
}

export async function ambilAktivitas(p: PaginasiParams): Promise<Paginated<BarisAktivitas>> {
  await wajibSesi();
  return q.paginan({
    table: "aktivitas a",
    select: "a.id, a.aksi, a.detail, a.ip, a.dibuat_pada, COALESCE(u.nama,'Sistem') AS nama",
    joins: "LEFT JOIN pengguna u ON u.id = a.pengguna_id",
    search: p.search || "",
    searchCols: ["a.aksi", "a.detail", "u.nama"],
    sort: p.sort || "id",
    sortWhitelist: ["id", "aksi", "dibuat_pada"],
    sortMap: { id: "a.id", aksi: "a.aksi", dibuat_pada: "a.dibuat_pada" },
    order: p.order === "asc" ? "asc" : "desc",
    page: Number(p.page || 1),
    limit: Number(p.limit || 10),
  });
}

/** Detail riwayat pembayaran satu tagihan (untuk modal kwitansi). */
export async function ambilRiwayatTagihan(tagihanId: number): Promise<BarisRincianBayar[]> {
  await wajibSesi();
  return q.paginan({
    table: "riwayat_bayar r",
    select: "r.id, r.jumlah, r.metode, r.tanggal, r.catatan",
    where: ["r.tagihan_id = ?"],
    params: [Number(tagihanId)],
    sort: "tanggal",
    sortWhitelist: ["tanggal"],
    order: "desc",
    page: 1,
    limit: 50,
  }).data as BarisRincianBayar[];
}
