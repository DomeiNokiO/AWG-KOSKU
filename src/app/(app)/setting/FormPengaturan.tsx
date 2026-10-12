"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Form";
import { Alert } from "@/components/ui/Feedback";
import { simpanPengaturanAction, type Hasil } from "@/actions/keuangan";

type P = Record<string, string>;

/**
 * Form pengaturan kos + aturan denda.
 * Nama field harus sama dengan whitelist `kunciSah` di simpanPengaturanAction.
 */
export function FormPengaturan({ awal, denda }: { awal: P; denda: { aktif: number; denda_per_hari: number; batas_gratis: number } }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => simpanPengaturanAction(undefined, fd),
    undefined,
  );

  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}

      <div className="k-grid k-grid-2">
        <Input label="Nama Kos" name="nama_kos" defaultValue={awal.nama_kos ?? ""} required maxLength={80} />
        <Input label="Telepon" name="telepon" defaultValue={awal.telepon ?? ""} maxLength={30} />
      </div>
      <Textarea label="Alamat" name="alamat" rows={2} defaultValue={awal.alamat ?? ""} maxLength={200} />

      <fieldset className="k-fieldset">
        <legend>Aturan Denda</legend>
        <div className="k-grid k-grid-2">
          <Input
            label="Denda per Hari (Rp)"
            name="denda_per_hari"
            inputMode="numeric"
            defaultValue={String(denda.denda_per_hari)}
          />
          <Input
            label="Grace Period (hari)"
            name="batas_gratis"
            inputMode="numeric"
            defaultValue={String(denda.batas_gratis)}
            bantuan="Hari pertama setelah jatuh tempo tanpa denda."
          />
        </div>
        <Select
          label="Status Denda"
          name="denda_aktif"
          defaultValue={String(denda.aktif)}
          opsi={[
            { nilai: "1", label: "Aktif" },
            { nilai: "0", label: "Nonaktif" },
          ]}
        />
      </fieldset>

      <fieldset className="k-fieldset">
        <legend>Template Pesan WhatsApp</legend>
        <Textarea
          label="Pengingat Bayar"
          name="template_wa"
          rows={3}
          defaultValue={awal.template_wa ?? ""}
        />
        <p className="k-t-xs k-t-muted">Variabel: {"{nama} {kamar} {periode} {jumlah} {jatuh_tempo}"}</p>
      </fieldset>

      <Button jenis="primary" type="submit" memuat={pending} ikon="save">Simpan Pengaturan</Button>
    </form>
  );
}
