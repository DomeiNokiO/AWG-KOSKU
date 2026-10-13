# AWG-KOSKU

Dashboard manajemen kos (boarding house) lengkap, berbahasa Indonesia, dibangun dengan **Next.js 16 (App Router, TypeScript)** dan UI Kit kustom yang mengikuti pola desain AWG-KOSKU.

## Fitur

- **Autentikasi**: Login/Logout berbasis sesi (HMAC-SHA256) dengan validasi peran (pemilik/admin/kasir), rate limit percobaan masuk, anti open-redirect
- **Dashboard**: Ringkasan kamar (total/terisi/kosong/perbaikan), kuota tier, grafik pemasukan 6 bulan, tagihan bulan ini, tabel "Jatuh Tempo / Belum Lunas" + pengingat WhatsApp
- **Kamar**: Grid kartu kamar, tambah kamar, status otomatis (terisi/kosong/perbaikan)
- **Penyewa**: DataTable server-side (cari/urut/paginasi lewat URL), tambah penyewa, tandai keluar/aktifkan
- **Pembayaran**: Bayar (lunas/parsial), riwayat per tagihan, batalkan pembayaran (pemilik/admin, jejak audit), pelunasan
- **Pengeluaran**: Catat + kategori, filter & urut server-side
- **Laporan**: Arus kas per rentang tanggal, aging tunggakan, okupansi, denda (konfigurasi di Pengaturan), **export CSV** (`/api/laporan/csv`)
- **Aktivitas**: Jejak audit semua aksi (siapa, apa, kapan, IP)
- **Catatan, Laporan Bug, Pengaturan** (profil kos, denda, ganti sandi), **UI Kit katalog** (`/kit`)
- **UI Kit Lengkap**: Button, Badge, Card, Form (Input/Select/Textarea/Checkbox/Radio/Toggle/Combobox), Feedback (Alert/Toast/Modal/Confirm/Progress), DataDisplay (Table/DataTableServer/BarChart), Navigation (Breadcrumb/Tab), Fab + komponen pendukung
- **Keamanan**: `server-only`, CSP nonce per-request + `strict-dynamic`, headers keamanan lengkap, `node:sqlite` + `scrypt` bawaan, semua query parameterized, CSV anti formula-injection — lihat [docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)
- **Nol CDN**: Inter + icon sprite lokal (`/public/icons.svg`) — 0 request eksternal (diverifikasi browser)

## Struktur

- `src/app/(app)/` – halaman terproteksi (dashboard, kamar, penyewa, pembayaran, laporan, ...)
- `src/app/(auth)/masuk` – halaman login
- `src/app/api/` – Route Handler (export CSV, logout)
- `src/components/ui/` – UI Kit dapat dipakai ulang
- `src/components/kosku/` – komponen spesifik AWG-KOSKU
- `src/actions/` – Server Actions (wajib sesi + peran di setiap aksi)
- `src/lib/core/` – **satu-satunya tempat SQL** (db.mjs skema/query, bisnis.mjs aturan uang, password/session/validate) — bebas Next.js sehingga bisa diuji `node --test`
- `src/lib/` – wrapper TypeScript (db.ts, sesi, env, tipe baris)
- `src/styles/` – token + komponen + shell CSS
- `src/proxy.ts` – CSP nonce per-request (Next 16)
- `scripts/seed.mjs` – seed database (akun pemilik + kamar contoh)
- `test/` – unit test inti bisnis, sesi HMAC, paginasi

## Persiapan

1. Clone repo
2. Install deps: `npm install`
3. **Seed database (wajib sebelum login pertama kali):** `npm run seed`
   - Non-interaktif: `EMAIL=owner@kosku.test SANDI=rahasia123 npm run seed`
   - Idempoten — dijalankan ulang tidak menggandakan data
4. Jalankan dev: `npm run dev` (http://localhost:3000)
5. Login: `owner@kosku.test` / sandi dari seed

> Di production, wajib set `KOSKU_SESSION_SECRET` (minimal 32 karakter). Buat dengan:
> `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`

## Build & Start

```bash
KOSKU_SESSION_SECRET=... npm run build
KOSKU_SESSION_SECRET=... npm start
```

## Kualitas

```bash
npm run lint       # ESLint — 0 error
npm run typecheck  # tsc --noEmit
npm test           # node --test (bisnis, sesi, paginasi)
npm run build      # lint + type error MEMBLOKIR build (tanpa ignore)
```

Gate: `next.config.ts` tanpa `ignoreBuildErrors`/`ignoreDuringBuilds` — error tipe/lint menggagalkan build secara sengaja.

## Catatan

- Database SQLite otomatis dibuat di `data/kosku.sqlite` (bisa diubah via `KOSKU_DB_PATH`)
- Sesi stateless 12 jam (`KOSKU_SESSION_TTL_HOURS`) — pencabutan sesi tunggal sebelum TTL tidak tersedia (dicatat sebagai batasan)
- Tier default `free` (kuota 25 kamar). Upgrade banner terhubung ke `/setting`
- Pengingat WhatsApp menggunakan `https://wa.me` dengan pesan terformat

**Author:** AWGNET-RACING & AGENT AI TEAM
