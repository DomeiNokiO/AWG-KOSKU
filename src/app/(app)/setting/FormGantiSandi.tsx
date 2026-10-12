"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Form";
import { Alert } from "@/components/ui/Feedback";
import { gantiKataSandiSendiri, type HasilSandi } from "@/actions/auth";

export function FormGantiSandi() {
  const [state, action, pending] = useActionState<HasilSandi | undefined, FormData>(
    async (_s, fd) => gantiKataSandiSendiri(undefined, fd),
    undefined,
  );
  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <PasswordInput label="Sandi Saat Ini" name="sandi_lama" autoComplete="current-password" required />
      <PasswordInput label="Sandi Baru" name="sandi_baru" autoComplete="new-password" bantuan="Minimal 8 karakter, campur huruf & angka." required />
      <PasswordInput label="Ulangi Sandi Baru" name="sandi_ulang" autoComplete="new-password" required />
      <Button jenis="outline" type="submit" memuat={pending} ikon="lock">Ganti Sandi</Button>
    </form>
  );
}
