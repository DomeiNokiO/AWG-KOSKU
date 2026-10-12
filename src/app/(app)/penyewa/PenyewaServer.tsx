"use client";



import { DataTableServer, type Kolom } from "@/components/ui/DataTableServer";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Icon";
import { rupiah, tanggal } from "@/lib/core/format.mjs";
import { ambilPenyewa } from "./server";
import type { PenyewaRingkas } from "@/lib/db";

export function PenyewaServer({ penyewa }: { penyewa: PenyewaRingkas[] }) {
  const kolom: Kolom<any>[] = [
    { kunci: "nama", judul: "Penyewa", sel: (p:any)=>(<span className="k-td-tenant"><Avatar nama={p.nama} size="sm"/><span><span style={{display:"block"}}>{p.nama}</span><span className="k-t-xs k-t-muted" style={{display:"block"}}>{p.telepon}</span></span></span>), bisaUrut: true },
    { kunci: "kamar", judul: "Kamar", sel: (p:any)=><span className="k-td-strong">{p.kamar??"-"}</span>, bisaUrut: true },
    { kunci: "tanggal_masuk", judul: "Masuk", sel: (p:any)=><span className="k-td-num">{tanggal(p.tanggal_masuk)}</span>, bisaUrut: true },
    { kunci: "status", judul: "Status", sel: (p:any)=><Badge tone={p.status==="aktif"?"ok":"netral"}>{p.status==="aktif"?"Aktif":"Keluar"}</Badge>, bisaUrut: true },
    { kunci: "tagihan_terbuka", judul: "Tagihan", sel: (p:any)=><span className={p.tagihan_terbuka>0?"k-td-num k-td-strong":"k-td-num k-t-muted"}>{p.tagihan_terbuka>0?rupiah(p.tagihan_terbuka):"Lunas"}</span>, bisaUrut: true },
  ];
  return <DataTableServer kolom={kolom} ambilData={ambilPenyewa} defaultSort="id" defaultOrder="desc" placeholderCari="Cari nama/kamar/telepon..." kosong="Belum ada penyewa"/>;
}