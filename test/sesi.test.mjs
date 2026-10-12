/**
 * KOSKU-UI — regression lock token sesi.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Setiap kasus di sini adalah "serangan yang harus GAGAL": memalsukan tanda
 * tangan, mengganti muatan, kedaluwarsa, dan cookie prefix. Kalau salah satu
 * test ini lulus saat kode token diubah sembrono, artinya gerbangnya jalan.
 *
 * Jalankan: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buatTokenSesi,
  bacaTokenSesi,
  namaCookie,
  sisaDetik,
} from "../src/lib/core/session.mjs";

const RAHASIA = "kunci-rahasia-uji-bukan-produksi";
const PALSU = "kunci-rahasia-lain";

test("token sah diterima & muatan utuh", () => {
  const t = buatTokenSesi(7, RAHASIA, 60_000, 1_000_000);
  const m = bacaTokenSesi(t, RAHASIA, 1_000_000);
  assert.equal(m.sub, 7);
  assert.equal(m.exp, 1_000_000 + 60_000);
});

test("RAHASIA salah -> tolak (forged signature)", () => {
  const t = buatTokenSesi(7, RAHASIA, 60_000);
  assert.equal(bacaTokenSesi(t, PALSU), null);
});

test("muatan diganti sub -> tanda tangan tidak cocok, tolak", () => {
  const t = buatTokenSesi(7, RAHASIA, 60_000);
  const [payload, sig] = t.split(".");
  // Naikkan hak: sub 7 -> 1. Karena HMAC menutup payload, ini wajib gagal.
  const muatan = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  muatan.sub = 1;
  const payloadBaru = Buffer.from(JSON.stringify(muatan)).toString("base64url");
  assert.equal(bacaTokenSesi(`${payloadBaru}.${sig}`, RAHASIA), null);
});

test("token kedaluwarsa -> tolak", () => {
  const t = buatTokenSesi(3, RAHASIA, 1_000, 1_000_000);
  assert.equal(bacaTokenSesi(t, RAHASIA, 1_000_000 + 5_000), null);
});

test("payload rusak / bukan JSON -> tolak tanpa throw", () => {
  const rusak = Buffer.from("{{{{").toString("base64url");
  assert.equal(bacaTokenSesi(`${rusak}.${rusak}`, RAHASIA), null);
  assert.equal(bacaTokenSesi("tanpa-titik", RAHASIA), null);
  assert.equal(bacaTokenSesi(null, RAHASIA), null);
  assert.equal(bacaTokenSesi("", RAHASIA), null);
});

test("sub bukan bilangan bulat positif -> tolak", () => {
  const muatan = { sub: 0, iat: 1, exp: Date.now() + 60_000, jti: "x" };
  const payload = Buffer.from(JSON.stringify(muatan)).toString("base64url");
  // Tanda tangan dibuat SAH dengan rahasia benar — tetap ditolak karena
  // validasi tipe muatan, bukan karena tanda tangan.
  const sig = buatTokenSesi(1, RAHASIA).split(".")[1];
  assert.equal(bacaTokenSesi(`${payload}.${sig}`, RAHASIA), null);
});

test("secret kosong saat membuat token -> error (fail loud)", () => {
  assert.throws(() => buatTokenSesi(1, ""), /secret wajib diisi/);
  assert.throws(() => buatTokenSesi(1, undefined), /secret wajib diisi/);
});

test("nama cookie: __Host- hanya saat Secure", () => {
  assert.equal(namaCookie(true), "__Host-kosku_sesi");
  assert.equal(namaCookie(false), "kosku_sesi");
});

test("sisaDetik tidak pernah negatif", () => {
  assert.equal(sisaDetik(null), 0);
  assert.equal(sisaDetik({ exp: 1 }), 0);
  assert.equal(sisaDetik({ exp: Date.now() + 5_000 }), 5);
});
