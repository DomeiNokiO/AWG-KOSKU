# KOSKU-UI — UI Kit Dashboard

**Repo:** [https://github.com/DomeiNokiO/kosku-ui](https://github.com/DomeiNokiO/kosku-ui)

KOSKU-UI adalah dashboard manajemen kos berbahasa Indonesia berbasis Next.js 16 (App Router + TypeScript). Project ini sekaligus berfungsi sebagai **UI Kit** terstruktur: semua komponen UI (`src/components/ui/`) dapat dipakai ulang, terpisah dari logika bisnis KOSKU.

## Tujuan

Mereplikasi tampilan & pengalaman dashboard KOSKU (screenshot yang dikirim user) secara **lengkap**: layout, sidebar, topbar, stat card, banner kuota, tabel jatuh tempo, form, modal, toast/alert, select, badge, tombol, FAB, dsb. Tanpa CDN (self-hosted fonts & icons).

## Tech Stack

- **Framework:** Next.js 16.4.0 (App Router)
- **Runtime:** Node.js 26
- **TypeScript** + ESLint
- **CSS:** Custom CSS Kit (`src/styles/`) — token, base, components, app shell (bukan Tailwind)
- **DB:** `node:sqlite` (DatabaseSync) — SQLite lokal (`data/kosku.sqlite`)
- **Auth:** Sesi custom HMAC-SHA256 (server-only) + `scrypt` bawaan Node
- **Icons:** SVG sprite lokal `/public/icons.svg` (gabungan AWG + ikon KOSKU)
- **Keamanan:** `server-only`, CSP nonce per-request via `src/proxy.ts`, security headers

## Struktur File Kunci

```
src/
├─ app/
│  ├─ (app)/        # Halaman terproteksi: dashboard, kamar, penyewa, pembayaran, laporan, setting
│  ├─ (auth)/masuk  # Login
│  └─ layout.tsx    # Root layout + ToastProvider + Theme
├─ components/
│  ├─ ui/           # UI KIT (Button, Card, Form, Feedback, DataDisplay, Navigation, Icon, Fab, ...)
│  └─ kosku/        # Komponen spesifik KOSKU (Sidebar, Topbar, TabelTempo, KamarGrid, ...)
├─ actions/         # Server Actions (auth, kosku)
├─ lib/
│  ├─ core/         # Core mjs (db/session/password/validate/format) — bisa diuji node --test
│  ├─ db.ts         # Data layer (server-only)
│  ├─ sesi.ts       # Session helper
│  └─ env.ts        # Env config
├─ styles/          # tokens.css, base.css, components.css, app.css
└─ proxy.ts         # CSP nonce (Next 16)
```

## UI Kit — Komponen yang Tersedia

| Kategori | Komponen | Keterangan |
|---|---|---|
| **Foundation** | `Icon`, `Avatar` | SVG sprite, inisial avatar |
| **Feedback** | `Alert`, `Toast`, `Modal`, `Confirm`, `EmptyState`, `Progress`, `Skeleton`, `Spinner` | Notifikasi, dialog, loading |
| **Data Display** | `StatCard`, `Card`, `Table`, `DataTable`, `BarChart`, `SectionTitle` | Kartu statistik, tabel, grafik batang |
| **Form** | `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Toggle`, `Label`, `HelpText`, `Field` | Form lengkap + validasi UI |
| **Action** | `Button`, `ButtonGroup`, `Fab` | Tombol, grup tombol, floating action button |
| **Navigation** | `Breadcrumb`, `Tabs`, `TabPanel`, `NavLink` | Navigasi |
| **Misc** | `Badge`, `Tooltip`, `Kbd` | Chip/badge, tooltip, keyboard hint |

Semua komponen memakai token CSS (`--k-*`) — konsisten, mudah di-skin.

## Jalankan Lokal

```bash
# 1) Clone
git clone https://github.com/DomeiNokiO/kosku-ui.git
cd kosku-ui

# 2) Install
npm install

# 3) Dev (otomatis pakai dev secret)
npm run dev
# buka http://localhost:3000
```

**Login demo (dev):**
- `owner@kosku.test` / `password123`
- `admin@kosku.test` / `password123`
- `kasir@kosku.test` / `password123`

## Build Production

```bash
# generate secret minimal 32 karakter
export KOSKU_SESSION_SECRET=$(node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))")

# build
npm run build

# start
npm start
```

Variabel env:
- `KOSKU_SESSION_SECRET` (wajib prod)
- `KOSKU_DB_PATH` (opsional, default `data/kosku.sqlite`)

## Screenshot Referensi

Project ini mereplikasi dashboard KOSKU yang dikirim user:
- 4 stat card (Total Kamar, Kamar Terisi, Kamar Kosong, Pemasukan Bulan Ini)
- Banner "Kuota Kamar — Tier Free: X / Y Kamar" + progress + tombol "Upgrade Sekarang"
- Tabel "Jatuh Tempo / Belum Lunas" (Penyewa, Kamar, Jatuh Tempo, Tagihan, Status Tempo, Aksi)
- Grafik "Pemasukan 6 Bulan Terakhir"
- Ringkasan tagihan bulan ini
- Sidebar + Topbar + FAB

## Keputusan Teknis

- **Next.js over PHP**: lebih cepat membangun UI kit lengkap + SSR aman + Server Actions
- **CSS custom (bukan Tailwind)**: menegakkan konsistensi visual kit AWG-style, zero runtime CSS
- **`node:sqlite` + `scrypt`**: nol dependensi native tambahan, jalan di Node 26
- **Core `.mjs` terpisah**: bisa diuji `node --test` tanpa Next
- **Icon sprite lokal**: anti-CSP/CDN, cepat & aman
- **CSP nonce per-request**: sesuai pola Next 16 (`src/proxy.ts`)

## Lisensi

MIT

**Dibuat oleh:** AWGNET-RACING & AGENT AI TEAM
