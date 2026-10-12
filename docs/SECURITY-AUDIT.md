# KOSKU-UI — Register Audit Keamanan

Metode: **appsec-lifecycle** (FIND → CLOSE → PREVENT). Semua temuan di bawah
berasal dari pengujian aktif terhadap aplikasi yang berjalan (bukan membaca kode
saja); setiap Fix punya bukti RED→GREEN dan kunci regresi.

Terakhir diperbarui: 12 Oktober 2026.

## Ringkasan

| # | Temuan | Lapisan | Keputusan | Status |
|---|--------|---------|-----------|--------|
| 1 | Database tanpa akun awal (`npm run seed` menunjuk file tak ada) — login mustahil | app | Fix | ✅ CLOSED |
| 2 | Row `node:sqlite` null-prototype → React Flight tolak → 500 di halaman kamar/dashboard/penyewa/aktivitas | app | Fix | ✅ CLOSED |
| 3 | `ambiguous column name` pada sort tertentu (JOIN) → 500 hanya di URL sort terpilih | app | Fix | ✅ CLOSED |
| 4 | Server Component mengirim fungsi (kolom tabel, format grafik) ke Client Component → 500 | app | Fix | ✅ CLOSED |
| 5 | Login tanpa rate limit (tebakan kata sandi online) | app | Fix (sudah ada: 8 percobaan / 5 menit per IP+email) | ✅ CLOSED |
| 6 | Tidak ada jejak audit pembatalan pembayaran | app | Fix (`catatAktivitas` di `batalkanBayar`) | ✅ CLOSED |
| 7 | `query_kos.ts`: query mati dengan fallback diam-diam (`q as any`) | app | Fix (dihapus) | ✅ CLOSED |
| 8 | Session token tidak punya test — komentar menjanjikan `test/sesi.test.mjs` yang tak ada | process | Fix (9 test negatif + bukti RED) | ✅ CLOSED |
| 9 | Sesi stateless: pencabutan satu sesi sebelum TTL 12 jam tidak tersedia | app | **Accept** — lihat bawah | ⏳ DITERIMA |

## Rincian dengan bukti

### 1. Seed tidak ada (Kritis)
- **RED**: `SELECT` tabel `pengguna` → `[]`; form login menolak kredensial demo.
- **GREEN**: `scripts/seed.mjs` dibuat → akun pemilik + 4 kamar contoh; login via browser → `/dashboard`.
- **Lock**: README bagian Persiapan mewajibkan `npm run seed`.

### 2. Null-prototype row (Tinggi)
- **RED**: log server `Classes or null prototypes ... {id: 4, nomor: "B2", ...}`; halaman kamar menampilkan error page.
- **GREEN**: helper `polos()` + semua `.all()` di core dikonversi → sweep 14/14 halaman bersih.
- **Lock**: `test/paginasi.test.mjs` mengunci "row bukan null-prototype".

### 3. Kolom ambigu (Tinggi)
- **RED**: reproduksi lokal `paginatedQuery` → `ambiguous column name: status` (penyewa); sort `jumlah` pada riwayat (`r.jumlah` vs `b.jumlah`).
- **GREEN**: `sortMap` (kunci URL → ekspresi SQL terkualifikasi) di semua fetcher; **40/40 kombinasi sort lulus**; sweep URL `?sort=jumlah`, `?sort=status`, `?sort=id` bersih.
- **Lock**: `test/paginasi.test.mjs` mengeksekusi semua kunci per fetcher.

### 4. Fungsi lintas batas RSC (Tinggi)
- **RED**: log `Functions cannot be passed ... {kunci: ..., nilai: function}` dan `{data: [], format: function}`.
- **GREEN**: boundary client `TabelAging` + `GrafikPemasukan` (fungsi dibuat di dalam client; props hanya data); `/laporan` dan `/dashboard` bersih.
- **Lock**: sweep browser harian; pola ini didokumentasikan di komentar kedua file.

### 8. Test sesi (Sedang)
- **RED (bukti test bisa gagal)**: cacat disuntik `if (false) return null;` di perbandingan `timingSafeEqual` → test "muatan disunting" GAGAL (`actual sub:1, expected null`).
- **GREEN**: file dipulihkan → 21/21 (kini 24/24) lulus.

## Kontrol yang diverifikasi aktif

| Kontrol | Bukti |
|---|---|
| CSP nonce + `strict-dynamic` | header respons tiap permintaan; 0 pelanggaran saat drive semua widget |
| HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | `curl -I` |
| Rute terproteksi | 10 rute → `307 /masuk` tanpa sesi (termasuk `/api/laporan/csv`) |
| Cookie `httpOnly` + `SameSite=Lax` (+`__Host-` saat Secure) | `src/lib/sesi.ts` + `session.mjs` (diuji) |
| Anti open-redirect `?lanjut=` | validasi `startsWith("/") && !startsWith("//")` di page + action |
| Rate limit login | 8 percobaan / 5 menit / (IP+email) |
| Hash kata sandi | scrypt N=32768 + `timingSafeEqual`; timing-respons disamakan untuk email tak terdaftar |
| SQL parameterized | semua query inti; kolom ORDER BY lewat whitelist + `sortMap` |
| CSV formula-injection | `csvField` (uji unit) |
| Nol CDN | `performance.getEntriesByType('resource')` → 0 eksternal |

## Risiko yang DITERIMA (dengan alasan)

**#9 — Pencabutan sesi tunggal tidak tersedia.**
- *Siapa yang menerima*: pemilik aplikasi (skala kos perorangan).
- *Alasan*: sesi stateless 12 jam tanpa tabel sesi; menambah tabel sesi + cek per-permintaan menambah kompleksitas demi skala satu gedung kos. Risiko: perangkat hilang → sesi lama sah maksimal 12 jam.
- *Mitigasi*: TTL pendek (12 jam), ganti kata sandi tersedia di Pengaturan, cookie `httpOnly`.
- *Pemicu yang membuka kembali*: aplikasi dipakai multi-admin di perangkat bersama, atau jadi SaaS → tambahkan tabel sesi + pencabutan.

## Belum diverifikasi (dijujur, tidak diandaikan)

- Deploy TLS nyata: header HSTS diuji di localhost; `KOSKU_COOKIE_SECURE` otomatis `true` hanya saat `NODE_ENV=production`.
- Uji beban / DoS di luar rate limit login & generate tagihan.
- Audit dependensi (`npm audit`) belum dijalankan di sesi ini.
- Verifikasi visual penuh (screenshot per halaman) — pengukuran overflow & fungsi sudah, bukti gambar belum.

## Pencegahan (gate yang menjaga supaya tidak kembali)

- `next.config.ts` tanpa `ignoreBuildErrors`/`ignoreDuringBuilds` — lint/type error memblokir build.
- Semua SQL terkunci di `src/lib/core/*.mjs`; test inti jalan tanpa Next.js (`npm test`).
- Komentar "kenapa" di setiap tempat yang pernah salah (sortMap, polos, boundary client).
