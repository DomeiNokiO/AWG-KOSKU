import { redirect } from "next/navigation";
import { Suspense } from "react";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, StatCard, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Feedback";
import { TabelTagihan } from "./TabelTagihan";

export const metadata = { title: "Pembayaran" };

/**
 * Halaman Pembayaran/Tagihan.
 * Tabel memuat datanya sendiri dari server (DataTableServer) — halaman ini
 * hanya menyediakan kartu ringkasan + kerangka, sehingga TTFB tetap cepat
 * walau jumlah tagihan besar.
 */
export default async function HalamanPembayaran() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const r = q.ringkasan(sesi.tier);

  return (
    <>
      <SectionTitle
        judul="Pembayaran & Tagihan"
        sub="Bayar parsial didukung: sisa tagihan tetap tercatat sampai lunas."
        aksi={<Badge tone="brand">{r.tagihanTerbuka} terbuka</Badge>}
      />

      <div className="k-grid k-grid-4">
        <StatCard nilai={r.omzetTertagih} label="Omzet Tertagih" ikon="receipt" warna="blue" />
        <StatCard nilai={r.pemasukanBulanIni} label="Diterima Bulan Ini" ikon="money-bill" warna="green" />
        <StatCard nilai={Math.max(0, r.omzetTertagih - r.pemasukanTotal)} label="Belum Diterima" ikon="clock" warna="orange" />
        <StatCard nilai={r.tunggakan} label="Tunggakan" ikon="alert-triangle" warna="red" catatan="lewat jatuh tempo" />
      </div>

      <Card>
        <Suspense fallback={<div style={{ padding: 24 }}><Spinner /></div>}>
          <TabelTagihan peran={sesi.peran} />
        </Suspense>
      </Card>
    </>
  );
}
