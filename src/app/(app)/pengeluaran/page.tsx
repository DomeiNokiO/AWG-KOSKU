import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, StatCard, SectionTitle } from "@/components/ui/Card";
import { TabelPengeluaran } from "./FormPengeluaran";
import { ToolbarPengeluaran } from "./Toolbar";
import { rupiah } from "@/lib/core/format.mjs";

export const metadata = { title: "Pengeluaran" };

export default async function HalamanPengeluaran() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const kategori = q.daftarKategoriPengeluaran().filter((k) => k.aktif === 1);
  const hariIni = new Date().toISOString().slice(0, 10);
  const bulan = hariIni.slice(0, 7);
  const arus = q.arusKas({ dari: `${bulan}-01`, sampai: hariIni });

  return (
    <>
      <SectionTitle judul="Pengeluaran" sub="Kas keluar operasional kos — semua angka ikut masuk laporan arus kas." />

      <div className="k-grid k-grid-3">
        <StatCard nilai={rupiah(arus.pemasukan)} label="Pemasukan Bulan Ini" ikon="arrow-down-left" warna="green" />
        <StatCard nilai={rupiah(arus.pengeluaran)} label="Pengeluaran Bulan Ini" ikon="arrow-up-right" warna="orange" />
        <StatCard nilai={rupiah(arus.bersih)} label="Arus Kas Bersih" ikon="wallet" warna={arus.bersih >= 0 ? "blue" : "red"} />
      </div>

      <Card>
        <ToolbarPengeluaran kategori={kategori} peran={sesi.peran} />
        <TabelPengeluaran peran={sesi.peran} />
      </Card>
    </>
  );
}
