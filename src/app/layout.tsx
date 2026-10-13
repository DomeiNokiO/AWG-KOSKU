import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ToastHost } from "@/components/ui/Feedback";
import "./globals.css";

/**
 * AWG-KOSKU — layout akar.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Judul & deskripsi berbahasa Indonesia, tema awal ditentukan oleh skrip kecil
 * bertanda nonce supaya tidak ada "kedipan" dari terang ke gelap saat halaman
 * dimuat. Nonce diambil dari header yang dipasang src/proxy.ts.
 */

export const metadata: Metadata = {
  title: { default: "AWG-KOSKU — Manajemen Kamar Kos", template: "%s · AWG-KOSKU" },
  description:
    "AWG-KOSKU: dashboard manajemen kamar kos — kamar, penyewa, tagihan, laporan, dan catatan dalam satu tempat.",
  applicationName: "AWG-KOSKU",
  authors: [{ name: "AWGNET-RACING & AGENT AI TEAM" }],
  keywords: ["kost", "kos", "manajemen kamar", "dashboard", "AWG-KOSKU"],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

/**
 * Skrip tema: dijalankan sebelum React supaya atribut `data-k-theme` sudah
 * ada saat paint pertama. Tanpa ini, halaman berkedip terang dulu lalu gelap.
 */
const SKRIP_TEMA = `(function(){try{
var s=localStorage.getItem('kosku-tema');
var g=window.matchMedia('(prefers-color-scheme: dark)').matches;
var t=(s==='gelap'||s==='terang')?s:(g?'gelap':'terang');
document.documentElement.setAttribute('data-k-theme',t);
}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="id" data-k-theme="terang" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
      </head>
      <body>
        <a className="k-skip" href="#konten">
          Lewati ke konten utama
        </a>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
