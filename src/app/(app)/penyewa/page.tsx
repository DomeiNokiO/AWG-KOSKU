import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PenyewaList } from "@/components/kosku/PenyewaList";

export const metadata = { title: "Penyewa" };

export default async function HalamanPenyewa() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const penyewa = q.daftarPenyewa({ status: "semua" });

  return (
    <>
      <SectionTitle
        judul="Penyewa"
        sub="Cari, tandai keluar, atau daftarkan penyewa baru."
        aksi={<Badge tone="brand">{penyewa.filter((p) => p.status === "aktif").length} aktif</Badge>}
      />
      <Card>
        <PenyewaList penyewa={penyewa} />
      </Card>
    </>
  );
}