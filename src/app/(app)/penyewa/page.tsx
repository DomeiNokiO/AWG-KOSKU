import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PenyewaServer } from "./PenyewaServer";

export const metadata = { title: "Penyewa" };

export default async function HalamanPenyewa() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");
  const penyewa = q.daftarPenyewa({ status: "semua" });
  return (
    <>
      <SectionTitle judul="Penyewa" sub="Cari, urut & paginasi server-side" aksi={<Badge tone="brand">{penyewa.length} total</Badge>} />
      <Card><PenyewaServer penyewa={penyewa as any} /></Card>
    </>
  );
}