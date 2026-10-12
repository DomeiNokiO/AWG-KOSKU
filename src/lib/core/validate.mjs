/**
 * KOSKU-UI — validasi input (skema buatan sendiri, tanpa dependensi).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Kenapa tidak pakai zod: satu-satunya kebutuhan proyek ini adalah
 * "pastikan string/angka/email/tanggal masuk akal sebelum menyentuh DB".
 * Enam puluh baris di sini menggantikan satu dependensi runtime, dan
 * validator yang Anda baca sendiri lebih mudah diaudit.
 *
 * Dipakai di TEPI handler (Route Handler / Server Action), lalu nilai yang
 * sudah bersih diteruskan ke lapisan data.
 */

export class ValidasiError extends Error {
  constructor(pesan, field) {
    super(pesan);
    this.name = "ValidasiError";
    this.field = field;
  }
}

const teks = (v) => (typeof v === "string" ? v.trim() : v === null || v === undefined ? "" : String(v));

export function wajibTeks(v, field, { min = 1, max = 200 } = {}) {
  const s = teks(v);
  if (s.length < min) throw new ValidasiError(`Kolom ${field} minimal ${min} karakter.`, field);
  if (s.length > max) throw new ValidasiError(`Kolom ${field} maksimal ${max} karakter.`, field);
  return s;
}

export function opsionalTeks(v, max = 500) {
  const s = teks(v);
  return s.length > max ? s.slice(0, max) : s;
}

/** Email: sengaja sederhana dan ketat — satu @, ada titik di domain. */
export function wajibEmail(v, field = "email") {
  const s = teks(v).toLowerCase();
  if (s.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s)) {
    throw new ValidasiError("Format email tidak valid.", field);
  }
  return s;
}

export function wajibInt(v, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = typeof v === "number" ? v : Number.parseInt(teks(v), 10);
  if (!Number.isInteger(n)) throw new ValidasiError(`Kolom ${field} harus berupa angka.`, field);
  if (n < min || n > max) throw new ValidasiError(`Kolom ${field} harus antara ${min} dan ${max}.`, field);
  return n;
}

/** Tanggal kalender YYYY-MM-DD, ditolak kalau tanggalnya tidak nyata (2026-02-30). */
export function wajibTanggal(v, field = "tanggal") {
  const s = teks(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new ValidasiError(`Kolom ${field} harus berformat YYYY-MM-DD.`, field);
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new ValidasiError(`Tanggal ${field} tidak ada di kalender.`, field);
  }
  if (y < 2000 || y > 2100) throw new ValidasiError(`Tahun ${field} di luar rentang wajar.`, field);
  return s;
}

export function wajibSalahSatu(v, daftar, field) {
  const s = teks(v);
  if (!daftar.includes(s)) {
    throw new ValidasiError(`Nilai ${field} tidak dikenal.`, field);
  }
  return s;
}

/**
 * Nomor telepon Indonesia → dinormalisasi ke bentuk 62xxxx supaya tautan
 * WhatsApp selalu benar. Menerima "0812-3456-7890", "+62 812 3456 7890",
 * "62812 3456 7890".
 */
export function wajibTelepon(v, field = "telepon") {
  const digit = teks(v).replace(/[^0-9]/g, "");
  const tanpa0 = digit.replace(/^0+/, "");
  const normal = tanpa0.startsWith("62") ? tanpa0 : `62${tanpa0}`;
  if (normal.length < 10 || normal.length > 15) {
    throw new ValidasiError(`Nomor ${field} tidak valid (contoh: 0812 3456 7890).`, field);
  }
  if (!normal.startsWith("628") && !normal.startsWith("629") && !normal.startsWith("622")) {
    // 628 = seluler, 62 2x = area Jakarta/Bandung dsb. Selain itu tetap
    // diterima selama panjangnya wajar, tapi dicatat lewat return apa adanya.
  }
  return normal;
}

/** Bersihkan nilai dari <script> dsb. — pertahanan berlapis, bukan pengganti escaping. */
export function tanpaHtml(v) {
  return teks(v).replace(/[<>]/g, "");
}

/**
 * Escape untuk konteks teks HTML. React sudah meng-escape render teks, jadi
 * fungsi ini hanya dipakai kalau ada nilai yang masuk ke atribut yang kita
 * rakit sendiri (mis. `data-label`) atau ke CSV.
 */
export function escHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Field CSV sesuai RFC 4180 + netralisasi formula (CSV injection).
 * Sel yang dimulai `= + - @` TAB atau CR bisa dieksekusi spreadsheet.
 */
export function csvField(v) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/["\n\r,]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Susun berkas CSV dari header + baris. */
export function keCsv(header, rows) {
  const garis = [header.map(csvField).join(",")];
  for (const r of rows) garis.push(r.map(csvField).join(","));
  return garis.join("\r\n");
}
