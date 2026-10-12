import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, StatCard, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { KamarGrid } from "@/components/kosku/KamarGrid";

export const metadata = { title: "Kamar" };

export default async function HalamanKamar() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const kamar = q.ringkasKamar();
  const r = q.ringkasan(sesi.tier);

  return (
    <>
      <SectionTitle
        judul="Kamar"
        sub="Status dihitung otomatis dari penyewa aktif — tanpa mengetik dua kali."
      />

      <div className="k-grid k-grid-4">
        <StatCard nilai={r.totalKamar} label="Total Kamar" ikon="grid" warna="blue" />
        <StatCard nilai={r.kamarTerisi} label="Terisi" ikon="bed" warna="green" />
        <StatCard nilai={r.kamarKosong} label="Kosong" ikon="door" warna="orange" />
        <StatCard nilai={r.kamarPerbaikan} label="Perbaikan" ikon="wrench" warna="red" />
      </div>

      {kamar.length === 0 ? (
        <Card>
          <EmptyState
            judul="Belum ada kamar"
            pesan="Tambahkan kamar pertama Anda lewat tombol di pojok kanan bawah (FAB)."
            ikon="bed"
          />
        </Card>
      ) : (
        <KamarGrid kamar={kamar} />
      )}
    </>
  );
}