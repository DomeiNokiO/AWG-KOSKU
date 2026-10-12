/**
 * KOSKU-UI — seed database (npm run seed).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Membuat akun PEMILIK pertama + data contoh minimal supaya aplikasi bisa
 * dipakai langsung setelah clone. Idempoten: dijalankan dua kali tidak
 * menggandakan data (upsert email + cek jumlah).
 *
 * Pemakaian:
 *   npm run seed                              # akun pemilik (prompt sandi)
 *   EMAIL=a@b.c SANDI=... npm run seed        # non-interaktif (CI/dock)
 *   npm run seed -- --kosong                  # hanya tabel kosong yang diisi
 *
 * SANDI TIDAK PERNAH dicetak ke layar dan tidak ditulis ke file mana pun.
 */
import { createInterface } from "node:readline/promises";
import { bukaDb, migrasi, simpanPengguna, ambilPenggunaByEmail, daftarKamar } from "../src/lib/core/db.mjs";
import { hashKataSandi } from "../src/lib/core/password.mjs";

// Path sama dengan env.ts: KOSKU_DB_PATH atau ./data/kosku.sqlite.
const db = bukaDb(process.env.KOSKU_DB_PATH?.trim() || "./data/kosku.sqlite");
migrasi(db);

async function bacaSandi() {
  if (process.env.SANDI) return process.env.SANDI;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const a = await rl.question("Kata sandi pemilik (min 8): ");
    const b = await rl.question("Ulangi: ");
    if (a !== b) throw new Error("Sandi tidak sama.");
    return a;
  } finally {
    rl.close();
  }
}

const email = (process.env.EMAIL ?? "owner@kosku.test").toLowerCase();

if (ambilPenggunaByEmail(db, email)) {
  console.log(`Sudah ada akun ${email} — tidak diubah.`);
} else {
  const sandi = await bacaSandi();
  if (String(sandi).length < 8) {
    console.error("Sandi minimal 8 karakter.");
    process.exit(1);
  }
  const hash = await hashKataSandi(sandi);
  simpanPengguna(db, {
    nama: process.env.NAMA ?? "Pemilik Kos",
    email,
    hash,
    peran: "pemilik",
    tier: "pro",
  });
  console.log(`Akun pemilik dibuat: ${email}`);
}

// Data contoh hanya kalau kamar masih nol — aman diulang.
if (daftarKamar(db).length === 0) {
  const contoh = [
    { nomor: "A1", tipe: "Standard", lantai: 1, tarif: 850000 },
    { nomor: "A2", tipe: "Standard", lantai: 1, tarif: 850000 },
    { nomor: "B1", tipe: "Deluxe", lantai: 2, tarif: 1200000 },
    { nomor: "B2", tipe: "Deluxe", lantai: 2, tarif: 1200000 },
  ];
  for (const k of contoh) {
    db.prepare(
      "INSERT INTO kamar (nomor, tipe, lantai, tarif, status) VALUES (?, ?, ?, ?, 'kosong') " +
        "ON CONFLICT(nomor) DO NOTHING",
    ).run(k.nomor, k.tipe, k.lantai, k.tarif);
  }
  console.log(`${contoh.length} kamar contoh ditambahkan.`);
}

console.log("Seed selesai.");
