import "server-only";

/**
 * KOSKU-UI — pembacaan konfigurasi terpusat.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Kenapa satu modul, bukan `process.env` di mana-mana:
 * supaya nilai yang salah ketahuan SAAT BOOT (pesan jelas) dan bukan saat
 * request pertama jam 2 pagi. Semua keputusan "nilai ini boleh nggak" ada
 * di satu tempat yang bisa dibaca sekaligus.
 */

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

let envCache: ReturnType<typeof bacaEnv> | null = null;

/** Dipanggil sekali; nilai yang salah gagal di sini, bukan di tengah request. */
function bacaEnv() {
  const isProd = process.env.NODE_ENV === "production";

  const secretRaw = process.env.KOSKU_SESSION_SECRET?.trim();
  const secretDev = "kosku-dev-secret-hanya-untuk-pengembangan-lokal-32+";
  if (isProd && (!secretRaw || secretRaw.length < 32)) {
    throw new Error(
      "KOSKU_SESSION_SECRET wajib diisi (minimal 32 karakter) saat NODE_ENV=production. " +
        "Buat dengan: node -e \"console.log(require('node:crypto').randomBytes(48).toString('base64url'))\"",
    );
  }

  const cookieSecure = readBool("KOSKU_COOKIE_SECURE", isProd);

  return {
    isProd,
    isDev: !isProd,
    sessionSecret: secretRaw && secretRaw.length >= 32 ? secretRaw : secretDev,
    sessionTtlMs: readInt("KOSKU_SESSION_TTL_HOURS", 12) * 60 * 60 * 1000,
    dbPath: process.env.KOSKU_DB_PATH?.trim() || "./data/kosku.sqlite",
    /**
     * Flag `Secure` pada cookie sesi.
     *
     * Ini bukan sekadar "produksi harus true": kalau app dilayani lewat HTTP
     * biasa (IP LAN, tanpa TLS) sementara flag ini true, browser TIDAK PERNAH
     * mengirim cookie-nya kembali — login tampak berhasil lalu pengguna
     * langsung terlempar keluar, tanpa error apa pun. Jadi ikuti skema asli.
     */
    cookieSecure,
    /** Nama cookie: prefix `__Host-` hanya sah bila Secure aktif. */
    cookieName: cookieSecure ? "__Host-kosku_sesi" : "kosku_sesi",
    seedEmail: process.env.KOSKU_SEED_EMAIL?.trim() || "admin@kosku.id",
    seedPassword: process.env.KOSKU_SEED_PASSWORD || "kosku12345",
  };
}

/** Konfigurasi aplikasi. Dibaca malas (lazy) supaya tetap tidak bisa diakses klien. */
export const env = new Proxy({} as ReturnType<typeof bacaEnv>, {
  get(_t, key: string) {
    if (!envCache) envCache = bacaEnv();
    return (envCache as Record<string, unknown>)[key];
  },
});
