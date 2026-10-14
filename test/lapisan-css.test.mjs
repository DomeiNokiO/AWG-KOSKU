/**
 * AWG-KOSKU — regression lock lapisan CSS (shell + drawer).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Kunci temuan produksi: sidebar mobile mati total karena blok CSS warisan
 * di app.css menurunkan z-index .k-sidebar ke 60 — DI BAWAH .k-sb-backdrop
 * (118) — sehingga backdrop menutupi seluruh panel dan setiap klik menu
 * hanya menutup drawer. Tidak ada error konsol, tidak ada warning build:
 * secara teknis halaman "render", tapi navigasi mustahil di HP.
 *
 * Aturan yang dikunci di sini:
 *  1. z-index sidebar (mobile) HARUS lebih besar dari backdrop.
 *  2. Kelas pembuka drawer HARUS yang benar-benar dipakai React (.k-open),
 *     bukan selektor atribut warisan ([data-open]).
 *  3. Jangan ada dua definisi .k-sidebar dalam satu media query — definisi
 *     kedua tanpa sengaja menimpa yang pertama.
 *  4. Banner kuota tidak boleh jadi strip kosong (rasio > 9:1) dan tidak
 *     boleh memakai token yang tidak terdefinisi.
 *
 * Jalankan: npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/styles/app.css", import.meta.url), "utf8");
const komponen = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");

/** Buang komentar supaya aturan yang dikomentari tidak dianggap aktif. */
const tanpaKomentar = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

/** Ambil isi blok @media dengan kondisi tertentu (tanda kurung berimbang). */
function isiMedia(css, kondisi) {
  const awal = css.indexOf(`@media ${kondisi}`);
  if (awal === -1) return "";
  const buka = css.indexOf("{", awal);
  let dalam = 0;
  for (let i = buka; i < css.length; i += 1) {
    if (css[i] === "{") dalam += 1;
    else if (css[i] === "}") {
      dalam -= 1;
      if (dalam === 0) return css.slice(buka + 1, i);
    }
  }
  return "";
}

test("z-index sidebar mobile lebih tinggi dari backdrop", () => {
  const mobile = tanpaKomentar(isiMedia(app, "(max-width: 900px)"));
  const blok = mobile.match(/\.k-sidebar\s*\{([^}]*)\}/);
  assert.ok(blok, "blok .k-sidebar di media mobile harus ada");

  const zSidebar = Number((blok[1].match(/z-index:\s*(\d+)/) || [])[1]);
  const zBackdrop = Number((tanpaKomentar(app).match(/\.k-sb-backdrop\s*\{[^}]*z-index:\s*(\d+)/) || [])[1]);

  assert.ok(Number.isFinite(zSidebar), "sidebar harus punya z-index eksplisit");
  assert.ok(Number.isFinite(zBackdrop), "backdrop harus punya z-index eksplisit");
  assert.ok(
    zSidebar > zBackdrop,
    `z-index sidebar (${zSidebar}) harus > backdrop (${zBackdrop}) — kalau tidak, seluruh menu tertutup dan tidak bisa diklik`,
  );
});

test("kelas pembuka drawer sesuai yang dipakai React (.k-open)", () => {
  const bersih = tanpaKomentar(app);
  assert.match(bersih, /\.k-sidebar\.k-open\s*\{/, "harus ada .k-sidebar.k-open");
  assert.doesNotMatch(
    bersih,
    /\.k-sidebar\[data-open/,
    "selektor [data-open] warisan: React memakai .k-open, jadi aturan ini tidak pernah aktif dan menandakan sisa blok lama",
  );
});

test("tidak ada dua definisi .k-sidebar di dalam satu media query", () => {
  for (const kondisi of ["(max-width: 900px)", "(max-width: 1023px)", "(max-width: 767px)"]) {
    const isi = tanpaKomentar(isiMedia(app, kondisi));
    if (!isi) continue;
    // Hanya hitung blok yang selector-nya .k-sidebar itu sendiri — bukan
    // .k-sidebar.k-open (varian state) atau .k-sidebar, .k-topbar (daftar).
    const jumlah = (isi.match(/\.k-sidebar\s*\{/g) || []).length;
    assert.ok(jumlah <= 1, `media ${kondisi} punya ${jumlah} definisi .k-sidebar — definisi terakhir menimpa yang benar`);
  }
});

test("setiap token var(--k-*) yang dipakai benar-benar terdefinisi", () => {
  const dipakai = new Set();
  for (const m of (app + komponen).matchAll(/var\(\s*(--k-[a-z0-9-]+)/g)) dipakai.add(m[1]);
  const hilang = [...dipakai].filter((t) => !tokens.includes(`${t}:`));
  assert.deepEqual(
    hilang,
    [],
    `token tak terdefinisi (nilainya kosong sehingga gaya tidak diterapkan): ${hilang.join(", ")}`,
  );
});

test("banner kuota tidak jadi strip kosong dan punya isi pendukung", () => {
  const blok = komponen.match(/\.k-banner\s*\{([^}]*)\}/);
  assert.ok(blok, "blok .k-banner harus ada");

  // Banner pernah 1141x137px (8.3:1) — ruang kosong besar yang terbaca
  // sebagai "kotak biru kosong". Isi pendukung + min-height mencegahnya.
  assert.match(blok[1], /min-height|padding/, "banner harus punya min-height/padding nyata");
  assert.match(komponen, /\.k-banner-stats/, "banner harus menyediakan baris angka pendukung");
  assert.match(komponen, /\.k-banner \.k-progress/, "progress di dalam banner harus diberi gaya kontras gelap");
});
