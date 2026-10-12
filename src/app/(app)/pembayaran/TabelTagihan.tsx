"use client";

import { useMemo, useState, useActionState, useTransition } from "react";
import { DataTableServer, type Kolom } from "@/components/ui/DataTableServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, Confirm, toast, Alert } from "@/components/ui/Feedback";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { rupiah, tanggal } from "@/lib/core/format.mjs";
import { ambilTagihan } from "@/actions/data";
import { bayarTagihanAction, pelunasanPenuhAction, generateTagihanAction, type Hasil } from "@/actions/keuangan";
import { useSearchParams } from "next/navigation";
import type { BarisTagihan } from "@/lib/tipe-baris";

/**
 * Tabel tagihan server-side + aksi bayar parsial.
 * Filter status diambil dari URL (?status=) supaya bisa dibagikan/di-bookmark.
 * Semua aksi uang memakai Server Action dengan `wajibSesi` di server — peran
 * yang tidak sah ditolak di sisi server, bukan lewat sembunyinya tombol.
 */
export function TabelTagihan({ peran }: { peran: string }) {
  const sp = useSearchParams();
  const [bukaBayar, setBukaBayar] = useState<BarisTagihan | null>(null);
  const [bukaGenerate, setBukaGenerate] = useState(false);
  const [kuitansi, setKuitansi] = useState<BarisTagihan | null>(null);
  const [pending, mulai] = useTransition();

  const bolehOperasi = peran === "pemilik" || peran === "admin";

  const kolom: Kolom<BarisTagihan>[] = useMemo(() => [
    { kunci: "nama", judul: "Penyewa", bisaUrut: true, sel: (r) => (
      <span>
        <span style={{ display: "block", fontWeight: 600 }}>{r.nama}</span>
        <span className="k-t-xs k-t-muted">{r.kamar ?? "-"} · {r.periode}</span>
      </span>
    ) },
    { kunci: "jatuh_tempo", judul: "Jatuh Tempo", bisaUrut: true, sel: (r) => <span className="k-td-num">{tanggal(r.jatuh_tempo)}</span> },
    { kunci: "jumlah", judul: "Tagihan", bisaUrut: true, sel: (r) => <span className="k-td-num k-td-strong">{rupiah(r.jumlah)}</span> },
    { kunci: "sisa", judul: "Sisa", bisaUrut: true, sel: (r) => (
      <span className={r.sisa > 0 ? "k-td-num k-td-strong" : "k-td-num k-t-muted"}>{r.status === "lunas" ? "Lunas" : rupiah(r.sisa)}</span>
    ) },
    { kunci: "status", judul: "Status", sel: (r) => (
      <Badge tone={r.status === "lunas" ? "ok" : r.terbayar > 0 ? "warn" : "bad"} dot>
        {r.status === "lunas" ? "Lunas" : r.terbayar > 0 ? "Parsial" : "Belum"}
      </Badge>
    ) },
  ], []);

  const aksi = (r: BarisTagihan) => (
    <span className="k-row-actions">
      {r.status !== "lunas" && (
        <Button jenis="primary" ukuran="sm" ikon="wallet" onClick={() => setBukaBayar(r)}>Bayar</Button>
      )}
      {r.status !== "lunas" && r.terbayar > 0 && bolehOperasi && (
        <Button jenis="outline" ukuran="sm" memuat={pending} onClick={() => mulai(async () => {
          const h = await pelunasanPenuhAction(r.id);
          toast(h.error ? { judul: "Gagal", pesan: h.error, nada: "danger" } : { judul: "Lunas", pesan: h.sukses ?? "", nada: "ok" });
        })}>Lunasi</Button>
      )}
      {r.status === "lunas" && (
        <Button jenis="ghost" ukuran="sm" ikon="receipt" onClick={() => setKuitansi(r)}>Kuitansi</Button>
      )}
    </span>
  );

  return (
    <>
      <div className="k-toolbar">
        <div className="k-grow" />
        {bolehOperasi && (
          <Button jenis="success" ikon="plus" onClick={() => setBukaGenerate(true)}>Generate Tagihan</Button>
        )}
      </div>

      <DataTableServer
        kolom={kolom}
        ambilData={ambilTagihan}
        filters={{ status: sp.get("status") ?? "semua" }}
        defaultSort="jatuh_tempo"
        defaultOrder="asc"
        placeholderCari="Cari penyewa / kamar / periode..."
        kosong="Tidak ada tagihan. Generate tagihan bulanan untuk memulai."
        aksiBaris={aksi}
      />

      <Modal buka={bukaBayar !== null} judul={`Bayar — ${bukaBayar?.nama ?? ""}`} onTutup={() => setBukaBayar(null)}>
        {bukaBayar && <FormBayar tagihan={bukaBayar} onTutup={() => setBukaBayar(null)} />}
      </Modal>

      <Modal buka={bukaGenerate} judul="Generate Tagihan Bulanan" onTutup={() => setBukaGenerate(false)}>
        <FormGenerate onTutup={() => setBukaGenerate(false)} />
      </Modal>

      <Confirm
        buka={kuitansi !== null}
        judul="Kuitansi"
        pesan={`Tagihan ${kuitansi?.nama ?? ""} periode ${kuitansi?.periode ?? ""} sebesar ${rupiah(kuitansi?.jumlah ?? 0)} lunas pada ${kuitansi?.dibayar_pada ? tanggal(kuitansi.dibayar_pada) : "-"} melalui ${kuitansi?.metode ?? "-"}.`}
        labelYa="Tutup"
        onYa={() => setKuitansi(null)}
        onTidak={() => setKuitansi(null)}
      />
    </>
  );
}

function FormBayar({ tagihan, onTutup }: { tagihan: BarisTagihan; onTutup: () => void }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => bayarTagihanAction(undefined, fd),
    undefined,
  );
  const [jumlah, setJumlah] = useState(String(tagihan.sisa));

  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <div className="k-dl">
        <div className="k-dl-item"><dt>Tagihan</dt><dd>{rupiah(tagihan.jumlah)}</dd></div>
        <div className="k-dl-item"><dt>Sisa</dt><dd>{rupiah(tagihan.sisa)}</dd></div>
      </div>
      <input type="hidden" name="tagihan_id" value={tagihan.id} />
      <Input
        label="Jumlah Bayar (Rp)"
        name="jumlah"
        inputMode="numeric"
        value={jumlah}
        onChange={(e) => setJumlah(e.target.value.replace(/[^0-9]/g, ""))}
        bantuan="Boleh kurang dari sisa — sisa tagihan tetap tercatat (bayar parsial)."
        required
      />
      <Select label="Metode" name="metode" defaultValue="tunai" opsi={[
        { nilai: "tunai", label: "Tunai" },
        { nilai: "transfer", label: "Transfer" },
        { nilai: "qris", label: "QRIS" },
        { nilai: "deposit", label: "Potong Deposit" },
      ]} />
      <Textarea label="Catatan (opsional)" name="catatan" rows={2} maxLength={200} />
      <div className="k-btn-block-group">
        <Button jenis="primary" type="submit" memuat={pending} ikon="check">Simpan Pembayaran</Button>
        <Button jenis="ghost" type="button" onClick={onTutup}>Batal</Button>
      </div>
    </form>
  );
}

function FormGenerate({ onTutup }: { onTutup: () => void }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => generateTagihanAction(undefined, fd),
    undefined,
  );
  const hari = new Date();
  const periode = hari.toISOString().slice(0, 7);
  const jatuh = new Date(hari.getFullYear(), hari.getMonth() + 1, 5).toISOString().slice(0, 10);

  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <Input label="Periode (YYYY-MM)" name="periode" defaultValue={periode} pattern="\d{4}-\d{2}" required />
      <Input label="Jatuh Tempo" name="jatuh_tempo" type="date" defaultValue={jatuh} required />
      <Select label="Basis Tarif" name="basis" defaultValue="kamar" opsi={[
        { nilai: "kamar", label: "Tarif kamar masing-masing" },
        { nilai: "tetap", label: "Nominal tetap untuk semua" },
      ]} />
      <Input label="Biaya Tambahan (Rp, boleh 0)" name="jumlah_tambahan" type="number" defaultValue={0} min={0} />
      <div className="k-btn-block-group">
        <Button jenis="success" type="submit" memuat={pending} ikon="zap">Generate</Button>
        <Button jenis="ghost" type="button" onClick={onTutup}>Batal</Button>
      </div>
      <p className="k-help">Idempoten: tagihan periode yang sudah ada otomatis dilewati.</p>
    </form>
  );
}
