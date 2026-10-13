/**
 * AWG-KOSKU — regression lock query paginasi server-side.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Kunci temuan produksi: "ambiguous column name" muncul HANYA pada sort
 * tertentu (mis. riwayat.sort=jumlah karena r.jumlah vs b.jumlah), jadi uji
 * parsial terlihat hijau sementara pengguna asli kena error 500.
 *
 * Test ini mengeksekusi SEMUA kunci sortWhitelist + fallback + kunci asing
 * untuk SETIAP fetcher. Konfigurasi di bawah harus SINKRON dengan
 * src/actions/data.ts (ambilTagihan/ambilRiwayatBayar/ambilPengeluaran/
 * ambilAktivitas) dan src/lib/db.ts (daftarPenyewaPaginated) — kalau query
 * di sana berubah, ubah juga di sini.
 *
 * Juga mengunci: row node:sqlite harus ber-prototype Object biasa (bukan
 * null) supaya React Flight mau meneruskannya ke Client Component.
 *
 * Jalankan: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { bukaDb, migrasi, paginatedQuery, polos } from "../src/lib/core/db.mjs";

const dir = mkdtempSync(join(tmpdir(), "kosku-paginasi-"));
const db = bukaDb(join(dir, "uji.sqlite"));
migrasi(db);
test.after?.(() => rmSync(dir, { recursive: true, force: true }));

// Seed minimal supaya tiap halaman punya baris.
db.prepare(
  "INSERT INTO kamar (nomor, tipe, lantai, tarif, status) VALUES ('A1','Std',1,100000,'terisi')",
).run();
const kar = db
  .prepare("INSERT INTO penyewa (nama, telepon, kamar_id, tanggal_masuk, status) VALUES ('Uji','0812',1,'2026-01-01','aktif')")
  .run();
const penyewaId = Number(kar.lastInsertRowid);
const tag = db
  .prepare("INSERT INTO pembayaran (penyewa_id, periode, jatuh_tempo, jumlah) VALUES (?,'2026-01','2026-01-05',500000)")
  .run(penyewaId);
db.prepare(
  "INSERT INTO riwayat_bayar (tagihan_id, penyewa_id, jumlah, metode, tanggal) VALUES (?,?,'200000','tunai','2026-01-10')",
).run(Number(tag.lastInsertRowid), penyewaId);
db.prepare("INSERT INTO pengeluaran (tgl, jumlah, keterangan, penerima) VALUES ('2026-01-02',50000,'listrik','PLN')").run();
db.prepare("INSERT INTO aktivitas (aksi, detail, ip) VALUES ('uji','regression lock','127.0.0.1')").run();

/** Replika konfigurasi fetcher — SINKRON dengan data.ts / db.ts. */
const FETCHER = {
  tagihan: {
    table: "pembayaran b",
    select: "b.id, p.nama, p.telepon, k.nomor AS kamar, b.periode, b.jatuh_tempo, b.jumlah, b.terbayar, b.sisa, b.status, b.dibayar_pada, b.metode",
    joins: "JOIN penyewa p ON p.id = b.penyewa_id LEFT JOIN kamar k ON k.id = p.kamar_id",
    sortWhitelist: ["jatuh_tempo", "periode", "jumlah", "sisa", "nama", "kamar"],
    sortMap: { id: "b.id", jatuh_tempo: "b.jatuh_tempo", periode: "b.periode", jumlah: "b.jumlah", sisa: "b.sisa", nama: "p.nama", kamar: "k.nomor" },
  },
  riwayat: {
    table: "riwayat_bayar r",
    select: "r.id, r.tagihan_id, p.nama, k.nomor AS kamar, b.periode, r.jumlah, r.metode, r.tanggal, r.catatan",
    joins: "JOIN penyewa p ON p.id = r.penyewa_id LEFT JOIN kamar k ON k.id = p.kamar_id LEFT JOIN pembayaran b ON b.id = r.tagihan_id",
    sortWhitelist: ["tanggal", "jumlah", "nama"],
    sortMap: { id: "r.id", tanggal: "r.tanggal", jumlah: "r.jumlah", nama: "p.nama" },
  },
  pengeluaran: {
    table: "pengeluaran x",
    select: "x.id, x.tgl, x.jumlah, x.keterangan, x.penerima, COALESCE(k.nama,'Tanpa kategori') AS kategori",
    joins: "LEFT JOIN kategori_pengeluaran k ON k.id = x.kategori_id",
    sortWhitelist: ["tgl", "jumlah", "keterangan"],
    sortMap: { id: "x.id", tgl: "x.tgl", jumlah: "x.jumlah", keterangan: "x.keterangan" },
  },
  aktivitas: {
    table: "aktivitas a",
    select: "a.id, a.aksi, a.detail, a.ip, a.dibuat_pada, COALESCE(u.nama,'Sistem') AS nama",
    joins: "LEFT JOIN pengguna u ON u.id = a.pengguna_id",
    sortWhitelist: ["id", "aksi", "dibuat_pada"],
    sortMap: { id: "a.id", aksi: "a.aksi", dibuat_pada: "a.dibuat_pada" },
  },
  penyewa: {
    table: "penyewa",
    select: "penyewa.id,penyewa.nama,penyewa.telepon,penyewa.kamar_id,kamar.nomor as kamar,penyewa.tanggal_masuk,penyewa.status,(SELECT COUNT(*) FROM pembayaran p WHERE p.penyewa_id=penyewa.id AND p.dibayar_pada IS NULL) as tagihan_terbuka",
    joins: "LEFT JOIN kamar ON kamar.id=penyewa.kamar_id",
    sortWhitelist: ["id", "nama", "kamar", "tanggal_masuk", "status"],
    sortMap: { id: "penyewa.id", nama: "penyewa.nama", kamar: "kamar.nomor", tanggal_masuk: "penyewa.tanggal_masuk", status: "penyewa.status" },
  },
};

test("SEMUA kunci sort tiap fetcher tidak melempar error SQL", () => {
  const kunciAsing = ["id", "status", "tanggal", "bogus-sort"];
  let total = 0;
  for (const [nama, cfg] of Object.entries(FETCHER)) {
    for (const s of [...cfg.sortWhitelist, ...kunciAsing]) {
      total++;
      assert.doesNotThrow(
        () => paginatedQuery(db, { ...cfg, sort: s, page: 1, limit: 5 }),
        `fetcher=${nama} sort=${s}`,
      );
    }
  }
  assert.ok(total >= 35, "minimal 40 kombinasi harus diuji");
});

test("row keluar sebagai objek biasa (bukan null-prototype)", () => {
  const keluar = ["tagihan", "riwayat", "pengeluaran", "aktivitas", "penyewa"];
  for (const nama of keluar) {
    const out = paginatedQuery(db, { ...FETCHER[nama], sort: "id", page: 1, limit: 5 });
    assert.ok(out.data.length > 0, `${nama} punya baris`);
    for (const row of out.data) {
      assert.notEqual(Object.getPrototypeOf(row), null, `${nama}: null-prototype lolos ke klien`);
    }
  }
});

test("polos() mengkonversi null-prototype dan mempertahankan nilai", () => {
  const raw = Object.create(null);
  raw.id = 4;
  raw.nama = "B2";
  const hasil = polos(raw);
  assert.equal(Object.getPrototypeOf(hasil), Object.prototype);
  assert.equal(hasil.id, 4);
  assert.equal(hasil.nama, "B2");
  assert.equal(polos(null), null);
});
