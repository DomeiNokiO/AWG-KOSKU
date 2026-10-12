"use client";

import { DataTableServer, type Kolom } from "@/components/ui/DataTableServer";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Icon";
import { rupiah, tanggal } from "@/lib/core/format.mjs";
import { ambilPenyewa } from "./server";
import type { PenyewaRingkas } from "@/lib/db";

/**
 * KOSKU-UI — tabel penyewa server-side.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Bentuk baris = PenyewaRingkas (daftarRingkas di core/db.mjs) — tanpa
 * `any`, supaya perubahan kolom ketahuan saat type-check.
 */
export function PenyewaServer() {
  const kolom: Kolom<PenyewaRingkas>[] = [
    {
      kunci: "nama",
      judul: "Penyewa",
      bisaUrut: true,
      sel: (p) => (
        <span className="k-td-tenant">
          <Avatar nama={p.nama} size="sm" />
          <span>
            <span style={{ display: "block" }}>{p.nama}</span>
            <span className="k-t-xs k-t-muted" style={{ display: "block" }}>{p.telepon}</span>
          </span>
        </span>
      ),
    },
    { kunci: "kamar", judul: "Kamar", bisaUrut: true, sel: (p) => <span className="k-td-strong">{p.kamar ?? "-"}</span> },
    { kunci: "tanggal_masuk", judul: "Masuk", bisaUrut: true, sel: (p) => <span className="k-td-num">{tanggal(p.tanggal_masuk)}</span> },
    { kunci: "status", judul: "Status", bisaUrut: true, sel: (p) => <Badge tone={p.status === "aktif" ? "ok" : "netral"}>{p.status === "aktif" ? "Aktif" : "Keluar"}</Badge> },
    {
      kunci: "tagihan_terbuka",
      judul: "Tagihan",
      bisaUrut: true,
      sel: (p) => (
        <span className={p.tagihan_terbuka > 0 ? "k-td-num k-td-strong" : "k-td-num k-t-muted"}>
          {p.tagihan_terbuka > 0 ? rupiah(p.tagihan_terbuka) : "Lunas"}
        </span>
      ),
    },
  ];
  return (
    <DataTableServer
      kolom={kolom}
      ambilData={ambilPenyewa}
      defaultSort="id"
      defaultOrder="desc"
      placeholderCari="Cari nama/kamar/telepon..."
      kosong="Belum ada penyewa"
    />
  );
}
