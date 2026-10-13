/**
 * AWG-KOSKU — regression lock matriks peran aksi keuangan (temuan audit #4).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Sebelum fix: tandaiLunasAction / batalkanLunasAction / tambahTagihanAction /
 * ubahStatusPenyewaAction / pelunasanPenuhAction hanya memanggil wajibSesi() —
 * kasir (pemegang token sesi sah) bisa bertindak setara pemilik untuk
 * operasi uang/status ini. Sekarang wajibPeran(["pemilik","admin"]).
 *
 * Kunci struktural: SEMUA aksi yang menulis data uang/status wajib punya
 * wajibPeran. Uji ini melintasi file aksi dan menggagalkan bila ada yang
 * lupa — menangkap regresi bila aksi uang baru ditambah tanpa matriks peran.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const iniDir = dirname(fileURLToPath(import.meta.url));
const aksiDir = resolve(iniDir, "../src/actions");

// "namaAksi -> file.ts" — aksi yang MENULIS uang/status/kontrak: wajib
// wajibPeran(["pemilik","admin"]). Tambahkan entri saat aksi baru muncul.
const WAJIB_PERAN = new Map([
  ["batalkanBayarAction", "keuangan.ts"], // pembatalan uang
  ["generateTagihanAction", "keuangan.ts"], // menciptakan utang massal
  ["simpanPengeluaranAction", "keuangan.ts"], // uang keluar
  ["hapusPengeluaranAction", "keuangan.ts"],
  ["simpanPengaturanAction", "keuangan.ts"], // pengaturan
  ["pelunasanPenuhAction", "keuangan.ts"], // pintasan lunas tunai — FIX audit #4
  ["tandaiLunasAction", "kosku.ts"], // pintasan lunas tanpa uang nyata — FIX #4
  ["batalkanLunasAction", "kosku.ts"], // membatalkan status lunas — FIX #4
  ["tambahTagihanAction", "kosku.ts"], // menciptakan utang — FIX #4
  ["ubahStatusPenyewaAction", "kosku.ts"], // status kamar & tanggungan — FIX #4
  ["simpanKamarAction", "kosku.ts"], // tarif & status kamar — FIX #4 (jaring pengaman)
  ["tambahPenyewaAction", "kosku.ts"], // mengikat kontrak sewa — FIX #4
  ["simpanPengeluaranAction", "keuangan.ts"], // uang keluar — FIX #4 (diperketat)
]);

// Aksi yang SENGAJA boleh dipakai kasir: tidak menulis uang, atau mencatat
// uang nyata dengan jejak audit (kasir memang tugas utamanya).
const BOLEH_KASIR = new Set([
  "bayarTagihanAction", // uang nyata + penggunaId di riwayat
  "simpanCatatanAction",
  "hapusCatatanAction",
  "kirimLaporanBugAction",
]);

const blokFungsi = (src, nama) => src.match(new RegExp(`export async function ${nama}\\b[\\s\\S]*?\\n\\}`, "m"))?.[0];

test("setiap aksi uang/status memakai wajibPeran(['pemilik','admin'])", () => {
  for (const [nama, f] of WAJIB_PERAN) {
    const src = readFileSync(resolve(aksiDir, f), "utf8");
    const blok = blokFungsi(src, nama);
    assert.ok(blok, `${f}: aksi ${nama} tidak ditemukan`);
    assert.match(
      blok,
      /await wajibPeran\(\["pemilik",\s*"admin"\]\)/,
      `${f}: ${nama} harus wajibPeran(["pemilik","admin"]) — kasir tidak boleh setara pemilik di sini`,
    );
  }
});

test("aksi yang memang tugas kasir tidak dibatasi peran", () => {
  for (const [f, nama] of [["keuangan.ts", "bayarTagihanAction"], ["kosku.ts", "simpanCatatanAction"], ["kosku.ts", "hapusCatatanAction"], ["kosku.ts", "kirimLaporanBugAction"]]) {
    const src = readFileSync(resolve(aksiDir, f), "utf8");
    const blok = blokFungsi(src, nama);
    assert.ok(blok, `${f}: aksi ${nama} tidak ditemukan`);
    assert.doesNotMatch(blok, /wajibPeran/, `${f}: ${nama} harus tetap bisa dipakai kasir`);
  }
});

test("tidak ada aksi uang/status baru yang lolos dari matriks peran", () => {
  // Jaring pengaman: seluruh fungsi aksi di src/actions yang menyentuh
  // uang/status wajib terdaftar (WAJIB_PERAN atau BOLEH_KASIR) atau punya
  // wajibPeran eksplisit. Aksi fetch (ambil*) dibiarkan: hanya wajibSesi.
  const sentuh = /q\.(tandaiLunas|batalkanLunas|simpanTagihan|ubahStatusPenyewa|batalkanBayar|generateTagihan|simpanPengeluaran|hapusPengeluaran|simpanPengaturan|bayarTagihan|simpanKamar|tambahPenyewa)/;
  for (const f of readdirSync(aksiDir).filter((x) => x.endsWith(".ts"))) {
    const src = readFileSync(resolve(aksiDir, f), "utf8");
    for (const m of src.matchAll(/export async function (\w+)\b/g)) {
      const nama = m[1];
      const blok = blokFungsi(src, nama) ?? "";
      if (!sentuh.test(blok)) continue;
      assert.ok(
        WAJIB_PERAN.has(nama) || BOLEH_KASIR.has(nama) || /wajibPeran/.test(blok),
        `${f}: ${nama} menyentuh uang/status tapi belum masuk matriks peran — periksa & tambahkan`,
      );
    }
  }
});
