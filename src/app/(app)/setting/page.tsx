import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, SectionTitle, CardHead } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FormPengaturan } from "./FormPengaturan";
import { FormGantiSandi } from "./FormGantiSandi";
import { QuotaTier } from "@/components/kosku/QuotaTier";

export const metadata = { title: "Pengaturan" };

/**
 * Pengaturan: profil kos, denda, template WhatsApp, dan ganti sandi.
 * Panel sensitif hanya dirender untuk peran yang berhak (pemilik/admin).
 */
export default async function HalamanSetting() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const pengaturan = q.pengaturanKos();
  const denda = q.konfigDenda();
  const bolehUbah = sesi.peran === "pemilik" || sesi.peran === "admin";

  return (
    <>
      <SectionTitle
        judul="Pengaturan"
        sub="Profil kos, aturan denda, template pesan, dan keamanan akun."
        aksi={<Badge tone={sesi.peran === "pemilik" ? "info" : sesi.peran === "admin" ? "warn" : "netral"}>Peran: {sesi.peran}</Badge>}
      />

      <div className="k-grid k-grid-2">
        <Card>
          <CardHead judul="Profil Kos" ikon="home" sub="Dipakai di dashboard, laporan, dan pesan WhatsApp." />
          <div className="k-card-body">
            {bolehUbah ? (
              <FormPengaturan awal={pengaturan} denda={denda} />
            ) : (
              <p className="k-t-sm k-t-muted">Peran Anda hanya bisa melihat. Hubungi pemilik untuk mengubah pengaturan.</p>
            )}
          </div>
        </Card>

        <div className="k-col">
          <Card>
            <CardHead judul="Akun" ikon="user" sub={sesi.email} />
            <div className="k-card-body">
              <FormGantiSandi />
            </div>
          </Card>
          <QuotaTier tier={sesi.tier} />
        </div>
      </div>
    </>
  );
}
