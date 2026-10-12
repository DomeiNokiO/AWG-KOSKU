import { NextResponse, type NextRequest } from "next/server";

/**
 * KOSKU-UI — proxy (dulu bernama "middleware" sebelum Next.js 16).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Tugasnya HANYA dua hal:
 *   1. membuat nonce CSP baru untuk setiap permintaan dan memasang header
 *      Content-Security-Policy (dibaca Next.js untuk menempelkan nonce ke
 *      seluruh <script> yang dirender);
 *   2. mengarahkan pengunjung tanpa sesi dari halaman aplikasi ke /masuk,
 *      supaya tidak perlu menunggu render penuh.
 *
 * PENTING: ini bukan lapisan otorisasi. Proxy tidak memverifikasi tanda
 * tangan cookie dengan aman di setiap edge runtime dan tidak boleh jadi
 * satu-satunya penjaga. Setiap Server Action & Route Handler memanggil
 * `wajibSesi()` sendiri — lihat src/lib/sesi.ts.
 */

/** Cek "ada cookie sesi" tanpa mengklaim sudah memverifikasinya. */
function punyaCookieSesi(req: NextRequest): boolean {
  for (const nama of ["kosku_sesi", "__Host-kosku_sesi"]) {
    if (req.cookies.get(nama)?.value) return true;
  }
  return false;
}

const RUTE_PUBLIK = ["/masuk", "/api/auth/logout"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // --- 1. Nonce + CSP ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  // --- 2. Pintasan halaman aplikasi tanpa sesi ---
  const publik = RUTE_PUBLIK.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!publik && !punyaCookieSesi(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.search = pathname === "/" ? "" : `?lanjut=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    redirect.headers.set("x-nonce", nonce);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Semua rute kecuali berkas statis Next, gambar, favicon, dan aset publik
     * (ikon/font) — aset tidak butuh CSP dan tidak boleh menghabiskan nonce.
     */
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icons.svg|fonts/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
