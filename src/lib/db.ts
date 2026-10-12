import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { env } from "./env";
import * as core from "./core/db.mjs";
import * as bisnis from "./core/bisnis.mjs";

/**
 * KOSKU-UI — akses DB untuk komponen server.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Modul ini hanya menambahkan tiga hal di atas `core/db.mjs`: koneksi tunggal
 * (satu per proses), pembacaan path dari env, dan tipe baris yang eksplisit
 * untuk pemakaian TypeScript. Semua kueri tetap di core/db.mjs supaya bisa
 * diuji tanpa Next.js (`npm test`).
 *
 * `core/db.mjs` bertipe `any` saat di-import (berkas .mjs tanpa deklarasi),
 * jadi setiap pemanggilan di sini diberi tipe eksplisit — dengan begitu
 * kesalahan bentuk data tetap ketahuan saat `tsc`, bukan saat runtime.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const inti = core as unknown as Record<string, (...args: any[]) => any>;
const modul = bisnis as unknown as Record<string, (...args: any[]) => any>;
const konstanta = core as unknown as Record<string, string[]>;

let koneksi: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!koneksi) {
    koneksi = inti.bukaDb(env.dbPath) as DatabaseSync;
    inti.migrasi(koneksi);
  }
  return koneksi;
}

/* -------------------------------------------------------------------------
   Bentuk baris yang dipakai komponen
   ------------------------------------------------------------------------- */

export type BarisPengguna = {
  id: number;
  nama: string;
  email: string;
  kata_sandi: string;
  peran: string;
  tier: string;
};

export type Ringkasan = {
  totalKamar: number;
  kamarTerisi: number;
  kamarKosong: number;
  kamarPerbaikan: number;
  penyewaAktif: number;
  pemasukanBulanIni: number;
  pemasukanTotal: number;
  tunggakan: number;
  tagihanTerbuka: number;
  omzetTertagih: number;
  omzetTertagihBulanIni: number;
  bulan: string;
  tier: string;
  kuota: number;
};

export type KamarRingkas = {
  id: number;
  nomor: string;
  tipe: string;
  lantai: number;
  tarif: number;
  status: string;
  penyewa: string | null;
  penyewa_id: number | null;
};

export type PenyewaRingkas = {
  id: number;
  nama: string;
  telepon: string;
  tanggal_masuk: string;
  status: string;
  kamar: string | null;
  tarif: number | null;
  kamar_id: number | null;
  tagihan_terbuka: number;
};

export type PembayaranRingkas = {
  id: number;
  nama: string;
  penyewa_id: number;
  kamar: string | null;
  periode: string;
  jatuh_tempo: string;
  jumlah: number;
  dibayar_pada: string | null;
  metode: string;
  catatan: string;
};

export type TagihanTempo = {
  id: number;
  nama: string;
  telepon: string;
  kamar: string | null;
  periode: string;
  jatuh_tempo: string;
  jumlah: number;
};

export type BarisCatatan = { id: number; judul: string; isi: string; dibuat_pada: string };

export type BarisBug = {
  id: number;
  pelapor: string;
  halaman: string;
  judul: string;
  isi: string;
  status: string;
  dibuat_pada: string;
};

export type InputKamar = { nomor: string; tipe: string; lantai: number; tarif: number; status?: string };
export type InputPenyewa = {
  nama: string;
  telepon: string;
  kamarId: number | null;
  tanggalMasuk: string;
  status?: string;
};
export type InputTagihan = {
  penyewaId: number;
  periode: string;
  jatuhTempo: string;
  jumlah: number;
  catatan?: string;
};

/* -------------------------------------------------------------------------
   Kueri
   ------------------------------------------------------------------------- */

export const q = {
  penggunaByEmail: (email: string) => inti.ambilPenggunaByEmail(getDb(), email) as BarisPengguna | undefined,
  penggunaById: (id: number) => inti.ambilPenggunaById(getDb(), id) as BarisPengguna | undefined,
  gantiKataSandi: (id: number, hash: string) => inti.gantiKataSandi(getDb(), id, hash) as boolean,

  ringkasan: (tier: string) => inti.ringkasan(getDb(), tier) as Ringkasan,
  pemasukanPerBulan: (n = 6) => inti.pemasukanPerBulan(getDb(), n) as { periode: string; total: number }[],

  ringkasKamar: () => inti.ringkasKamar(getDb()) as KamarRingkas[],
  daftarKamar: () => inti.daftarKamar(getDb()) as Omit<KamarRingkas, "penyewa" | "penyewa_id">[],
  cariKamarId: (nomor: string) => inti.cariKamarId(getDb(), nomor) as number | null,
  simpanKamar: (data: InputKamar) => inti.simpanKamar(getDb(), data) as void,
  sinkronStatusKamar: () => inti.sinkronStatusKamar(getDb()) as void,

  daftarPenyewa: (opt: { cari?: string; status?: string } = {}) => inti.daftarPenyewa(getDb(), opt) as PenyewaRingkas[],
  simpanPenyewa: (data: InputPenyewa) => inti.simpanPenyewa(getDb(), data) as number,
  ubahStatusPenyewa: (id: number, status: string) => inti.ubahStatusPenyewa(getDb(), id, status) as boolean,

  tagihanBelumLunas: (batas = 100) => inti.tagihanBelumLunas(getDb(), batas) as TagihanTempo[],
  daftarPembayaran: (opt: { cari?: string; status?: string; periode?: string } = {}) =>
    inti.daftarPembayaran(getDb(), opt) as PembayaranRingkas[],
  simpanTagihan: (data: InputTagihan) => inti.simpanTagihan(getDb(), data) as number,
  tandaiLunas: (id: number, metode = "transfer") => inti.tandaiLunas(getDb(), id, metode) as boolean,
  batalkanLunas: (id: number) => inti.batalkanLunas(getDb(), id) as boolean,
  pembayaranTerbaru: (n = 8) => inti.pembayaranTerbaru(getDb(), n) as PembayaranRingkas[],

  daftarCatatan: (n = 20) => inti.daftarCatatan(getDb(), n) as BarisCatatan[],
  simpanCatatan: (data: { judul: string; isi: string }) => inti.simpanCatatan(getDb(), data) as number,
  hapusCatatan: (id: number) => inti.hapusCatatan(getDb(), id) as boolean,

  daftarLaporanBug: (n = 20) => inti.daftarLaporanBug(getDb(), n) as BarisBug[],
  simpanLaporanBug: (data: { pelapor: string; halaman: string; judul: string; isi: string }) =>
    inti.simpanLaporanBug(getDb(), data) as number,
  ubahStatusBug: (id: number, status: string) => inti.ubahStatusBug(getDb(), id, status) as boolean,

  /* ---- Modul bisnis (core/bisnis.mjs): bayar parsial, generate, laporan ---- */
  bayarTagihan: (data: { tagihanId: number; jumlah: number; metode?: string; tanggal?: string | null; penggunaId?: number | null; catatan?: string }) =>
    modul.bayarTagihan(getDb(), data) as { lunas: boolean; sisa: number; terbayar: number },
  batalkanBayar: (riwayatId: number, penggunaId?: number | null) => modul.batalkanBayar(getDb(), riwayatId, penggunaId) as boolean,
  generateTagihan: (data: { periode: string; jatuhTempo: string; metodeBasis?: string; jumlahTambahan?: number }) =>
    modul.generateTagihan(getDb(), data) as { dibuat: number; dilewati: number },
  hitungDenda: (dendaPerHari?: number) => modul.hitungDenda(getDb(), dendaPerHari ?? 0) as { id: number; nama: string; kamar: string | null; periode: string; jatuh_tempo: string; sisa: number; telat_hari: number; denda: number }[],
  daftarKategoriPengeluaran: () => modul.daftarKategoriPengeluaran(getDb()) as { id: number; nama: string; aktif: number }[],
  simpanKategoriPengeluaran: (nama: string) => modul.simpanKategoriPengeluaran(getDb(), nama) as number,
  hapusKategoriPengeluaran: (id: number) => modul.hapusKategoriPengeluaran(getDb(), id) as boolean,
  simpanPengeluaran: (data: { kategoriId: number | null; tgl: string; jumlah: number; keterangan: string; penerima?: string; bukti?: string; penggunaId?: number | null }) =>
    modul.simpanPengeluaran(getDb(), data) as number,
  hapusPengeluaran: (id: number) => modul.hapusPengeluaran(getDb(), id) as boolean,
  arusKas: (opt: { dari: string; sampai: string }) => modul.arusKas(getDb(), opt) as { pemasukan: number; pengeluaran: number; bersih: number; perKategori: { kategori: string; total: number }[] },
  agingTunggakan: () => modul.agingTunggakan(getDb()) as { baris: { id: number; nama: string; kamar: string | null; periode: string; jatuh_tempo: string; sisa: number; telat_hari: number }[]; kelompok: Record<string, { jumlah: number; total: number }> },
  okupansi: () => modul.okupansi(getDb()) as { status: string; jumlah: number }[],
  pemasukanPeriode: (batas = 12) => modul.pemasukanPeriode(getDb(), batas) as { periode: string; total: number }[],
  bacaPengaturan: () => modul.bacaPengaturan(getDb()) as Record<string, string>,
  pengaturanKos: () => modul.bacaPengaturan(getDb()) as Record<string, string>,
  konfigDenda: () => modul.bacaKonfigDenda(getDb()) as { id: number; aktif: number; denda_per_hari: number; batas_gratis: number },
  simpanKonfigDenda: (data: { aktif?: number; denda_per_hari: number; batas_gratis: number }) => modul.simpanKonfigDenda(getDb(), data) as void,
  simpanPengaturan: (obj: Record<string, string>) => modul.simpanPengaturan(getDb(), obj) as void,
  catatAktivitas: (data: { penggunaId?: number | null; aksi: string; detail?: string; ip?: string }) => modul.catatAktivitas(getDb(), data) as void,
  daftarAktivitas: (batas = 50) => modul.daftarAktivitas(getDb(), batas) as { id: number; aksi: string; detail: string; dibuat_pada: string; nama: string | null }[],
  paginan: (params: any) => inti.paginatedQuery(getDb(), params) as any,
};

/** Daftar peran & tier yang sah — dipakai menolak nilai liar dari cookie. */
export const PERAN_SAH: readonly string[] = konstanta.PERAN_SAH;
export const TIER_SAH: readonly string[] = konstanta.TIER_SAH;
export type Peran = "pemilik" | "admin" | "kasir";

export function daftarPenyewaPaginated(
  params: import("./pagination").PaginasiParams = {},
): import("./pagination").Paginated<PenyewaRingkas> {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 10);
  const search = String(params.search || "");
  const sort = String(params.sort || "id");
  const order = params.order === "asc" ? "asc" : "desc";
  const status = typeof params.status === "string" ? params.status : "";
  return inti.paginatedQuery(getDb(), {
    table: "penyewa",
    // Kolom yang dimiliki dua tabel (status, id) WAJIB terkualifikasi —
    // "ambiguous column name" muncul di production padahal uji parsial OK.
    select: "penyewa.id,penyewa.nama,penyewa.telepon,penyewa.kamar_id,kamar.nomor as kamar,penyewa.tanggal_masuk,penyewa.status,(SELECT COUNT(*) FROM pembayaran p WHERE p.penyewa_id=penyewa.id AND p.dibayar_pada IS NULL) as tagihan_terbuka",
    joins: "LEFT JOIN kamar ON kamar.id=penyewa.kamar_id",
    where: status && status!=="semua" ? ["penyewa.status=?"] : [],
    params: status && status!=="semua" ? [status] : [],
    search,
    searchCols: ["penyewa.nama","penyewa.telepon","kamar.nomor"],
    sort,
    sortWhitelist: ["id","nama","kamar","tanggal_masuk","status"],
    sortMap: {
      id: "penyewa.id",
      nama: "penyewa.nama",
      kamar: "kamar.nomor",
      tanggal_masuk: "penyewa.tanggal_masuk",
      status: "penyewa.status",
    },
    order,
    page,
    limit,
  }) as import("./pagination").Paginated<PenyewaRingkas>;
}
