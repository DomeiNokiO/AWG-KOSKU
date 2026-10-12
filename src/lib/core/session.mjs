/**
 * KOSKU-UI — tanda tangan & verifikasi token sesi (HMAC-SHA256).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Dipisah dari Next.js (tanpa import `next/headers`) supaya dapat diuji
 * langsung: lihat test/sesi.test.mjs.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const b64u = (b) => Buffer.from(b).toString("base64url");

function ttd(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/** Buat token bertanda tangan. `ttlMs` menentukan masa berlaku. */
export function buatTokenSesi(userId, secret, ttlMs = 12 * 60 * 60 * 1000, now = Date.now()) {
  if (!secret || typeof secret !== "string") throw new Error("secret wajib diisi");
  const muatan = {
    sub: Number(userId),
    iat: now,
    exp: now + Math.max(1000, Number(ttlMs) || 0),
    jti: randomBytes(12).toString("base64url"),
  };
  const payload = b64u(JSON.stringify(muatan));
  return `${payload}.${ttd(payload, secret)}`;
}

/**
 * Verifikasi token. Mengembalikan muatan, atau null kalau bentuknya salah,
 * tanda tangannya tidak cocok, atau sudah kedaluwarsa.
 *
 * Dua hal yang dijaga di sini:
 *  - tanda tangan dibandingkan dengan `timingSafeEqual` (perbandingan biasa
 *    membocorkan panjang prefiks yang benar lewat waktu);
 *  - `sub` dan `exp` divalidasi tipenya, jadi payload yang ditempel tangan
 *    tidak pernah dipercaya.
 */
export function bacaTokenSesi(token, secret, now = Date.now()) {
  if (typeof token !== "string") return null;
  const titik = token.lastIndexOf(".");
  if (titik <= 0) return null;

  const payloadB64 = token.slice(0, titik);
  const sig = token.slice(titik + 1);

  const a = Buffer.from(sig);
  const b = Buffer.from(ttd(payloadB64, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let muatan;
  try {
    muatan = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof muatan !== "object" || muatan === null) return null;

  const sub = Number(muatan.sub);
  const exp = Number(muatan.exp);
  if (!Number.isInteger(sub) || sub <= 0) return null;
  if (!Number.isFinite(exp) || now > exp) return null;

  return { sub, iat: Number(muatan.iat) || 0, exp, jti: String(muatan.jti ?? "") };
}

/** Nama cookie sesi. Prefix `__Host-` hanya sah bila Secure=true. */
export function namaCookie(secure) {
  return secure ? "__Host-kosku_sesi" : "kosku_sesi";
}

/** Sisa masa berlaku token dalam detik (0 kalau sudah lewat). */
export function sisaDetik(muatan, now = Date.now()) {
  if (!muatan) return 0;
  return Math.max(0, Math.floor((muatan.exp - now) / 1000));
}
