import { redirect } from "next/navigation";
import { Suspense } from "react";
import { sesiSekarang } from "@/lib/sesi";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Feedback";
import { TabelAktivitas } from "./TabelAktivitas";

export const metadata = { title: "Aktivitas" };

/** Jejak audit: siapa melakukan apa, kapan, dari IP mana. */
export default async function HalamanAktivitas() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  return (
    <>
      <SectionTitle judul="Aktivitas" sub="Jejak audit operasi penting (bayar, generate, hapus, pengaturan)." />
      <Card>
        <Suspense fallback={<div style={{ padding: 24 }}><Spinner /></div>}>
          <TabelAktivitas />
        </Suspense>
      </Card>
    </>
  );
}
