import type { NextConfig } from "next";

/**
 * KOSKU-UI — konfigurasi Next.js
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Keputusan keamanan di file ini:
 * - poweredByHeader: false  -> matikan `X-Powered-By` (fingerprinting).
 * - CSP nonce dibuat per-request oleh src/proxy.ts (Next 16 memakai nama
 *   "proxy", bukan "middleware" lagi), jadi kita tidak butuh 'unsafe-inline'.
 * - remotePatterns tidak diisi sama sekali: tidak ada gambar remote, jadi
 *   tidak ada jalur SSRF lewat image optimizer.
 */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // nonce CSP dipasang per-request -> render tidak boleh di-cache statis.
  cacheComponents: false,
  // Tidak ada `eslint.ignoreDuringBuilds` / `typescript.ignoreBuildErrors`:
  // build wajib gagal saat ada error tipe atau lint — biar tidak lolos diam-diam.
  // Next 16 (Turbopack) juga sudah tidak lagi memakai kunci `eslint` di config.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains",
                },
              ]),
        ],
      },
      {
        // Aset statis di-immutable-kan oleh Next; pastikan ikon & font
        // tidak di-cache terlalu lama saat pengembangan.
        source: "/icons.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
