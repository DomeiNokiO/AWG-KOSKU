# AWG-KOSKU

Dashboard manajemen kos (boarding house) lengkap, berbahasa Indonesia, dibangun dengan **Next.js 16 (App Router, TypeScript)** dan UI Kit kustom yang mengikuti pola desain AWG-KOSKU.

## Daftar Isi

- [Fitur](#fitur)
- [Instalasi Otomatis (CT/VM baru)](#instalasi-otomatis-ctvm-baru)
- [Instalasi Manual (dev / server)](#instalasi-manual-dev--server)
- [Konfigurasi (env)](#konfigurasi-env)
- [Operasi Harian](#operasi-harian)
- [Troubleshooting](#troubleshooting)
- [Struktur Proyek](#struktur-proyek)
- [Kualitas & Pengujian](#kualitas--pengujian)
- [Dokumentasi Lain](#dokumentasi-lain)

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

## Instalasi Otomatis (CT/VM baru)

> **Repo PRIVATE.** Installer hanya bisa diambil dengan kredensial:
> `git clone https://github.com/DomeiNokiO/AWG-KOSKU.git && cd AWG-KOSKU/deploy && bash install.sh`
> (atau pakai deploy key read-only per CT/VM — lihat README bagian bawah). Untuk mesin Anda sendiri yang sudah login GitHub: clone → install.sh langsung jalan.

Untuk Debian/Ubuntu kosong (Proxmox LXC, VPS, VM) — satu perintah dari kosong sampai jalan:

```bash
# DARI repo hasil clone (bukan curl — repo privat):
git clone https://github.com/DomeiNokiO/AWG-KOSKU.git /tmp/awg-kosku-src
cd /tmp/awg-kosku-src/deploy && bash install.sh
```

Atau unduh dulu lalu jalankan (bisa dibaca isinya sebelum dieksekusi):

```bash
curl -fsSL https://raw.githubusercontent.com/DomeiNokiO/AWG-KOSKU/main/deploy/install.sh -o install.sh
bash install.sh
```

**Saat TTY tersedia** (langsung di terminal / `ssh -t`) installer menanya:

```
Port HTTP [3000]:
Email login pemilik [owner@kosku.test]:
Sandi login pemilik (kosong = dibuat acak):
Nama pemilik/kos [Pemilik Kos]:
Dibelakang HTTPS? 1=ya/0=tidak [0]:
```

**Mode non-interaktif** (SSH tanpa TTY, otomasi, CI) — semua lewat env var, prompt otomatis dilewati:

```bash
PORT=8080 \
EMAIL=pemilik@kos.com \
SANDI='rahasia-anda' \
NAMA='Kos Melati' \
COOKIE_SECURE=1 \
bash install.sh
```

Semua opsional — yang tidak diisi memakai nilai default (sandi kosong = dibuat acak 18 byte dan **dicetak sekali** di ringkasan akhir).

**Yang dilakukan installer** (dalam urutan ini, berhenti dengan pesan jelas kalau gagal):

1. Cek root + distro (hanya Debian/Ubuntu), pasang `git`/`curl`/`tar` bila perlu
2. Node.js: pakai yang sudah ada kalau ≥ 22 (syarat `node:sqlite`); kalau kurang → unduh binary resmi Node 24 LTS dari nodejs.org + **verifikasi sha256** dari SHASUMS resmi
3. `git clone` repo (instalasi ulang **ditolak** — data tidak pernah ditimpa)
4. `npm ci` (kunci `package-lock.json`) → `next build` (lint + type error memblokir build)
5. Tulis `.env` mode 600: `KOSKU_SESSION_SECRET` acak 48 byte, `PORT`, `KOSKU_COOKIE_SECURE`
6. User sistem `kosku` + seed akun awal (idempoten)
7. Unit systemd `awg-kosku` (auto-start saat boot, hardening ringan) lalu `enable --now`
8. Health check: `/masuk` harus `200` (maks 60 detik), `/` harus `307` → tidak lolos = instalasi dianggap gagal + log dicetak
9. **Ringkasan akhir**: URL, akun login, lokasi DB/konfigurasi/log, perintah update

Kebutuhan: internet, port bebas, root. Rata-rata 2–5 menit tergantung jaringan.

## Instalasi Manual (dev / server)

1. Clone repo: `git clone https://github.com/DomeiNokiO/AWG-KOSKU.git`
2. Install deps: `npm install`
3. **Seed database (wajib sebelum login pertama kali):** `npm run seed`
   - Non-interaktif: `EMAIL=owner@kosku.test SANDI=rahasia123 npm run seed`
   - Idempoten — dijalankan ulang tidak menggandakan data
4. Jalankan dev: `npm run dev` (http://localhost:3000)
5. Login: `owner@kosku.test` / sandi dari seed

**Production manual** (tanpa installer):

```bash
KOSKU_SESSION_SECRET=... npm run build   # wajib env saat build & start
KOSKU_SESSION_SECRET=... npm start        # default port 3000
```

> `KOSKU_SESSION_SECRET` wajib ≥ 32 karakter saat `NODE_ENV=production` — app menolak boot tanpanya. Buat dengan:
> `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`

## Konfigurasi (env)

Ditulis installer ke `$APP_DIR/.env` (mode 600) — atau buat sendiri untuk mode manual.

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `KOSKU_SESSION_SECRET` | **ya (prod)** | dev fallback | Rahasia tanda tangan sesi, min. 32 karakter. Ganti = semua sesi logout |
| `PORT` | tidak | `3000` | Port HTTP (dibaca `next start`) |
| `KOSKU_COOKIE_SECURE` | tidak | `1` di prod | **Harus `0` kalau tanpa HTTPS** — kalau `1` di HTTP murni, login tampak sukses lalu terus-menerus logout |
| `KOSKU_DB_PATH` | tidak | `data/kosku.sqlite` | Lokasi database SQLite |
| `KOSKU_SESSION_TTL_HOURS` | tidak | `12` | Umur sesi login (jam) |
| `EMAIL`, `SANDI`, `NAMA` | tidak | bawaan | Hanya untuk `npm run seed` (akun awal) |

Ganti nilai: edit `.env` → **restart wajib** (systemd hanya membaca `EnvironmentFile` saat start):

```bash
systemctl restart awg-kosku
```

## Operasi Harian

```bash
systemctl status awg-kosku          # status service
systemctl restart awg-kosku         # restart (setelah edit .env)
journalctl -u awg-kosku -f          # pantau log live
```

**Update ke versi baru** (jalankan dari mesin yang terpasang installer):

```bash
cd /opt/awg-kosku
git pull && npm ci && npm run build
systemctl restart awg-kosku
```

Kalau `git pull` menolak "detected dubious ownership" (instalasi lama sebelum fix ini): `git config --global --add safe.directory /opt/awg-kosku` sekali.

**Backup** — jangan `cp` file SQLite saat service jalan (bisa kotor karena WAL). Aman:

```bash
systemctl stop awg-kosku
cp -a /opt/awg-kosku/data/kosku.sqlite /backup/kosku-$(date +%F).sqlite
systemctl start awg-kosku
```

Restore: stop → timpa file DB dengan backup → start. File `.env` berisi rahasia — backup juga.

**Uninstall** (data ikut terhapus — backup dulu):

```bash
systemctl disable --now awg-kosku
rm /etc/systemd/system/awg-kosku.service && systemctl daemon-reload
rm -rf /opt/awg-kosku
userdel kosku 2>/dev/null || true
```

## Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| Login selalu terlempar lagi ke `/masuk` tanpa error | `KOSKU_COOKIE_SECURE=1` tapi diakses via HTTP → set `0` di `.env`, restart |
| App menolak start: "KOSKU_SESSION_SECRET wajib diisi" | Secret belum ada/pendek → tulis ke `.env`, restart |
| "sandi salah" padahal baru seed | Seed tidak jalan / beda email → `cd /opt/awg-kosku && EMAIL=... SANDI=... npm run seed` (idempoten) |
| `address already in use` | Port terpakai → ganti `PORT` di `.env` lalu `systemctl restart awg-kosku` (atau pakai port lain saat install) |
| Layanan mati setelah boot | `journalctl -u awg-kosku -b -e` — biasanya secret hilang dari `.env` |
| Halaman kosong / 404 setelah update | Build belum jalan → `npm run build` dulu, baru restart |
| Cek cepat semua | `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/masuk` harus `200` |

Pitfall deploy lengkap (private repo, update lockfile, verifikasi build Next.js): [`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md) + skill `node-proxmox-deploy`.

## Struktur Proyek

- `deploy/install.sh` — installer otomatis CT/VM (lihat atas)
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
- `test/` – unit test inti bisnis, sesi HMAC, paginasi (24 test)

## Kualitas & Pengujian

```bash
npm run lint       # ESLint — 0 error
npm run typecheck  # tsc --noEmit
npm test           # node --test (bisnis, sesi, paginasi)
npm run build      # lint + type error MEMBLOKIR build (tanpa ignore)
```

Gate: `next.config.ts` tanpa `ignoreBuildErrors`/`ignoreDuringBuilds` — error tipe/lint menggagalkan build secara sengaja.

## Dokumentasi Lain

- [`docs/UI-KIT.md`](docs/UI-KIT.md) — katalog komponen UI, keputusan desain, cara pakai
- [`docs/SECURITY-AUDIT.md`](docs/SECURITY-AUDIT.md) — register audit keamanan: temuan, bukti, kontrol, risiko yang diterima
- Katalog komponen interaktif ada di aplikasi: **`/kit`**

## Catatan

- Database SQLite otomatis dibuat di `data/kosku.sqlite` (bisa diubah via `KOSKU_DB_PATH`)
- Sesi stateless 12 jam (`KOSKU_SESSION_TTL_HOURS`) — pencabutan sesi tunggal sebelum TTL tidak tersedia (dicatat sebagai batasan)
- Tier default `free` (kuota 25 kamar). Upgrade banner terhubung ke `/setting`
- Pengingat WhatsApp menggunakan `https://wa.me` dengan pesan terformat

**Author:** AWGNET-RACING & AGENT AI TEAM
