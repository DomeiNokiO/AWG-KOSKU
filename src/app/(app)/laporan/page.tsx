import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, StatCard, SectionTitle, CardHead, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart, DataTable, type Kolom } from "@/components/ui/DataDisplay";
import { rupiah, persen } from "@/lib/core/format.mjs";
import type { BarisAging } from "@/lib/tipe-baris";
import { ExportCSV } from "./ExportCSV";
import { FilterTanggal } from "./FilterTanggal";

export const metadata = { title: "Laporan" };

/**
 * Laporan keuangan: arus kas per rentang tanggal, aging tunggakan,
 * okupansi kamar. Semua angka dihitung server-side pada request —
 * tidak ada agregasi di klien.
 */
export default async function HalamanLaporan({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const sp = await searchParams;
  const hariIni = new Date().toISOString().slice(0, 10);
  const bulanIni = hariIni.slice(0, 7);
  const dari = sp.dari || `${bulanIni}-01`;
  const sampai = sp.sampai || hariIni;

  const kas = q.arusKas({ dari, sampai });
  const aging = q.agingTunggakan();
  const okup = q.okupansi();
  const perBulan = q.pemasukanPeriode(6);

  const totalKamar = okup.reduce((a, b) => a + Number(b.jumlah), 0) || 1;
  const terisi = okup.find((o) => o.status === "terisi")?.jumlah ?? 0;
  const denda = q.hitungDenda(0);

  // DataTable (client) mewajibkan `nilai` (teks, untuk cari/urut) + `sel` (tampilan).
  const kolomAging: Kolom<BarisAging>[] = [
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

  return (
    <>
      <SectionTitle
        judul="Laporan"
        sub="Arus kas, tunggakan, dan okupansi — satu halaman untuk evaluasi bulanan."
        aksi={<ExportCSV dari={dari} sampai={sampai} />}
      />

      <FilterTanggal dari={dari} sampai={sampai} />

      <div className="k-grid k-grid-4">
        <StatCard nilai={rupiah(kas.pemasukan)} label={`Pemasukan ${dari} → ${sampai}`} ikon="arrow-down-left" warna="green" />
        <StatCard nilai={rupiah(kas.pengeluaran)} label="Pengeluaran" ikon="arrow-up-right" warna="orange" />
        <StatCard nilai={rupiah(kas.bersih)} label="Arus Kas Bersih" ikon="wallet" warna={kas.bersih >= 0 ? "blue" : "red"} />
        <StatCard nilai={persen(terisi, totalKamar)} label="Okupansi" ikon="bed" warna="violet" catatan={`${terisi}/${totalKamar} kamar terisi`} />
      </div>

      <div className="k-grid k-grid-2">
        <Card>
          <CardHead judul="Pemasukan 6 Bulan" ikon="chart-line" />
          <CardBody>
            <BarChart
              data={perBulan.map((p) => ({ label: p.periode.slice(5) + "/" + p.periode.slice(2, 4), nilai: p.total }))}
              format={(n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}jt` : `${Math.round(n / 1000)}rb`)}
              label="Pemasukan enam bulan terakhir"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHead judul="Pengeluaran per Kategori" ikon="pie" />
          <CardBody rapat>
            {kas.perKategori.length === 0 ? (
              <p className="k-t-center k-t-muted" style={{ padding: 24 }}>Tidak ada pengeluaran pada rentang ini.</p>
            ) : (
              <dl className="k-dl">
                {kas.perKategori.map((k) => (
                  <div className="k-dl-item" key={k.kategori}>
                    <dt>{k.kategori}</dt>
                    <dd>{rupiah(k.total)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHead judul="Aging Tunggakan" ikon="alert-triangle" aksi={
          <div className="k-row-sm">
            {(Object.entries(aging.kelompok) as [string, { jumlah: number; total: number }][]).map(([k, v]) => (
              <Badge key={k} tone={v.total > 0 ? "bad" : "netral"}>{k}: {v.jumlah}</Badge>
            ))}
          </div>
        } />
        <DataTable kolom={kolomAging} baris={aging.baris} kosong="Tidak ada tunggakan. 🎉" />
      </Card>

      {denda.length > 0 && (
        <Card>
          <CardHead judul="Denda Keterlambatan" ikon="clock" sub="Berdasarkan konfigurasi denda per hari." />
          <CardBody rapat>
            <dl className="k-dl">
              {denda.slice(0, 20).map((d) => (
                <div className="k-dl-item" key={d.id}>
                  <dt>{d.nama} · {d.kamar ?? "-"} ({d.telat_hari} hari)</dt>
                  <dd>{rupiah(d.denda)}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      )}
    </>
  );
}
