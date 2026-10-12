import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Feedback";
import { FormBug, UbahStatusBug } from "./FormBug";

export const metadata = { title: "Laporan Bug" };

const NADA: Record<string, "bad" | "warn" | "ok" | "netral"> = {
  baru: "bad",
  diproses: "warn",
  selesai: "ok",
  ditolak: "netral",
};

export default async function HalamanBug() {
  const sesi = await sesiSekarang();
  if (!sesi) redirect("/masuk");

  const daftar = q.daftarLaporanBug(50);
  const boleh = sesi.peran === "pemilik" || sesi.peran === "admin";

  return (
    <>
      <SectionTitle judul="Laporan Bug" sub="Laporkan halaman yang error atau data yang tidak sesuai." />
      <div className="k-grid k-grid-2">
        <Card><div className="k-card-body"><FormBug /></div></Card>
        <div className="k-col">
          {daftar.length === 0 ? (
            <Card><EmptyState judul="Belum ada laporan" pesan="Laporan pertama Anda akan muncul di sini." ikon="bug" /></Card>
          ) : (
            daftar.map((b) => (
              <Card key={b.id}>
                <div className="k-card-body">
                  <div className="k-between">
                    <strong>{b.judul}</strong>
                    <Badge tone={NADA[b.status] ?? "netral"}>{b.status}</Badge>
                  </div>
                  <p className="k-t-sm k-t-muted" style={{ marginTop: 6 }}>{b.isi}</p>
                  <div className="k-between" style={{ marginTop: 8 }}>
                    <span className="k-t-xs k-t-faint">{b.pelapor || "Anonim"} · {b.halaman || "-"} · {b.dibuat_pada}</span>
                    {boleh && b.status !== "selesai" && <UbahStatusBug id={b.id} />}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
