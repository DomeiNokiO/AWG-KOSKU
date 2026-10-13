import { redirect } from "next/navigation";
import { sesiSekarang, type Sesi } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Sidebar } from "@/components/kosku/Sidebar";
import { JudulKlien } from "./judul-klien";

/**
 * AWG-KOSKU — kerangka halaman aplikasi (butuh sesi).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Pemeriksaan sesi sengaja dilakukan DUA kali: di src/proxy.ts (pintasan
 * cepat, hanya melihat keberadaan cookie) dan di sini (verifikasi tanda
 * tangan HMAC + baca ulang peran dari database). Yang menentukan adalah yang
 * di sini — proxy tidak pernah menjadi lapisan otorisasi.
 *
 * Catatan Next.js 16: `cookies()` asinkron, sehingga seluruh sub-pohon ini
 * dirender per permintaan; tidak ada halaman terautentikasi yang tersimpan
 * sebagai hasil statis.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesi: Sesi | null = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const ringkas = q.ringkasan(sesi.tier);

  return (
    <div className="k-app">
      <Sidebar sesi={sesi} tunggakan={ringkas.tunggakan} />
      <div className="k-shell">
        <JudulKlien sesi={sesi} />
        <main className="k-app-main" id="konten">
          {children}
        </main>
      </div>
    </div>
  );
}
