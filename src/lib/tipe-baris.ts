/**
 * KOSKU-UI — tipe baris hasil query.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Semua SELECT didefinisikan di src/lib/core/*.mjs (tanpa tipe). Berkas ini
 * adalah satu-satunya tempat bentuk barisnya dijanjikan untuk TypeScript, jadi
 * kalau kolom berubah di SQL, error tipe akan muncul di pemakai — bukan diam-diam
 * jadi `undefined` di runtime. `any` dilarang di sini: batas data harus ketat.
 */

import type { PenyewaRingkas } from "./db";

/** Baris tagihan (tabel pembayaran + join penyewa/kamar). */
export type BarisTagihan = {
  id: number;
  nama: string;
  telepon: string;
  kamar: string | null;
  periode: string;
  jatuh_tempo: string;
  jumlah: number;
  terbayar: number;
  sisa: number;
  status: string;
  dibayar_pada: string | null;
  metode: string;
};

/** Baris riwayat pembayaran (tabel riwayat_bayar + join). */
export type BarisRiwayat = {
  id: number;
  tagihan_id: number;
  nama: string;
  kamar: string | null;
  periode: string | null;
  jumlah: number;
  metode: string;
  tanggal: string;
  catatan: string;
};

/** Baris rincian pembayaran satu tagihan (modal kwitansi). */
export type BarisRincianBayar = {
  id: number;
  jumlah: number;
  metode: string;
  tanggal: string;
  catatan: string;
};

/** Baris pengeluaran (tabel pengeluaran + join kategori). */
export type BarisPengeluaran = {
  id: number;
  tgl: string;
  jumlah: number;
  keterangan: string;
  penerima: string;
  kategori: string;
};

/** Baris jejak audit (tabel aktivitas + join pengguna). */
export type BarisAktivitas = {
  id: number;
  aksi: string;
  detail: string;
  ip: string;
  dibuat_pada: string;
  nama: string;
};

/** Baris aging tunggakan (hasil core/bisnis.mjs#agingTunggakan). */
export type BarisAging = {
  id: number;
  nama: string;
  kamar: string | null;
  periode: string;
  jatuh_tempo: string;
  sisa: number;
  telat_hari: number;
};

/** Baris CSV riwayat pembayaran pada route ekspor. */
export type BarisCsvRiwayat = Pick<BarisRiwayat, "tanggal" | "nama" | "kamar" | "periode" | "jumlah" | "metode">;

export type { PenyewaRingkas };
