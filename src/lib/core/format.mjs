/**
 * KOSKU-UI — pemformat & util tampilan (murni, tanpa efek samping).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Ditulis sebagai modul JS polos supaya bisa diuji langsung dengan
 * `node --test` tanpa proses build, dan dipakai apa adanya oleh komponen
 * server maupun klien.
 */

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 1100000 -> "Rp 1.100.000" (spasi tipis bawaan Intl diganti spasi biasa). */
export function rupiah(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Rp 0";
  return RUPIAH.format(Math.round(Number(value))).replace(/\u00a0/g, " ");
}

const TANGGAL = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });

/** "2026-09-24" -> "24/09/2026". Dibaca sebagai UTC agar tidak bergeser sehari. */
export function tanggal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  if (!m) return "-";
  return TANGGAL.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
}

/** Selisih hari (positif = masih ke depan). */
export function selisihHari(iso, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  if (!m) return 0;
  const target = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - base) / 86400000);
}

/** Label + nada warna untuk status tempo. */
export function labelTempo(diffHari) {
  if (diffHari < 0) {
    const telat = Math.abs(diffHari);
    return { text: `${telat} hari telat`, tone: telat >= 7 ? "bad" : "warn" };
  }
  if (diffHari === 0) return { text: "jatuh tempo hari ini", tone: "warn" };
  return { text: `${diffHari} hari lagi`, tone: diffHari <= 3 ? "warn" : "ok" };
}

/** Inisial untuk avatar: "Bu Sari" -> "BS". */
export function inisial(nama) {
  return String(nama ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Hari ini sebagai YYYY-MM-DD (waktu lokal server). */
export function hariIni(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-10-12" + n bulan -> tetap di akhir bulan kalau tanggalnya tidak ada. */
export function tambahBulan(iso, n) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ""));
  if (!m) return String(iso ?? "");
  const y = +m[1];
  const mo = +m[2] - 1;
  const d = +m[3];
  const hariTerakhir = new Date(Date.UTC(y, mo + n + 1, 0)).getUTCDate();
  const t = new Date(Date.UTC(y, mo + n, Math.min(d, hariTerakhir)));
  const p = (x) => String(x).padStart(2, "0");
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
}

/** "Oktober 2026" untuk judul kartu. */
export function namaBulan(d = new Date()) {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(d);
}

/** "1.100.000" atau "Rp 1.100.000" -> 1100000 (untuk input teks rupiah). */
export function parseRupiah(input) {
  const digits = String(input ?? "").replace(/[^0-9]/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isSafeInteger(n) ? n : 0;
}

/** Persen 0..100, dibulatkan turun. */
export function persen(bagian, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((bagian / total) * 100)));
}

/** "3" -> "3 bulan", dipakai di ringkasan sewa. */
export function bulanKeTeks(n) {
  return `${n} bulan`;
}

/**
 * Normalisasi teks untuk pencarian: huruf kecil, tanpa spasi ganda.
 * Dipakai di sisi klien; pencarian di server memakai parameter LIKE yang
 * sudah di-escape oleh repo.
 */
export function normalCari(s) {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * Format angka rupiah untuk input teks saat pengguna mengetik:
 * "1100000" -> "1.100.000". Tidak menambahkan "Rp" agar tetap bisa diedit.
 */
const RIBUAN = new Intl.NumberFormat("id-ID");
export function ribuan(n) {
  const v = parseRupiah(n);
  return v ? RIBUAN.format(v) : "";
}

/** Persentase kenaikan antar dua nilai, untuk indikator tren. */
export function deltaPersen(kini, sebelumnya) {
  if (!sebelumnya) return kini > 0 ? 100 : 0;
  return Math.round(((kini - sebelumnya) / sebelumnya) * 100);
}
