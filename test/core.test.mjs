/**
 * KOSKU-UI — uji inti bisnis (tanpa Next.js).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Semua query & aturan uang berada di src/lib/core/*.mjs supaya bisa diuji
 * langsung dengan `node --test` memakai DB SQLite sementara.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { bukaDb, migrasi, PERAN_SAH, TIER_SAH } from "../src/lib/core/db.mjs";
import {
  bayarTagihan,
  generateTagihan,
  hitungDenda,
  arusKas,
  agingTunggakan,
  okupansi,
  pemasukanPeriode,
  bacaPengaturan,
  simpanPengaturan,
  bacaKonfigDenda,
  simpanKonfigDenda,
  simpanPengeluaran,
  daftarKategoriPengeluaran,
  simpanKategoriPengeluaran,
} from "../src/lib/core/bisnis.mjs";
import { rupiah, parseRupiah, selisihHari, tambahBulan, normalCari } from "../src/lib/core/format.mjs";
import { wajibTeks, wajibInt, tanpaHtml, csvField, keCsv, ValidasiError } from "../src/lib/core/validate.mjs";

/** DB segar per suite: skema penuh tanpa menyentuh data produksi. */
function dbSegar() {
  const dir = mkdtempSync(join(tmpdir(), "kosku-test-"));
  const db = bukaDb(join(dir, "uji.sqlite"));
  migrasi(db);
  return { db, hapus: () => rmSync(dir, { recursive: true, force: true }) };
}

function isiContoh(db) {
  const kamar = db.prepare("INSERT INTO kamar (nomor, tarif, tipe, status) VALUES (?, ?, ?, 'kosong')");
  kamar.run("A-01", 850000, "Standar");
  kamar.run("A-02", 1200000, "Premium");
  const p = db.prepare("INSERT INTO penyewa (nama, telepon, kamar_id, status) VALUES (?, ?, ?, 'aktif')");
  p.run("Budi Santoso", "0812000001", 1);
  p.run("Siti Rahayu", "0812000002", 2);
}

test("skema & konstanta", () => {
  const { db, hapus } = dbSegar();
  try {
    const tabel = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name);
    for (const wajib of ["kamar", "penyewa", "pembayaran", "riwayat_bayar", "pengeluaran", "kategori_pengeluaran", "pengaturan_kos", "denda_konfig", "aktivitas"]) {
      assert.ok(tabel.includes(wajib), `tabel ${wajib} harus ada`);
    }
    assert.ok(PERAN_SAH.includes("pemilik"));
    assert.ok(TIER_SAH.includes("free"));
  } finally { hapus(); }
});

test("generate tagihan: idempoten per periode", () => {
  const { db, hapus } = dbSegar();
  try {
    isiContoh(db);
    const h1 = generateTagihan(db, { periode: "2026-09", jatuhTempo: "2026-09-05" });
    assert.equal(h1.dibuat, 2);
    assert.equal(h1.dilewati, 0);
    const h2 = generateTagihan(db, { periode: "2026-09", jatuhTempo: "2026-09-05" });
    assert.equal(h2.dibuat, 0, "periode sama tidak boleh dobel");
    assert.equal(h2.dilewati, 2);
  } finally { hapus(); }
});

test("bayar parsial: sisa berkurang, lunas saat 0", () => {
  const { db, hapus } = dbSegar();
  try {
    isiContoh(db);
    generateTagihan(db, { periode: "2026-09", jatuhTempo: "2026-09-05" });

    const b1 = bayarTagihan(db, { tagihanId: 1, jumlah: 500000, metode: "tunai" });
    assert.equal(b1.lunas, false);
    assert.equal(b1.sisa, 350000);

    const b2 = bayarTagihan(db, { tagihanId: 1, jumlah: 350000, metode: "transfer" });
    assert.equal(b2.lunas, true);
    assert.equal(b2.sisa, 0);

    // pembayaran melebihi sisa ditolak
    assert.throws(() => bayarTagihan(db, { tagihanId: 2, jumlah: 999999999, metode: "tunai" }), /melebihi sisa/);
    // riwayat dua baris untuk tagihan 1
    const rw = db.prepare("SELECT COUNT(*) AS n FROM riwayat_bayar WHERE tagihan_id = 1").get();
    assert.equal(Number(rw.n), 2);
  } finally { hapus(); }
});

test("pemasukan dihitung dari riwayat_bayar (bukan status tagihan)", () => {
  const { db, hapus } = dbSegar();
  try {
    isiContoh(db);
    generateTagihan(db, { periode: "2026-09", jatuhTempo: "2026-09-05" });
    const hariIni = new Date().toISOString().slice(0, 10);
    bayarTagihan(db, { tagihanId: 1, jumlah: 400000, metode: "qris" });

    const kas = arusKas(db, { dari: "2026-01-01", sampai: "2026-12-31" });
    assert.equal(kas.pemasukan, 400000);
    const per = pemasukanPeriode(db, 3);
    const bulanIni = per.find((r) => r.periode === hariIni.slice(0, 7));
    assert.ok(bulanIni && bulanIni.total === 400000, "pemasukan bulan berjalan harus ikut terhitung");
  } finally { hapus(); }
});

test("pengeluaran & arus kas per kategori", () => {
  const { db, hapus } = dbSegar();
  try {
    simpanKategoriPengeluaran(db, "Listrik");
    simpanKategoriPengeluaran(db, "Kebersihan");
    const kat = daftarKategoriPengeluaran(db);
    const idListrik = kat.find((k) => k.nama === "Listrik").id;
    const idKebersihan = kat.find((k) => k.nama === "Kebersihan").id;
    simpanPengeluaran(db, { kategoriId: idListrik, tgl: "2026-09-10", jumlah: 300000, keterangan: "Tagihan listrik" });
    simpanPengeluaran(db, { kategoriId: idListrik, tgl: "2026-09-11", jumlah: 150000, keterangan: "Perbaikan kipas" });
    simpanPengeluaran(db, { kategoriId: idKebersihan, tgl: "2026-09-12", jumlah: 100000, keterangan: "Gaji tukang" });

    const kas = arusKas(db, { dari: "2026-09-01", sampai: "2026-09-30" });
    assert.equal(kas.pengeluaran, 550000);
    const listrik = kas.perKategori.find((k) => k.kategori === "Listrik");
    assert.equal(listrik.total, 450000);
  } finally { hapus(); }
});

test("denda: grace period & konfig dari denda_konfig", () => {
  const { db, hapus } = dbSegar();
  try {
    isiContoh(db);
    // jatuh tempo 5 hari lalu, grace 2 hari -> denda 3 hari x 5000
    const lalu = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
    generateTagihan(db, { periode: "2026-08", jatuhTempo: lalu });
    simpanKonfigDenda(db, { aktif: 1, denda_per_hari: 5000, batas_gratis: 2 });
    const denda = hitungDenda(db);
    assert.equal(denda.length, 2);
    assert.equal(denda[0].denda, 15000);
    // nonaktif -> tidak ada denda
    simpanKonfigDenda(db, { aktif: 0, denda_per_hari: 5000, batas_gratis: 2 });
    assert.equal(hitungDenda(db).length, 0);
    assert.equal(bacaKonfigDenda(db).aktif, 0);
  } finally { hapus(); }
});

test("aging tunggakan mengelompokkan telat", () => {
  const { db, hapus } = dbSegar();
  try {
    isiContoh(db);
    const lalu = new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10);
    generateTagihan(db, { periode: "2026-06", jatuhTempo: lalu });
    const a = agingTunggakan(db);
    assert.equal(a.baris.length, 2);
    assert.ok(a.kelompok[">30 hari"].jumlah >= 1, "telat 40 hari harus masuk kelompok >30 hari");
    assert.ok(a.kelompok[">30 hari"].total > 0);
  } finally { hapus(); }
});

test("okupansi mengikuti status kamar", () => {
  const { db, hapus } = dbSegar();
  try {
    isiContoh(db);
    db.prepare("UPDATE kamar SET status = 'terisi' WHERE id = 1").run();
    const o = okupansi(db);
    const terisi = o.find((x) => x.status === "terisi");
    assert.equal(Number(terisi.jumlah), 1);
  } finally { hapus(); }
});

test("pengaturan key-value upsert", () => {
  const { db, hapus } = dbSegar();
  try {
    simpanPengaturan(db, { nama_kos: "Kos Harapan" });
    simpanPengaturan(db, { nama_kos: "Kos Harapan Indah" });
    const p = bacaPengaturan(db);
    assert.equal(p.nama_kos, "Kos Harapan Indah");
  } finally { hapus(); }
});

test("validasi: wajibTeks, wajibInt, tanpaHtml", () => {
  assert.throws(() => wajibTeks("", "Nama"), ValidasiError);
  assert.throws(() => wajibTeks("x".repeat(300), "Nama", { max: 10 }), ValidasiError);
  assert.equal(wajibTeks("  Budi  ", "Nama"), "Budi");
  assert.equal(wajibInt("12", "Jumlah", { min: 1 }), 12);
  assert.throws(() => wajibInt("12", "Jumlah", { min: 20 }), ValidasiError);
  assert.throws(() => wajibInt("abc", "Jumlah"), ValidasiError);
  // tanpaHtml hanya membuang kurung siku — pertahanan berlapis di sisi render.
  assert.equal(tanpaHtml("<script>alert(1)</script>"), "scriptalert(1)/script");
  assert.ok(!tanpaHtml("<img src=x onerror=alert(1)>").includes("<"));
});

test("csvField menetralkan formula & mengutip RFC 4180", () => {
  assert.equal(csvField("=1+1"), "'=1+1");
  assert.equal(csvField("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvField("budi, santoso"), '"budi, santoso"');
  assert.equal(csvField('kata "uang"'), '"kata ""uang"""');
  assert.equal(csvField(123), "123");
  const csv = keCsv(["a", "b"], [["x", "=cmd"], ["y", "z"]]);
  assert.ok(csv.includes("'=cmd"));
});

test("format: rupiah, tanggal, ribuan, parse", () => {
  assert.equal(rupiah(850000), "Rp 850.000");
  assert.equal(parseRupiah("850.000"), 850000);
  assert.equal(parseRupiah("Rp 1.200.000"), 1200000);
  const d = tambahBulan("2026-01-31", 1);
  assert.ok(d.startsWith("2026-02"), `tambahBulan harus rata bulan, dapat ${d}`);
  assert.equal(normalCari("  BUDI  "), "budi");
  // positif = masih ke depan; "2026-01-11" dari "2026-01-01" = 10 hari ke belakang.
  assert.equal(selisihHari("2026-01-21", new Date("2026-01-11T00:00:00Z")), 10);
  assert.equal(selisihHari("2026-01-01", new Date("2026-01-11T00:00:00Z")), -10);
});
