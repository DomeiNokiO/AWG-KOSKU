"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { Alert, toast } from "@/components/ui/Feedback";
import { simpanBugAction, selesaikanBugAction, type Hasil } from "@/actions/bug";

export function FormBug() {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(
    async (_s, fd) => simpanBugAction(undefined, fd),
    undefined,
  );
  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <Input label="Judul" name="judul" maxLength={120} required />
      <Input label="Halaman (opsional)" name="halaman" maxLength={80} placeholder="/pembayaran" />
      <Textarea label="Deskripsi" name="isi" rows={4} maxLength={2000} required />
      <Button jenis="primary" type="submit" memuat={pending} ikon="bug">Kirim Laporan</Button>
    </form>
  );
}

export function UbahStatusBug({ id }: { id: number }) {
  const [pending, mulai] = useTransition();
  return (
    <Button jenis="outline" ukuran="sm" memuat={pending} onClick={() => mulai(async () => {
      const h = await selesaikanBugAction(id);
      toast(h.error ? { judul: "Gagal", pesan: h.error, nada: "danger" } : { judul: "Selesai", pesan: h.sukses ?? "", nada: "ok" });
    })}>
      Tandai selesai
    </Button>
  );
}
