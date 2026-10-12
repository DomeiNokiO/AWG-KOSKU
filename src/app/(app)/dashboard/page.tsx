import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { StatCard, Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";
import { GrafikPemasukan } from "../laporan/GrafikPemasukan";
import { TabelTempo } from "@/components/kosku/TabelTempo";
import { rupiah, namaBulan, tanggal, persen } from "@/lib/core/format.mjs";

/**
 * KOSKU-UI — halaman Dashboard.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Empat kartu statistik atas, banner kuota tier, grafik pemasukan enam
 * bulan, dan tabel jatuh tempo. Semua angka diambil dari database pada
 * setiap permintaan (lihat catatan sesi di layout) — tidak ada angka
 * hardcoded yang bisa basi.
 */
export const metadata = { title: "Dashboard" };

export default async function HalamanDashboard() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const r = q.ringkasan(sesi.tier);
  const belumLunas = q.tagihanBelumLunas(50);
  const pemasukan = q.pemasukanPerBulan(6);

  const sisaKuota = Math.max(0, r.kuota - r.totalKamar);

  return (
    <>
      <SectionTitle judul="Ringkasan" sub={`Data ${namaBulan()} · selamat datang kembali, ${sesi.nama.split(" ")[0]}.`} />

      <div className="k-grid k-grid-4">
        <StatCard nilai={r.totalKamar} label="Total Kamar" ikon="clipboard" warna="blue" />
        <StatCard nilai={r.kamarTerisi} label="Kamar Terisi" ikon="bed" warna="green" tren={r.kamarKosong > 0 ? { arah: "up", teks: `${r.kamarKosong} kosong` } : undefined} />
        <StatCard nilai={r.kamarKosong} label="Kamar Kosong" ikon="door" warna="orange" tren={r.kamarKosong > 0 ? { arah: "down", teks: `${r.penyewaAktif} penyewa aktif` } : undefined} />
        <StatCard nilai={rupiah(r.pemasukanBulanIni)} label="Pemasukan Bulan Ini" ikon="money-bill" warna="violet" catatan={r.tunggakan > 0 ? `${r.tunggakan} tunggakan` : "tidak ada tunggakan"} />
      </div>

      {/* Banner kuota tier — persis referensi desain */}
      <section className="k-banner" aria-label="Kuota kamar">
        <div className="k-banner-body">
          <p className="k-banner-kicker">
            <Icon name="gauge" size="sm" /> Kuota Kamar — Tier {sesi.tier === "free" ? "Free" : sesi.tier}
          </p>
          <p className="k-banner-val">
            {r.totalKamar} / {r.kuota} Kamar
          </p>
          <p className="k-banner-note">
            {sisaKuota > 0 ? `Sisa ${sisaKuota} kamar lagi` : "Kuota penuh — upgrade tier untuk menambah kamar"}
          </p>
          <Progress nilai={persen(r.totalKamar, r.kuota)} diAtasGelap label="Pemakaian kuota kamar" />
        </div>
        <div className="k-banner-cta">
          <a href="/setting" className="k-btn k-btn-warn k-btn-pill k-btn-lg">
            <Icon name="zap" size="sm" /> Upgrade Sekarang
          </a>
        </div>
      </section>

      <div className="k-grid k-grid-2">
        <Card>
          <CardHeadBulan />
          <CardBody>
            {/* GrafikPemasukan "use client": fungsi format tidak boleh
                dikirim lintas Server -> Client Component. */}
            <GrafikPemasukan
              data={pemasukan.map((p) => ({ label: p.periode.slice(5) + "/" + p.periode.slice(2, 4), nilai: p.total }))}
            />
          </CardBody>
        </Card>

        <Card>
          <div className="k-card-head">
            <div className="k-grow">
              <h2 className="k-card-title">
                <Icon name="wallet" size="sm" />
                <span>Tagihan Bulan Ini</span>
              </h2>
            </div>
            <Badge tone="warn">{r.tagihanTerbuka} terbuka</Badge>
          </div>
          <CardBody rapat>
            <dl className="k-dl">
              <div className="k-dl-item">
                <dt>Omzet ditagih</dt>
                <dd>{rupiah(r.omzetTertagihBulanIni)}</dd>
              </div>
              <div className="k-dl-item">
                <dt>Sudah dibayar</dt>
                <dd>{rupiah(r.pemasukanBulanIni)}</dd>
              </div>
              <div className="k-dl-item">
                <dt>Belum dibayar</dt>
                <dd>{rupiah(Math.max(0, r.omzetTertagihBulanIni - r.pemasukanBulanIni))}</dd>
              </div>
              <div className="k-dl-item">
                <dt>Total tagihan terbuka</dt>
                <dd>{r.tagihanTerbuka}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      <Card>
        <TabelTempo baris={belumLunas} />
      </Card>
    </>
  );
}

function CardHeadBulan() {
  return (
    <div className="k-card-head">
      <div className="k-grow">
        <h2 className="k-card-title">
          <Icon name="chart-line" size="sm" />
          <span>Pemasukan 6 Bulan Terakhir</span>
        </h2>
      </div>
      <span className="k-t-sm k-t-muted">{tanggal(new Date().toISOString().slice(0, 10))}</span>
    </div>
  );
}