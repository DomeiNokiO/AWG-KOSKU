/**
 * KOSKU-UI — lapisan data (node:sqlite).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Mengapa `node:sqlite`: modul SQLite sudah ada di dalam Node (>= 22), jadi
 * proyek ini nol dependensi native — cukup `npm install`, tanpa toolchain
 * kompilasi, tanpa server MySQL. Seluruh akses data terkurung di modul ini,
 * sehingga pindah ke Postgres/MySQL nanti tidak menyentuh komponen UI.
 *
 * Aturan yang tidak boleh dilanggar: setiap nilai dari pengguna hanya masuk
 * lewat *prepared statement* dengan parameter terikat (?). Tidak ada satu pun
 * string SQL yang disambung dari input pengguna.
 *
 * Modul ini bebas dari Next.js supaya bisa dijalankan `npm run seed` dan
 * diuji dengan `node --test`.
 */

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/* -------------------------------------------------------------------------
   Koneksi
   ------------------------------------------------------------------------- */

export function bukaDb(path) {
  // turbopackIgnore: jalur DB selalu di bawah process.cwd()/data — tracing statis tidak perlu.
  const full = resolve(process.cwd(), /* turbopackIgnore: true */ path);
  mkdirSync(dirname(full), { recursive: true });
  const db = new DatabaseSync(full);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  return db;
}

/* -------------------------------------------------------------------------
   Skema (idempoten — aman dijalankan berulang)
   ------------------------------------------------------------------------- */

export const SKEMA = `
CREATE TABLE IF NOT EXISTS pengguna (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nama        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  kata_sandi  TEXT NOT NULL,
  peran       TEXT NOT NULL DEFAULT 'pemilik',
  tier        TEXT NOT NULL DEFAULT 'free',
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kamar (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nomor  TEXT NOT NULL UNIQUE,
  tipe   TEXT NOT NULL DEFAULT 'Standar',
  lantai INTEGER NOT NULL DEFAULT 1,
  tarif  INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'kosong'
);

CREATE TABLE IF NOT EXISTS penyewa (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nama          TEXT NOT NULL,
  telepon       TEXT NOT NULL DEFAULT '',
  kamar_id      INTEGER REFERENCES kamar(id) ON DELETE SET NULL,
  tanggal_masuk TEXT NOT NULL DEFAULT (date('now')),
  status        TEXT NOT NULL DEFAULT 'aktif',
  dibuat_pada   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pembayaran (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  penyewa_id   INTEGER NOT NULL REFERENCES penyewa(id) ON DELETE CASCADE,
  periode      TEXT NOT NULL,
  jatuh_tempo  TEXT NOT NULL,
  jumlah       INTEGER NOT NULL DEFAULT 0,
  terbayar     INTEGER NOT NULL DEFAULT 0,
  sisa         INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'terbuka',
  dibayar_pada TEXT,
  metode       TEXT NOT NULL DEFAULT 'transfer',
  catatan      TEXT NOT NULL DEFAULT '',
  UNIQUE (penyewa_id, periode)
);

CREATE TABLE IF NOT EXISTS laporan_bug (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pelapor     TEXT NOT NULL DEFAULT '',
  halaman     TEXT NOT NULL DEFAULT '',
  judul       TEXT NOT NULL,
  isi         TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'baru',
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS catatan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  judul       TEXT NOT NULL,
  isi         TEXT NOT NULL DEFAULT '',
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bayar_status ON pembayaran (dibayar_pada, jatuh_tempo);
CREATE INDEX IF NOT EXISTS idx_penyewa_kamar ON penyewa (kamar_id);
CREATE INDEX IF NOT EXISTS idx_penyewa_status ON penyewa (status);

CREATE TABLE IF NOT EXISTS kategori_pengeluaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  aktif INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pengeluaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kategori_id INTEGER REFERENCES kategori_pengeluaran(id) ON DELETE SET NULL,
  tgl TEXT NOT NULL DEFAULT (date('now')),
  jumlah INTEGER NOT NULL DEFAULT 0,
  keterangan TEXT NOT NULL,
  penerima TEXT NOT NULL DEFAULT '',
  bukti TEXT NOT NULL DEFAULT '',
  dicatat_oleh INTEGER,
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS denda_konfig (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  aktif INTEGER NOT NULL DEFAULT 1,
  denda_per_hari INTEGER NOT NULL DEFAULT 0,
  batas_gratis INTEGER NOT NULL DEFAULT 0,
  berlaku_mulai TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS pengaturan_kos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kunci TEXT NOT NULL UNIQUE,
  nilai TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS aktivitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pengguna_id INTEGER REFERENCES pengguna(id) ON DELETE SET NULL,
  aksi TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS riwayat_bayar (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tagihan_id  INTEGER NOT NULL REFERENCES pembayaran(id) ON DELETE CASCADE,
  penyewa_id  INTEGER NOT NULL REFERENCES penyewa(id) ON DELETE CASCADE,
  jumlah      INTEGER NOT NULL DEFAULT 0,
  metode      TEXT NOT NULL DEFAULT 'tunai',
  tanggal     TEXT NOT NULL DEFAULT (date('now')),
  dicatat_oleh INTEGER REFERENCES pengguna(id) ON DELETE SET NULL,
  catatan     TEXT NOT NULL DEFAULT '',
  dibuat_pada TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pembayaran_jatuhtempo ON pembayaran (jatuh_tempo, dibayar_pada);
CREATE INDEX IF NOT EXISTS idx_riwayat_tanggal ON riwayat_bayar (tanggal);
CREATE INDEX IF NOT EXISTS idx_pengeluaran_tgl ON pengeluaran (tgl);
CREATE INDEX IF NOT EXISTS idx_aktivitas_dibuat ON aktivitas (dibuat_pada);
`;

export function migrasi(db) {
  db.exec(SKEMA);

  // DB lama (sebelum fitur bayar parsial) tidak punya kolom terbayar/sisa/status.
  // PRAGMA table_info dipakai supaya migrasi idempoten: jalan setiap boot tanpa error.
  const kolom = new Set(db.prepare("PRAGMA table_info(pembayaran)").all().map((c) => c.name));
  if (!kolom.has("terbayar")) db.exec("ALTER TABLE pembayaran ADD COLUMN terbayar INTEGER NOT NULL DEFAULT 0");
  if (!kolom.has("sisa")) db.exec("ALTER TABLE pembayaran ADD COLUMN sisa INTEGER NOT NULL DEFAULT 0");
  if (!kolom.has("status")) db.exec("ALTER TABLE pembayaran ADD COLUMN status TEXT NOT NULL DEFAULT 'terbuka'");

  // Backfill satu kali: tagihan lama yang sudah dibayar_pada = lunas.
  db.exec(
    `UPDATE pembayaran
        SET terbayar = CASE WHEN dibayar_pada IS NOT NULL THEN jumlah ELSE 0 END,
            sisa     = CASE WHEN dibayar_pada IS NOT NULL THEN 0 ELSE jumlah END,
            status   = CASE WHEN dibayar_pada IS NOT NULL THEN 'lunas' ELSE 'terbuka' END
      WHERE terbayar = 0 AND sisa = 0 AND status = 'terbuka'
         OR (dibayar_pada IS NOT NULL AND status = 'terbuka')`,
  );
}

/* -------------------------------------------------------------------------
   Pengguna & autentikasi
   ------------------------------------------------------------------------- */

export const PERAN_SAH = ["pemilik", "admin", "kasir"];
export const TIER_SAH = ["free", "pro", "bisnis"];

export function ambilPenggunaByEmail(db, email) {
  return db
    .prepare("SELECT id, nama, email, kata_sandi, peran, tier FROM pengguna WHERE email = ?")
    .get(String(email ?? "").trim().toLowerCase());
}

export function ambilPenggunaById(db, id) {
  return db
    .prepare("SELECT id, nama, email, kata_sandi, peran, tier FROM pengguna WHERE id = ?")
    .get(Number(id));
}

export function simpanPengguna(db, { nama, email, hash, peran = "pemilik", tier = "free" }) {
  db.prepare(
    "INSERT INTO pengguna (nama, email, kata_sandi, peran, tier) VALUES (?, ?, ?, ?, ?) " +
      "ON CONFLICT(email) DO UPDATE SET nama = excluded.nama, kata_sandi = excluded.kata_sandi, peran = excluded.peran",
  ).run(nama, String(email).toLowerCase(), hash, peran, tier);
  return ambilPenggunaByEmail(db, email);
}

/** Ganti kata sandi + hapus semua sesi lama secara implisit lewat TTL. */
export function gantiKataSandi(db, id, hash) {
  const info = db.prepare("UPDATE pengguna SET kata_sandi = ? WHERE id = ?").run(hash, Number(id));
  return Number(info.changes) > 0;
}

/* -------------------------------------------------------------------------
   Ringkasan dashboard
   ------------------------------------------------------------------------- */

export function kuotaUntukTier(tier) {
  if (tier === "bisnis") return 1000;
  if (tier === "pro") return 100;
  return 25;
}

export function ringkasan(db, tier = "free", bulan = new Date().toISOString().slice(0, 7)) {
  const satu = (sql, ...p) => Number(db.prepare(sql).get(...p)?.n ?? 0);

  const lunasBulanIni = satu(
    "SELECT COALESCE(SUM(jumlah),0) AS n FROM riwayat_bayar WHERE substr(tanggal,1,7) = ?",
    bulan,
  );
  const kamarTerisi = satu("SELECT COUNT(*) AS n FROM kamar WHERE status = 'terisi'");

  // Total pemasukan sepanjang waktu dari riwayat pembayaran (per pendukung parsial).
  const lunasTotal = satu("SELECT COALESCE(SUM(jumlah),0) AS n FROM riwayat_bayar");

  return {
    totalKamar: satu("SELECT COUNT(*) AS n FROM kamar"),
    kamarTerisi,
    kamarKosong: satu("SELECT COUNT(*) AS n FROM kamar WHERE status = 'kosong'"),
    kamarPerbaikan: satu("SELECT COUNT(*) AS n FROM kamar WHERE status = 'perbaikan'"),
    penyewaAktif: satu("SELECT COUNT(*) AS n FROM penyewa WHERE status = 'aktif'"),
    pemasukanBulanIni: lunasBulanIni,
    pemasukanTotal: lunasTotal,
    tunggakan: satu(
      "SELECT COUNT(*) AS n FROM pembayaran WHERE status = 'terbuka' AND date(jatuh_tempo) < date('now')",
    ),
    tagihanTerbuka: satu("SELECT COUNT(*) AS n FROM pembayaran WHERE status = 'terbuka'"),
    omzetTertagih: satu("SELECT COALESCE(SUM(jumlah),0) AS n FROM pembayaran"),
    omzetTertagihBulanIni: satu(
      "SELECT COALESCE(SUM(jumlah),0) AS n FROM pembayaran WHERE substr(periode,1,7) = ?",
      bulan,
    ),
    bulan,
    tier,
    kuota: kuotaUntukTier(tier),
  };
}

export function pemasukanPerBulan(db, batas = 6) {
  const rows = db
    .prepare(
      `SELECT substr(tanggal,1,7) AS periode, COALESCE(SUM(jumlah),0) AS total
         FROM riwayat_bayar
        GROUP BY periode ORDER BY periode DESC LIMIT ?`,
    )
    .all(batas);
  return rows.reverse();
}

/* -------------------------------------------------------------------------
   Kamar
   ------------------------------------------------------------------------- */

export function daftarKamar(db) {
  return db
    .prepare("SELECT id, nomor, tipe, lantai, tarif, status FROM kamar ORDER BY lantai, nomor")
    .all();
}

export function ringkasKamar(db) {
  return db
    .prepare(
      `SELECT k.id, k.nomor, k.tipe, k.lantai, k.tarif, k.status,
              p.nama AS penyewa, p.id AS penyewa_id
         FROM kamar k
    LEFT JOIN penyewa p ON p.kamar_id = k.id AND p.status = 'aktif'
        ORDER BY k.lantai, k.nomor`,
    )
    .all();
}

export function cariKamarId(db, nomor) {
  const row = db.prepare("SELECT id FROM kamar WHERE nomor = ?").get(String(nomor ?? "").trim());
  return row ? Number(row.id) : null;
}

/** Jumlah kamar terisi dihitung ULANG dari tabel, bukan disimpan sebagai flag. */
export function sinkronStatusKamar(db) {
  db.exec(`
    UPDATE kamar SET status = 'terisi'
     WHERE id IN (SELECT kamar_id FROM penyewa WHERE status = 'aktif' AND kamar_id IS NOT NULL
                  GROUP BY kamar_id HAVING COUNT(*) >= 1)
       AND status != 'perbaikan';
    UPDATE kamar SET status = 'kosong'
     WHERE id NOT IN (SELECT kamar_id FROM penyewa WHERE status = 'aktif' AND kamar_id IS NOT NULL)
       AND status != 'perbaikan';
  `);
}

export function simpanKamar(db, { nomor, tipe, lantai, tarif, status = "kosong" }) {
  db.prepare(
    `INSERT INTO kamar (nomor, tipe, lantai, tarif, status) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(nomor) DO UPDATE SET tipe = excluded.tipe, lantai = excluded.lantai,
                                      tarif = excluded.tarif, status = excluded.status`,
  ).run(nomor, tipe, lantai, tarif, status);
  sinkronStatusKamar(db);
}

/* -------------------------------------------------------------------------
   Penyewa
   ------------------------------------------------------------------------- */

export function daftarPenyewa(db, { cari = "", status = "semua" } = {}) {
  const like = `%${String(cari).trim().toLowerCase()}%`;
  const kondisi = [];
  const params = [];
  if (String(cari).trim()) {
    kondisi.push("(lower(p.nama) LIKE ? OR lower(k.nomor) LIKE ? OR p.telepon LIKE ?)");
    params.push(like, like, like);
  }
  if (status !== "semua") {
    kondisi.push("p.status = ?");
    params.push(status);
  }
  const where = kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "";

  return db
    .prepare(
      `SELECT p.id, p.nama, p.telepon, p.tanggal_masuk, p.status,
              k.nomor AS kamar, k.tarif AS tarif, k.id AS kamar_id,
              (SELECT COALESCE(SUM(b.jumlah),0) FROM pembayaran b
                WHERE b.penyewa_id = p.id AND b.dibayar_pada IS NULL) AS tagihan_terbuka
         FROM penyewa p
    LEFT JOIN kamar k ON k.id = p.kamar_id
         ${where}
        ORDER BY p.status = 'aktif' DESC, p.nama COLLATE NOCASE`,
    )
    .all(...params);
}

export function simpanPenyewa(db, { nama, telepon, kamarId, tanggalMasuk, status = "aktif" }) {
  const info = db
    .prepare(
      "INSERT INTO penyewa (nama, telepon, kamar_id, tanggal_masuk, status) VALUES (?, ?, ?, ?, ?)",
    )
    .run(nama, telepon, kamarId ?? null, tanggalMasuk, status);
  sinkronStatusKamar(db);
  return Number(info.lastInsertRowid);
}

export function ubahStatusPenyewa(db, id, status) {
  const info = db.prepare("UPDATE penyewa SET status = ? WHERE id = ?").run(status, Number(id));
  sinkronStatusKamar(db);
  return Number(info.changes) > 0;
}

/* -------------------------------------------------------------------------
   Pembayaran
   ------------------------------------------------------------------------- */

export function tagihanBelumLunas(db, batas = 100) {
  return db
    .prepare(
      `SELECT b.id, p.nama, p.telepon, k.nomor AS kamar, b.periode, b.jatuh_tempo,
              b.jumlah, b.terbayar, b.sisa, b.status
         FROM pembayaran b
         JOIN penyewa p ON p.id = b.penyewa_id
    LEFT JOIN kamar k ON k.id = p.kamar_id
        WHERE b.status = 'terbuka'
        ORDER BY date(b.jatuh_tempo) ASC, p.nama COLLATE NOCASE
        LIMIT ?`,
    )
    .all(batas);
}

export function daftarPembayaran(db, { cari = "", status = "semua", periode = "" } = {}) {
  const like = `%${String(cari).trim().toLowerCase()}%`;
  const kondisi = [];
  const params = [];

  if (String(cari).trim()) {
    kondisi.push("(lower(p.nama) LIKE ? OR lower(k.nomor) LIKE ? OR lower(b.periode) LIKE ?)");
    params.push(like, like, like);
  }
  if (status === "lunas") kondisi.push("b.status = 'lunas'");
  if (status === "belum") kondisi.push("b.status = 'terbuka'");
  if (periode) {
    kondisi.push("b.periode = ?");
    params.push(periode);
  }

  const where = kondisi.length ? `WHERE ${kondisi.join(" AND ")}` : "";

  return db
    .prepare(
      `SELECT b.id, p.nama, p.id AS penyewa_id, k.nomor AS kamar, b.periode, b.jatuh_tempo,
              b.jumlah, b.terbayar, b.sisa, b.status, b.dibayar_pada, b.metode, b.catatan
         FROM pembayaran b
         JOIN penyewa p ON p.id = b.penyewa_id
    LEFT JOIN kamar k ON k.id = p.kamar_id
         ${where}
        ORDER BY date(COALESCE(b.dibayar_pada, b.jatuh_tempo)) DESC, b.id DESC`,
    )
    .all(...params);
}

export function simpanTagihan(db, { penyewaId, periode, jatuhTempo, jumlah, catatan = "" }) {
  const info = db
    .prepare(
      `INSERT INTO pembayaran (penyewa_id, periode, jatuh_tempo, jumlah, catatan)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(penyewa_id, periode) DO UPDATE SET jatuh_tempo = excluded.jatuh_tempo,
                                                      jumlah = excluded.jumlah,
                                                      catatan = excluded.catatan`,
    )
    .run(Number(penyewaId), periode, jatuhTempo, Number(jumlah), catatan);
  return Number(info.lastInsertRowid);
}

/** Tandai lunas. Syarat `dibayar_pada IS NULL` membuat aksi ini idempoten:
 *  klik dua kali tidak mengubah tanggal bayar yang sudah tercatat. */
export function tandaiLunas(db, id, metode = "transfer", tanggal = null) {
  const idNum = Number(id);
  const tgl = tanggal || new Date().toISOString().slice(0, 10);
  db.exec("BEGIN IMMEDIATE");
  try {
    const tagihan = db
      .prepare("SELECT id, penyewa_id, jumlah, terbayar FROM pembayaran WHERE id = ? AND dibayar_pada IS NULL")
      .get(idNum);
    if (!tagihan) { db.exec("ROLLBACK"); return false; }

    const sisaBayar = Math.max(0, Number(tagihan.jumlah) - Number(tagihan.terbayar || 0));
    db.prepare(
      `UPDATE pembayaran
          SET dibayar_pada = ?, metode = ?, terbayar = jumlah, sisa = 0, status = 'lunas'
        WHERE id = ?`,
    ).run(tgl, metode, idNum);

    // Catat sisa yang ditagih lunas supaya angka pemasukan tidak pernah
    // dihitung dari dua tabel dengan cara berbeda.
    if (sisaBayar > 0) {
      db.prepare(
        `INSERT INTO riwayat_bayar (tagihan_id, penyewa_id, jumlah, metode, tanggal, catatan)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(idNum, tagihan.penyewa_id, sisaBayar, metode, tgl, "Pelunasan penuh");
    }
    db.exec("COMMIT");
    return true;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function batalkanLunas(db, id) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("DELETE FROM riwayat_bayar WHERE tagihan_id = ?").run(Number(id));
    db.prepare(
      "UPDATE pembayaran SET dibayar_pada = NULL, terbayar = 0, sisa = jumlah, status = 'terbuka' WHERE id = ? AND dibayar_pada IS NOT NULL",
    ).run(Number(id));
    db.exec("COMMIT");
    return true;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function pembayaranTerbaru(db, batas = 8) {
  return daftarPembayaran(db).slice(0, batas);
}

/* -------------------------------------------------------------------------
   Catatan
   ------------------------------------------------------------------------- */

export function daftarCatatan(db, batas = 20) {
  return db
    .prepare("SELECT id, judul, isi, dibuat_pada FROM catatan ORDER BY id DESC LIMIT ?")
    .all(batas);
}

export function simpanCatatan(db, { judul, isi }) {
  const info = db.prepare("INSERT INTO catatan (judul, isi) VALUES (?, ?)").run(judul, isi);
  return Number(info.lastInsertRowid);
}

export function hapusCatatan(db, id) {
  const info = db.prepare("DELETE FROM catatan WHERE id = ?").run(Number(id));
  return Number(info.changes) > 0;
}

/* -------------------------------------------------------------------------
   Laporan bug
   ------------------------------------------------------------------------- */

export function daftarLaporanBug(db, batas = 20) {
  return db
    .prepare("SELECT id, pelapor, halaman, judul, isi, status, dibuat_pada FROM laporan_bug ORDER BY id DESC LIMIT ?")
    .all(batas);
}

export function simpanLaporanBug(db, { pelapor, halaman, judul, isi }) {
  const info = db
    .prepare("INSERT INTO laporan_bug (pelapor, halaman, judul, isi) VALUES (?, ?, ?, ?)")
    .run(pelapor, halaman, judul, isi);
  return Number(info.lastInsertRowid);
}

export function ubahStatusBug(db, id, status) {
  const info = db.prepare("UPDATE laporan_bug SET status = ? WHERE id = ?").run(status, Number(id));
  return Number(info.changes) > 0;
}

export function paginatedQuery(db, { table, select = "*", joins = "", where = [], params = [], search = "", searchCols = [], sort = "id", sortWhitelist = [], order = "desc", page = 1, limit = 10 }) {
  const p = [...params];
  let w = where.length ? " WHERE " + where.join(" AND ") : "";
  if (search && searchCols.length) {
    const swhere = searchCols.map((c) => c + " LIKE ?").join(" OR ");
    w = w ? w + " AND (" + swhere + ")" : " WHERE (" + swhere + ")";
    for (let i = 0; i < searchCols.length; i++) p.push("%" + search + "%");
  }
  const sortKey = (sortWhitelist.length && sortWhitelist.includes(sort)) ? sort : "id";
  const ord = order === "asc" ? "asc" : "desc";
  const offset = Math.max(0, (page - 1) * limit);
  const total = db.prepare("SELECT COUNT(*) as c FROM " + table + " " + joins + " " + w).get(...p).c;
  const data = db.prepare("SELECT " + select + " FROM " + table + " " + joins + " " + w + " ORDER BY " + sortKey + " " + ord + " LIMIT ? OFFSET ?").all(...p, limit, offset);
  return { data, total, page, limit, pages: Math.max(1, Math.ceil(total / Math.max(1, limit))), sort: sortKey, order: ord, search };
}
