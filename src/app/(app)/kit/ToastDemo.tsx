"use client";

import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Feedback";

/** Toast butuh klien; dipisah dari halaman galeri yang server. */
export function ToastDemo() {
  return (
    <div className="k-row" style={{ flexWrap: "wrap" }}>
      <Button jenis="outline" ukuran="sm" onClick={() => toast({ judul: "Tersimpan", pesan: "Perubahan berhasil disimpan.", nada: "ok" })}>Toast sukses</Button>
      <Button jenis="outline" ukuran="sm" onClick={() => toast({ judul: "Gagal", pesan: "Periksa koneksi Anda.", nada: "danger" })}>Toast gagal</Button>
    </div>
  );
}
