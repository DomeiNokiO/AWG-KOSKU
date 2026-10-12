# KOSKU-UI

Dashboard manajemen kos (boarding house) lengkap, berbahasa Indonesia, dibangun dengan **Next.js 16 (App Router, TypeScript)** dan UI Kit kustom yang mengikuti pola desain KOSKU.

## Fitur

- **Autentikasi**: Login/Logout berbasis sesi (HMAC-SHA256) dengan validasi peran/tier
- **Dashboard**: Ringkasan kamar (total/terisi/kosong/perbaikan), kuota tier, grafik pemasukan 6 bulan, tagihan bulan ini, tabel "Jatuh Tempo / Belum Lunas" + pengingat WhatsApp
- **Kamar**: Grid kartu kamar, tambah kamar, status otomatis
- **Penyewa**: Daftar penyewa, tambah penyewa, tandai keluar/aktifkan
- **UI Kit Lengkap**: Button, Badge, Card, Form (Input/Select/Textarea/Checkbox/Radio/Toggle), Feedback (Alert/Toast/Modal/Confirm), DataDisplay (Table/BarChart), Navigation (Breadcrumb/Tab), Fab + komponen pendukung
- **Keamanan**: `server-only`, CSP nonce per-request (proxy), headers keamanan, `node:sqlite` + `scrypt` bawaan
- **Nol CDN**: Inter + icon sprite lokal (`/public/icons.svg`)

## Struktur

- `src/app/(app)/` – halaman terproteksi (dashboard, kamar, penyewa, ...)
- `src/app/(auth)/masuk` – halaman login
- `src/components/ui/` – UI Kit dapat dipakai ulang
- `src/components/kosku/` – komponen spesifik KOSKU
- `src/actions/` – Server Actions
- `src/lib/` – DB, sesi, env, util
- `src/styles/` – token + komponen + shell CSS
- `src/proxy.ts` – CSP nonce per-request (Next 16)

## Persiapan

1. Clone repo
2. Install deps: `npm install`
3. Jalankan dev: `npm run dev` (http://localhost:3000)
4. Default dev login: `owner@kosku.test` / `password123`

> Di production, wajib set `KOSKU_SESSION_SECRET` (minimal 32 karakter). Buat dengan:
> `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`

## Build & Start

```bash
KOSKU_SESSION_SECRET=... npm run build
KOSKU_SESSION_SECRET=... npm start
```

## Demo Akses

- owner@kosku.test / password123 (pemilik)
- admin@kosku.test / password123 (admin)
- kasir@kosku.test / password123 (kasir)

## Catatan

- Database SQLite otomatis dibuat di `data/kosku.sqlite` (bisa diubah via `KOSKU_DB_PATH`)
- Tier default `free` (kuota 25 kamar). Upgrade banner terhubung ke `/setting`
- Pengingat WhatsApp menggunakan `https://wa.me` dengan pesan terformat

**Author:** AWGNET-RACING & AGENT AI TEAM
