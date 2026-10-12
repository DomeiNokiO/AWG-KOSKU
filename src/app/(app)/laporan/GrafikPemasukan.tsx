"use client";

import { BarChart } from "@/components/ui/DataDisplay";

/**
 * KOSKU-UI — grafik pemasukan per bulan.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * "use client" karena fungsi `format` tidak boleh dikirim lintas batas
 * Server -> Client Component (React Flight hanya data serializable).
 * Server cukup mengirim [{label, nilai}] — unit singkat ditentukan di sini.
 */
export function GrafikPemasukan({
  data,
}: {
  data: { label: string; nilai: number }[];
}) {
  return (
    <BarChart
      data={data}
      format={(n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : `${Math.round(n / 1000)}rb`)}
      label="Pemasukan enam bulan terakhir"
    />
  );
}
