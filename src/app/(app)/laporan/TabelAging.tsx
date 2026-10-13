"use client";

import { DataTable, type Kolom } from "@/components/ui/DataDisplay";
import { Badge } from "@/components/ui/Badge";
import { rupiah } from "@/lib/core/format.mjs";
import type { BarisAging } from "@/lib/tipe-baris";

/**
 * AWG-KOSKU — tabel aging tunggakan.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * "use client" WAJIB di sini: daftar kolom berisi fungsi (nilai/sel) tidak
 * boleh dikirim dari Server Component ke Client Component (React Flight
 * hanya meneruskan data serializable). Karena kolom dibuat di dalam komponen
 * ini sendiri, halaman laporan cukup meneruskan BARIS (data).
 */
export function TabelAging({ baris }: { baris: BarisAging[] }) {
  const kolom: Kolom<BarisAging>[] = [
    { kunci: "nama", judul: "Penyewa", nilai: (b) => b.nama, sel: (b) => b.nama },
    { kunci: "kamar", judul: "Kamar", nilai: (b) => b.kamar ?? "-", sel: (b) => b.kamar ?? "-" },
    { kunci: "periode", judul: "Periode", nilai: (b) => b.periode, sel: (b) => b.periode },
    {
      kunci: "telat_hari",
      judul: "Telat",
      nilai: (b) => b.telat_hari,
      sel: (b) => <Badge tone={b.telat_hari > 30 ? "bad" : b.telat_hari > 7 ? "warn" : "netral"}>{b.telat_hari} hari</Badge>,
    },
    {
      kunci: "sisa",
      judul: "Sisa",
      nilai: (b) => b.sisa,
      sel: (b) => <span className="k-td-num k-td-strong">{rupiah(b.sisa)}</span>,
    },
  ];
  return <DataTable kolom={kolom} baris={baris} kosong="Tidak ada tunggakan. 🎉" />;
}
