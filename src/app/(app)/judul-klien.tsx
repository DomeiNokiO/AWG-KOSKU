"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/kosku/Topbar";
import type { Sesi } from "@/lib/sesi";

/**
 * KOSKU-UI — judul topbar yang mengikuti rute.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Peta judul di sini HANYA untuk tampilan. Rute yang tidak dikenal memakai
 * judul netral, bukan menebak-nebak dari potongan URL.
 */

const JUDUL: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/kamar": "Kamar",
  "/penyewa": "Penyewa",
  "/pembayaran": "Pembayaran",
  "/laporan": "Laporan",
  "/aktivitas": "Aktivitas",
  "/catatan": "Catatan",
  "/laporan-bug": "Laporan Bug",
  "/setting": "Setting",
  "/kit": "UI Kit",
};

export function JudulKlien({ sesi }: { sesi: Sesi }) {
  const path = usePathname();
  const judul = JUDUL[path] ?? JUDUL[Object.keys(JUDUL).find((k) => path.startsWith(`${k}/`)) ?? ""] ?? "KOSKU";
  return <Topbar sesi={sesi} judul={judul} />;
}
