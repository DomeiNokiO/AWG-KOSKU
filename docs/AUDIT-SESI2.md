# AWG-KOSKU — Audit Keamanan Sesi 2 (13 Okt 2026)

Metode: `pentest-playbook` Fase FIND (owner self-audit, full-arsenal) →
triage `appsec-lifecycle`. Target: repo `/root/kosku-ui` + app yang berjalan
di localhost:3100. Semua temuan di bawah PUNYA BUKTI (output mentah), bukan
dugaan. Keputusan default: **PLANNING, tanpa patch** (aturan skill).

## Hasil audit — register

| # | Temuan | Layer | Prioritas | Bukti | Keputusan | Status |
|---|--------|-------|-----------|-------|-----------|--------|
| 1 | `npm audit` 5 HIGH — `braces` (GHSA-vfj7-8cjw-p6xm, stack-exhaustion DoS) lewat rantai dev-only: `eslint-config-next@16.4.0 → @next/eslint-plugin-next → fast-glob → micromatch → braces` | process/CI | Sedang | `npm audit`: 5 high; `npm ls`: rantai dari `eslint-config-next`, BUKAN dari `next` runtime | **Accept (dev-only)** — prod bersih: `npm audit --omit=dev` = 0. Jangan `--force` (turun ke eslint-config-next@14 = breaking + downgrade). Tindakan: cek ulang tiap rilis `npm audit`; upgrade `eslint-config-next` begitu upstream patched. | DITERIMA + revisit per rilis Next |
| 2 | `.env.example` masih membawa `KOSKU_SEED_EMAIL/SEED_PASSWORD=kosku12345` — variabel **sudah tidak dibaca kode** (dihapus dari env.ts di commit fb649e0) → placeholder mati + menanam ide "sandi default" ke pengguna baru | process | Sedang | Bukti: `cat .env.example` (di atas); `grep KOSKU_SEED src/` → tidak ada pembaca | **Fix**: hapus 2 baris dari `.env.example` (seed memakai `EMAIL`/`SANDI`) | ✅ CLOSED (`cddb4db`) — grep KOSKU_SEED = 0, arah benar ke EMAIL/SANDI |
| 3 | Rate limit login in-process (`Map`) — 8/5 menit per (IP+email) | app | — | Bukti kode + komentar jujur di `rate-limit.ts`: cakupan SATU proses; N instance = N× lipat | **Accept** — arsitektur satu proses (systemd tunggal); komentar sudah menuliskan pemicu naik-tuning (Redis) | DITERIMA (berlaku selama single-instance) |
| 4 | Aksi `wajibSesi()` tanpa batasan peran: tandai lunas, batalkan lunas, tambah tagihan, ubah status penyewa (+ temuan jaring pengaman: pelunasanPenuh, simpanPengeluaran, simpanKamar, tambahPenyewa) | app | Sedang | Bukti: grep semua aksi; RED test awal menggagalkan yang masih `wajibSesi` | **Fix** (commit `cddb4db`): 8 aksi → `wajibPeran(["pemilik","admin"])` + jejak audit; kasir tetap bisa bayarTagihan/catatan/bug. Lock: `test/peran.test.mjs` (3 test, 27/27) | ✅ CLOSED (`cddb4db`) |
| 5 | Menu sidebar tidak menyaring peran (kasir melihat semua menu; server tetap menolak aksinya) | app (UX) | Rendah | Bukti: `nav.ts` tanpa field peran; layout komentar menyebut HMAC+peran baca ulang DB | **Fix (UX)**: filter `NAV` per peran saat render Sidebar — server-side layout yang sudah punya sesi | OPEN |
| 6 | CSP `style-src 'nonce-...'` vs 47 pemakaian `style={{}}` (React inline style) | app | Suspected→**Ditolak** | Uji browser: listener `securitypolicyviolation` di 5 halaman → **0 pelanggaran**; elemen inline-style terpasang normal. React menulis via CSSOM (atribut style), bukan `<style>` element — tidak kena `style-src` | Tidak ada temuan | DITOLAK (terbukti tidak berbahaya, dengan uji) |
| 7 | `dangerouslySetInnerHTML` 1 pemakaian (`src/app/layout.tsx:51` skrip tema) | app | Ditinjau | Bukti: dipasok string konstanta statis `SKRIP_TEMA` (bukan input pengguna) + atribut `nonce` — aman by construction | **Accept** (konstanta internal, tanpa interpolasi input) | DITERIMA |
| 8 | Tanpa CI (GitHub Actions) — gate hijau hanya terbukti di mesin dev | process | Sedang | Bukti: `ls .github` tidak ada | **Fix** (commit `d2cd575`): workflow lint+tsc+test+build tiap push (Node 24, secret dummy untuk build). Run pertama: SUCCESS | ✅ CLOSED (`d2cd575`) |
| 9 | Tanpa LICENSE | proses | Sedang | `ls LICENSE*` kosong | **Accept** — repo menjadi PRIVATE dipakai pribadi (keputusan pemilik): tanpa lisensi = semua hak milik pemilik, LICENSE tak diperlukan. Bila nanti kembali public, tambahkan MIT | ✅ DITERIMA (keputusan 13 Okt 2026) |

## Temuan sebelumnya yang TETAP tertutup (diuji ulang sesi ini)

- Semua 6 file aksi punya penjaga sesi (`grep -L` → 0 file tanpa guard)
- `batalkanBayarAction`, `generateTagihanAction`, hapus kategori/pengeluaran, pengaturan = `wajibPeran(["pemilik","admin"])` ✓
- Overpay ditolak di core (`throw` "melebihi sisa tagihan") ✓
- Open redirect `?lanjut=` → hanya jalur internal (`startsWith("/") && !startsWith("//")`) ✓
- Anti user-enumeration: satu pesan gagal + dummy hash saat email tak terdaftar (timing) ✓
- `muatLimit`: id ≥1, jumlah 1..999.999.999, metode allow-list ✓
- CSP: 0 pelanggaran saat drive 5 halaman (termasuk 47 pemakaian inline `style={{}}`) ✓
- `dangerouslySetInnerHTML` hanya untuk `SKRIP_TEMA` konstanta statis + nonce (bukan input pengguna) ✓
- Header: HSTS(2 thn)+nosniff+XFO DENY+Referrer-Policy+Permissions-Policy di next.config ✓
- Rate limit: Map in-process, batas 5000 entri (anti memory-growth), bersihkan saat penuh ✓

## Yang TIDAK diuji sesi ini (jujur)

- TLS/reverse-proxy di depan app (installer baru sampai port HTTP)
- Uji beban (DoS) — rate limit menahan tebakan, bukan volumetrik
- Multi-instance rate limit (butuh Redis jika suatu saat di-scale-out)
- Pemindaian dependensi runtime non-npm (node:sqlite = bawaan Node)

---
Register ini melengkapi `SECURITY-AUDIT.md` (register v1): temuan sesi audit
ini diberi nomor lanjutan (10+) bila nanti digabungkan.
