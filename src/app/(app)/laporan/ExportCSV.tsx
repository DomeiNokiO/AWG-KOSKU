"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Feedback";

/**
 * Export CSV laporan. Klien hanya meminta URL; isi CSV disusun dan
 * divalidasi di Route Handler (server) — klien tidak pernah merakit
 * formula yang bisa dieksekusi (mencegah CSV formula injection).
 */
export function ExportCSV({ dari, sampai }: { dari: string; sampai: string }) {
  const [pending, mulai] = useTransition();
  return (
    <Button
      jenis="outline"
      ikon="download"
      memuat={pending}
      onClick={() => mulai(async () => {
        try {
          const res = await fetch(`/api/laporan/csv?dari=${encodeURIComponent(dari)}&sampai=${encodeURIComponent(sampai)}`);
          if (!res.ok) throw new Error("Gagal");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `laporan-${dari}-${sampai}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        } catch {
          toast({ judul: "Export gagal", pesan: "Coba lagi sebentar lagi.", nada: "danger" });
        }
      })}
    >
      Export CSV
    </Button>
  );
}
