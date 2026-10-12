"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { Alert, toast } from "@/components/ui/Feedback";
import { simpanCatatanAction, hapusCatatanAction, type Hasil } from "@/actions/catatan";

export function FormCatatan() {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => simpanCatatanAction(undefined, fd),
    undefined,
  );
  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <Input label="Judul" name="judul" maxLength={120} required />
      <Textarea label="Isi" name="isi" rows={4} maxLength={2000} required />
      <Button jenis="primary" type="submit" memuat={pending} ikon="plus">Simpan Catatan</Button>
    </form>
  );
}

export function HapusCatatan({ id }: { id: number }) {
  const [pending, mulai] = useTransition();
  return (
    <Button
      jenis="ghost"
      ukuran="sm"
      ikon="trash"
      memuat={pending}
      aria-label="Hapus catatan"
      onClick={() => mulai(async () => {
        const h = await hapusCatatanAction(id);
        toast(h.error ? { judul: "Gagal", pesan: h.error, nada: "danger" } : { judul: "Terhapus", pesan: h.sukses ?? "", nada: "ok" });
      })}
    >
      Hapus
    </Button>
  );
}
