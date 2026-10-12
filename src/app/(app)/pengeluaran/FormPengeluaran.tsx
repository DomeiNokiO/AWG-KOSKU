"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert, Confirm, toast } from "@/components/ui/Feedback";
import { Input, Select, Textarea } from "@/components/ui/Form";
import type { BarisPengeluaran } from "@/lib/tipe-baris";
import { simpanPengeluaranAction, hapusPengeluaranAction, simpanKategoriAction, type Hasil } from "@/actions/keuangan";
import { rupiah, tanggal } from "@/lib/core/format.mjs";
import { DataTableServer, type Kolom } from "@/components/ui/DataTableServer";
import { ambilPengeluaran } from "@/actions/data";
import { Badge } from "@/components/ui/Badge";
import { useTransition } from "react";

/** Tabel pengeluaran server-side + hapus (peran pemilik/admin). */
export function TabelPengeluaran({ peran }: { peran: string }) {
  const [tanya, setTanya] = useState<BarisPengeluaran | null>(null);
  const [pending, mulai] = useTransition();
  const bolehHapus = peran === "pemilik" || peran === "admin";

  const kolom: Kolom<BarisPengeluaran>[] = [
    { kunci: "tgl", judul: "Tanggal", bisaUrut: true, sel: (r) => <span className="k-td-num">{tanggal(r.tgl)}</span> },
    { kunci: "keterangan", judul: "Keterangan", bisaUrut: true, sel: (r) => (
      <span>
        <span style={{ display: "block", fontWeight: 600 }}>{r.keterangan}</span>
        <span className="k-t-xs k-t-muted">{r.penerima || "—"}</span>
      </span>
    ) },
    { kunci: "kategori", judul: "Kategori", sel: (r) => <Badge tone="info">{r.kategori}</Badge> },
    { kunci: "jumlah", judul: "Jumlah", bisaUrut: true, sel: (r) => <span className="k-td-num k-td-strong">{rupiah(r.jumlah)}</span> },
  ];

  return (
    <>
      <DataTableServer
        kolom={kolom}
        ambilData={ambilPengeluaran}
        defaultSort="tgl"
        defaultOrder="desc"
        placeholderCari="Cari keterangan / penerima / kategori..."
        kosong="Belum ada pengeluaran tercatat."
        aksiBaris={bolehHapus ? (r) => (
          <Button jenis="danger-soft" ukuran="sm" ikon="trash" memuat={pending} onClick={() => setTanya(r)}>Hapus</Button>
        ) : undefined}
      />
      <Confirm
        buka={tanya !== null}
        judul="Hapus pengeluaran?"
        pesan={`"${tanya?.keterangan ?? ""}" senilai ${rupiah(tanya?.jumlah ?? 0)} akan dihapus permanen dan angka laporan ikut berubah.`}
        labelYa="Ya, hapus"
        onYa={() => {
          if (!tanya) return;
          mulai(async () => {
            const h = await hapusPengeluaranAction(tanya.id);
            toast(h.error ? { judul: "Gagal", pesan: h.error, nada: "danger" } : { judul: "Terhapus", pesan: h.sukses ?? "", nada: "ok" });
            setTanya(null);
          });
        }}
        onTidak={() => setTanya(null)}
      />
    </>
  );
}

export function ModalPengeluaran({ kategori, onTutup }: { kategori: { id: number; nama: string }[]; onTutup: () => void }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => simpanPengeluaranAction(undefined, fd),
    undefined,
  );
  const hari = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <Input label="Tanggal" name="tgl" type="date" defaultValue={hari} required />
      <Select label="Kategori" name="kategori_id" opsi={[{ nilai: "", label: "— Tanpa kategori —" }, ...kategori.map((k) => ({ nilai: String(k.id), label: k.nama }))]} />
      <Input label="Jumlah (Rp)" name="jumlah" inputMode="numeric" placeholder="150000" required />
      <Textarea label="Keterangan" name="keterangan" rows={2} maxLength={200} placeholder="Bayar listrik bulan ini" required />
      <Input label="Penerima / Mitra (opsional)" name="penerima" maxLength={80} />
      <div className="k-btn-block-group">
        <Button jenis="primary" type="submit" memuat={pending} ikon="check">Simpan</Button>
        <Button jenis="ghost" type="button" onClick={onTutup}>Batal</Button>
      </div>
    </form>
  );
}

export function ModalKategori({ onTutup }: { onTutup: () => void }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => simpanKategoriAction(undefined, fd),
    undefined,
  );
  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <Input label="Nama kategori" name="nama" maxLength={60} placeholder="Listrik, Air, Internet..." required />
      <div className="k-btn-block-group">
        <Button jenis="primary" type="submit" memuat={pending}>Simpan</Button>
        <Button jenis="ghost" type="button" onClick={onTutup}>Tutup</Button>
      </div>
    </form>
  );
}
