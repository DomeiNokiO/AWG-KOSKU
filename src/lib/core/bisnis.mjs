import { polos } from "./db.mjs";


/* =========================================================================
   Transaksi & laporan — modul bisnis kos
   ========================================================================= */

/**
 * Bayar sebagian (parsial). Menyimpan pembayaran baru lalu menghitung ulang
 * sisa tagihan. Idempoten terhadap tagihan lunas: bayar tagihan lunas = no-op.
 * @returns { lunas: boolean, sisa: number, terbayar: number }
 */
export function bayarTagihan(db, { tagihanId, jumlah, metode = "tunai", tanggal = null, penggunaId = null, catatan = "" }) {
  const id = Number(tagihanId);
  const jml = Number(jumlah);
  if (!Number.isFinite(jml) || jml <= 0) throw new Error("Jumlah bayar harus lebih dari nol.");

  db.exec("BEGIN IMMEDIATE");
  try {
    const tagihan = db.prepare("SELECT id, penyewa_id, jumlah AS total, terbayar, sisa, status FROM pembayaran WHERE id = ?").get(id);
    if (!tagihan) throw new Error("Tagihan tidak ditemukan.");
    if (tagihan.status === "lunas") { db.exec("COMMIT"); return { lunas: true, sisa: 0, terbayar: tagihan.total }; }

    const sisaSekarang = Number(tagihan.total) - Number(tagihan.terbayar);
    if (jml > sisaSekarang) {
      // Tolak kelebihan bayar: uang nyata tidak boleh melebihi tagihan tanpa
      // mekanisme kredit/kembalian yang eksplisit.
      throw new Error(`Jumlah bayar melebihi sisa tagihan (sisa ${sisaSekarang}).`);
    }

    const metodeSah = ["tunai", "transfer", "qris", "deposit"];
    const metodeAkhir = metodeSah.includes(metode) ? metode : "tunai";

    db.prepare(
      `INSERT INTO riwayat_bayar (tagihan_id, penyewa_id, jumlah, metode, tanggal, dicatat_oleh, catatan)
       VALUES (?, ?, ?, ?, COALESCE(?, date('now')), ?, ?)`,
    ).run(id, tagihan.penyewa_id, jml, metodeAkhir, tanggal, penggunaId, catatan);

    const terbayarBaru = Number(tagihan.terbayar) + jml;
    const sisaBaru = Math.max(0, Number(tagihan.total) - terbayarBaru);
    const statusBaru = sisaBaru === 0 ? "lunas" : "terbuka";
    // Saat lunas, isi juga `dibayar_pada` (dipakai riwayat/kwitansi lama).
    db.prepare(
      "UPDATE pembayaran SET terbayar = ?, sisa = ?, status = ?, dibayar_pada = COALESCE(dibayar_pada, ?) WHERE id = ?",
    ).run(terbayarBaru, sisaBaru, statusBaru, sisaBaru === 0 ? (tanggal || new Date().toISOString().slice(0, 10)) : null, id);
    db.exec("COMMIT");
    return { lunas: statusBaru === "lunas", sisa: sisaBaru, terbayar: terbayarBaru };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/** Batalkan satu riwayat pembayaran & hitung ulang sisa tagihan. */
export function batalkanBayar(db, riwayatId, penggunaId = null) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = db.prepare("SELECT id, tagihan_id, jumlah FROM riwayat_bayar WHERE id = ?").get(Number(riwayatId));
    if (!r) { db.exec("ROLLBACK"); return false; }
    const t = db.prepare("SELECT id, jumlah AS total FROM pembayaran WHERE id = ?").get(r.tagihan_id);
    db.prepare("DELETE FROM riwayat_bayar WHERE id = ?").run(r.id);
    if (t) {
      const sisa = db.prepare("SELECT COALESCE(SUM(jumlah),0) AS s FROM riwayat_bayar WHERE tagihan_id = ?").get(t.id).s;
      db.prepare("UPDATE pembayaran SET terbayar = ?, sisa = ?, status = ? WHERE id = ?")
        .run(sisa, Math.max(0, t.total - sisa), sisa >= t.total ? "lunas" : "terbuka", t.id);
    }
    // Jejak audit: pembatalan pembayaran wajib meninggalkan siapa pembatalnya.
    catatAktivitas(db, {
      penggunaId,
      aksi: "pembayaran.dibatalkan",
      detail: `riwayat #${r.id} (tagihan #${r.tagihan_id}, ${r.jumlah})`,
    });
    db.exec("COMMIT");
    return true;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/**
 * Generate tagihan massal satu periode. Idempoten: (penyewa, periode) sudah
 * ada dilewati — klik dua kali tidak menggandakan tagihan.
 * @returns { dibuat: number, dilewati: number }
 */
export function generateTagihan(db, { periode, jatuhTempo, metodeBasis = "kamar", jumlahTambahan = 0 }) {
  if (!/^\d{4}-\d{2}$/.test(String(periode))) throw new Error("Periode harus berformat YYYY-MM.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(jatuhTempo))) throw new Error("Jatuh tempo harus berformat YYYY-MM-DD.");
  const aktif = db.prepare(
    `SELECT p.id AS penyewa_id, k.tarif
       FROM penyewa p LEFT JOIN kamar k ON k.id = p.kamar_id
      WHERE p.status = 'aktif'`,
  ).all().map(polos);

  const cek = db.prepare("SELECT 1 FROM pembayaran WHERE penyewa_id = ? AND periode = ?");
  const simpan = db.prepare(
    `INSERT INTO pembayaran (penyewa_id, periode, jatuh_tempo, jumlah, terbayar, sisa, status, catatan)
     VALUES (?, ?, ?, ?, 0, ?, 'terbuka', ?)`,
  );

  let dibuat = 0, dilewati = 0;
  for (const row of aktif) {
    if (cek.get(row.penyewa_id, periode)) { dilewati += 1; continue; }
    const basis = metodeBasis === "tetap" ? Number(jumlahTambahan) : Number(row.tarif || 0) + Number(jumlahTambahan);
    const jumlah = Math.max(0, basis);
    simpan.run(row.penyewa_id, periode, jatuhTempo, jumlah, jumlah, `Generate ${periode}`);
    dibuat += 1;
  }
  return { dibuat, dilewati };
}

/** Denda keterlambatan: Rp X/hari sejak jatuh tempo, hanya untuk tagihan terbuka. */
export function hitungDenda(db, dendaPerHari = 0, hariIni = null) {
  // Konfigurasi di denda_konfig yang menentukan; argumen hanya fallback
  // untuk pemanggil lama yang tidak menyimpan konfig.
  const kfg = db.prepare("SELECT denda_per_hari, batas_gratis FROM denda_konfig WHERE aktif = 1 ORDER BY id DESC LIMIT 1").get();
  const perHari = kfg ? Number(kfg.denda_per_hari) : Number(dendaPerHari);
  if (!perHari) return [];
  const gratis = kfg ? Number(kfg.batas_gratis) : 0;
  const tgl = hariIni || new Date().toISOString().slice(0, 10);
  return db.prepare(
    `SELECT b.id, p.nama, k.nomor AS kamar, b.periode, b.jatuh_tempo, b.sisa,
            CAST(julianday(?) - julianday(b.jatuh_tempo) AS INTEGER) AS telat_hari
       FROM pembayaran b
       JOIN penyewa p ON p.id = b.penyewa_id
  LEFT JOIN kamar k ON k.id = p.kamar_id
      WHERE b.status = 'terbuka' AND date(b.jatuh_tempo) < date(?)`,
  ).all(tgl, tgl)
   .map(polos)
    .map((r) => ({ ...r, denda: Math.max(0, Number(r.telat_hari) - gratis) * perHari }))
   .filter((r) => r.denda > 0);
}

/* ------------------------------------------------------------ Konfig Denda */

export function bacaKonfigDenda(db) {
  const r = db.prepare("SELECT id, aktif, denda_per_hari, batas_gratis FROM denda_konfig ORDER BY id DESC LIMIT 1").get();
  return r || { id: 0, aktif: 1, denda_per_hari: 0, batas_gratis: 0 };
}
export function simpanKonfigDenda(db, { aktif = 1, denda_per_hari = 0, batas_gratis = 0 }) {
  const ada = db.prepare("SELECT id FROM denda_konfig ORDER BY id DESC LIMIT 1").get();
  if (ada) {
    db.prepare("UPDATE denda_konfig SET aktif = ?, denda_per_hari = ?, batas_gratis = ? WHERE id = ?")
      .run(aktif ? 1 : 0, denda_per_hari, batas_gratis, ada.id);
  } else {
    db.prepare("INSERT INTO denda_konfig (aktif, denda_per_hari, batas_gratis) VALUES (?, ?, ?)")
      .run(aktif ? 1 : 0, denda_per_hari, batas_gratis);
  }
}

/* ---------------------------------------------------------------- Pengeluaran */

export function daftarKategoriPengeluaran(db) {
  return db.prepare("SELECT id, nama, aktif FROM kategori_pengeluaran ORDER BY nama COLLATE NOCASE").all().map(polos);
}
export function simpanKategoriPengeluaran(db, nama) {
  const info = db.prepare("INSERT INTO kategori_pengeluaran (nama) VALUES (?) ON CONFLICT(nama) DO UPDATE SET aktif = 1").run(String(nama).trim());
  return Number(info.lastInsertRowid);
}
export function hapusKategoriPengeluaran(db, id) {
  return Number(db.prepare("UPDATE kategori_pengeluaran SET aktif = 0 WHERE id = ?").run(Number(id)).changes) > 0;
}
export function simpanPengeluaran(db, { kategoriId, tgl, jumlah, keterangan, penerima = "", bukti = "", penggunaId = null }) {
  const info = db.prepare(
    `INSERT INTO pengeluaran (kategori_id, tgl, jumlah, keterangan, penerima, bukti, dicatat_oleh)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(kategoriId ? Number(kategoriId) : null, tgl, Number(jumlah), keterangan, penerima, bukti, penggunaId);
  return Number(info.lastInsertRowid);
}
export function hapusPengeluaran(db, id) {
  return Number(db.prepare("DELETE FROM pengeluaran WHERE id = ?").run(Number(id)).changes) > 0;
}

/** Laporan arus kas: total pemasukan vs pengeluaran per rentang tanggal. */
export function arusKas(db, { dari, sampai }) {
  const pemasukan = db.prepare(
    "SELECT COALESCE(SUM(jumlah),0) AS total FROM riwayat_bayar WHERE date(tanggal) BETWEEN ? AND ?",
  ).get(dari, sampai).total;
  const pengeluaran = db.prepare(
    "SELECT COALESCE(SUM(jumlah),0) AS total FROM pengeluaran WHERE date(tgl) BETWEEN ? AND ?",
  ).get(dari, sampai).total;
  const perKategori = db.prepare(
    `SELECT COALESCE(k.nama,'Tanpa kategori') AS kategori, SUM(p.jumlah) AS total
       FROM pengeluaran p LEFT JOIN kategori_pengeluaran k ON k.id = p.kategori_id
      WHERE date(p.tgl) BETWEEN ? AND ? GROUP BY kategori_id ORDER BY total DESC`,
  ).all(dari, sampai).map(polos);
  return { pemasukan, pengeluaran, bersih: pemasukan - pengeluaran, perKategori };
}

/** Aging tunggakan: dikelompokkan berdasar jumlah hari telat. */
export function agingTunggakan(db, hariIni = null) {
  const tgl = hariIni || new Date().toISOString().slice(0, 10);
  const baris = db.prepare(
    `SELECT b.id, p.nama, k.nomor AS kamar, b.periode, b.jatuh_tempo, b.sisa,
            CAST(julianday(?) - julianday(b.jatuh_tempo) AS INTEGER) AS telat_hari
       FROM pembayaran b
       JOIN penyewa p ON p.id = b.penyewa_id
  LEFT JOIN kamar k ON k.id = p.kamar_id
      WHERE b.status = 'terbuka'
      ORDER BY telat_hari DESC`,
  ).all(tgl).map(polos);
  const kelompok = { "1-7 hari": { jumlah: 0, total: 0 }, "8-30 hari": { jumlah: 0, total: 0 }, ">30 hari": { jumlah: 0, total: 0 } };
  for (const b of baris) {
    const h = Number(b.telat_hari);
    const k = h <= 7 ? "1-7 hari" : h <= 30 ? "8-30 hari" : ">30 hari";
    kelompok[k].jumlah += 1;
    kelompok[k].total += Number(b.sisa);
  }
  return { baris, kelompok };
}

/** Okupansi: jumlah kamar per status. */
export function okupansi(db) {
  return db.prepare("SELECT status, COUNT(*) AS jumlah FROM kamar GROUP BY status").all().map(polos);
}

/** Ringkasan pemasukan per bulan (termasuk pembayaran parsial). */
export function pemasukanPeriode(db, batas = 12) {
  return db.prepare(
    `SELECT substr(tanggal,1,7) AS periode, SUM(jumlah) AS total
       FROM riwayat_bayar GROUP BY periode ORDER BY periode DESC LIMIT ?`,
  ).all(batas).map(polos).reverse();
}

/* --------------------------------------------------------------- Pengaturan */

export function bacaPengaturan(db) {
  const rows = db.prepare("SELECT kunci, nilai FROM pengaturan_kos").all().map(polos);
  return Object.fromEntries(rows.map((r) => [r.kunci, r.nilai]));
}
export function simpanPengaturan(db, obj) {
  const st = db.prepare("INSERT INTO pengaturan_kos (kunci, nilai) VALUES (?, ?) ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai");
  for (const [k, v] of Object.entries(obj)) st.run(String(k), String(v ?? ""));
}

/* ---------------------------------------------------------------- Aktivitas */

export function catatAktivitas(db, { penggunaId = null, aksi, detail = "", ip = "" }) {
  db.prepare("INSERT INTO aktivitas (pengguna_id, aksi, detail, ip) VALUES (?, ?, ?, ?)")
    .run(penggunaId, aksi, detail, ip);
}
export function daftarAktivitas(db, batas = 50) {
  return db.prepare(
    `SELECT a.id, a.aksi, a.detail, a.dibuat_pada, u.nama
       FROM aktivitas a LEFT JOIN pengguna u ON u.id = a.pengguna_id
      ORDER BY a.id DESC LIMIT ?`,
  ).all(batas).map(polos);
}