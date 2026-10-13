/**
 * AWG-KOSKU — hashing kata sandi (scrypt).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Modul ini SENGAJA tidak punya dependensi ke Next.js supaya bisa diuji
 * langsung dengan `node --test test/`, tanpa proses build dan tanpa server.
 * Aturan yang sama berlaku untuk seluruh isi src/lib/core/.
 *
 * Format tersimpan: scrypt$N$r$p$<salt b64url>$<hash b64url>
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const PARAMS = { N: 16384, r: 8, p: 1 };
const KEYLEN = 64;
const SALT_BYTES = 16;

/** Batas atas parameter yang boleh datang dari baris tersimpan (anti-DoS). */
export const BATAS = { N: 1 << 15, r: 32, p: 16, memori: 128 * 1024 * 1024 };

/**
 * Perkiraan kebutuhan memori scrypt. `maxmem` WAJIB di-set eksplisit:
 * batas bawaan Node 32 MB, sementara N=16384,r=8 sudah butuh ~16 MB dan
 * N=32768 butuh tepat 32 MB — tanpa ini scrypt melempar error dan SEMUA
 * login gagal tanpa pesan yang menunjuk penyebabnya.
 */
export function memoriUntuk(N, r, p) {
  return Math.max(32 * 1024 * 1024, 128 * N * r * p * 2);
}

export async function hashKataSandi(plain) {
  const salt = randomBytes(SALT_BYTES);
  const { N, r, p } = PARAMS;
  const hash = await scrypt(String(plain).normalize("NFKC"), salt, KEYLEN, {
    N,
    r,
    p,
    maxmem: memoriUntuk(N, r, p),
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifikasiKataSandi(plain, tersimpan) {
  const bagian = String(tersimpan ?? "").split("$");
  if (bagian.length !== 6 || bagian[0] !== "scrypt") return false;

  const N = Number.parseInt(bagian[1], 10);
  const r = Number.parseInt(bagian[2], 10);
  const p = Number.parseInt(bagian[3], 10);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (N < 1024 || N > BATAS.N || r < 1 || r > BATAS.r || p < 1 || p > BATAS.p) return false;

  const mem = memoriUntuk(N, r, p);
  if (mem > BATAS.memori) return false;

  let salt;
  let harap;
  try {
    salt = Buffer.from(bagian[4], "base64url");
    harap = Buffer.from(bagian[5], "base64url");
  } catch {
    return false;
  }
  if (salt.length === 0 || harap.length !== KEYLEN) return false;

  let hitung;
  try {
    hitung = await scrypt(String(plain).normalize("NFKC"), salt, KEYLEN, { N, r, p, maxmem: mem });
  } catch {
    return false;
  }
  return hitung.length === harap.length && timingSafeEqual(hitung, harap);
}

/** Aturan kekuatan minimum. Mengembalikan pesan error atau null kalau lolos. */
export function periksaKekuatan(kata) {
  const s = String(kata ?? "");
  if (s.length < 8) return "Kata sandi minimal 8 karakter.";
  if (s.length > 200) return "Kata sandi terlalu panjang.";
  if (!/[A-Za-z]/.test(s)) return "Kata sandi harus memuat huruf.";
  if (!/[0-9]/.test(s)) return "Kata sandi harus memuat angka.";
  return null;
}
