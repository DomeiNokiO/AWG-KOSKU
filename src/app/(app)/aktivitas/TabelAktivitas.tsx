"use client";

import { DataTableServer, type Kolom } from "@/components/ui/DataTableServer";
import { Badge } from "@/components/ui/Badge";
import { ambilAktivitas } from "@/actions/data";
import { tanggal } from "@/lib/core/format.mjs";
import type { BarisAktivitas } from "@/lib/tipe-baris";

const NADA: Record<string, "ok" | "warn" | "bad" | "info" | "netral"> = {
  bayar: "ok",
  lunas: "ok",
  "generate-tagihan": "info",
  pengeluaran: "warn",
  "hapus-pengeluaran": "bad",
  "batalkan-bayar": "bad",
  pengaturan: "info",
  masuk: "info",
  keluar: "netral",
};

export function TabelAktivitas() {
  const kolom: Kolom<BarisAktivitas>[] = [
    { kunci: "dibuat_pada", judul: "Waktu", bisaUrut: true, sel: (r) => <span className="k-td-num">{tanggal(String(r.dibuat_pada).slice(0, 10))} {String(r.dibuat_pada).slice(11, 16)}</span> },
    { kunci: "nama", judul: "Oleh", bisaUrut: false, sel: (r) => r.nama ?? "Sistem" },
    {
      kunci: "aksi",
      judul: "Aksi",
      bisaUrut: true,
      sel: (r) => <Badge tone={NADA[r.aksi] ?? "netral"}>{r.aksi}</Badge>,
    },
    { kunci: "detail", judul: "Detail", sel: (r) => <span className="k-t-sm">{r.detail || "—"}</span> },
    { kunci: "ip", judul: "IP", sel: (r) => <span className="k-t-xs k-t-muted">{r.ip}</span> },
  ];

  return (
    <DataTableServer
      kolom={kolom}
      ambilData={ambilAktivitas}
      defaultSort="id"
      defaultOrder="desc"
      placeholderCari="Cari aksi / detail / nama..."
      kosong="Belum ada aktivitas tercatat."
    />
  );
}
