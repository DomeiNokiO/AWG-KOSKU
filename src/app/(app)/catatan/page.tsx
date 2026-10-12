import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { FormCatatan, HapusCatatan } from "./FormCatatan";

export const metadata = { title: "Catatan" };

export default async function HalamanCatatan() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const daftar = q.daftarCatatan(50);

  return (
    <>
      <SectionTitle judul="Catatan" sub="Catatan bebas: pengingat perbaikan, janji penyewa, dan lainnya." />
      <div className="k-grid k-grid-2">
        <Card>
          <div className="k-card-body">
            <FormCatatan />
          </div>
        </Card>
        <div className="k-col">
          {daftar.length === 0 ? (
            <Card><EmptyState judul="Belum ada catatan" pesan="Tulis catatan pertama di panel kiri." ikon="note" /></Card>
          ) : (
            daftar.map((c) => (
              <Card key={c.id}>
                <div className="k-card-body">
                  <div className="k-between">
                    <strong>{c.judul}</strong>
                    <HapusCatatan id={c.id} />
                  </div>
                  <p className="k-t-sm k-t-muted" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{c.isi}</p>
                  <p className="k-t-xs k-t-faint" style={{ marginTop: 8 }}>{c.dibuat_pada}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
