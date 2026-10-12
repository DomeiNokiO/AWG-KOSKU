"use client";

import { useActionState } from "react";
import Link from "next/link";
import { masuk, type HasilAuth } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput, Checkbox } from "@/components/ui/Form";
import { Alert } from "@/components/ui/Feedback";

/**
 * KOSKU-UI — formulir masuk.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Memakai `useActionState` sehingga status "sedang memproses" dan pesan error
 * datang dari server, bukan dari tebakan di sisi klien. Kata sandi tidak
 * pernah disimpan di state React setelah dikirim.
 */

export function MasukForm({ lanjut, keluar }: { lanjut?: string; keluar?: boolean }) {
  const [state, action, pending] = useActionState<HasilAuth | undefined, FormData>(masuk, undefined);

  return (
    <form action={action} className="k-col" noValidate>
      {keluar ? (
        <Alert nada="ok" judul="Anda telah keluar">
          Sesi berakhir dengan aman. Sampai jumpa lagi.
        </Alert>
      ) : null}

      {state?.error ? (
        <Alert nada="danger" judul="Gagal masuk">
          {state.error}
        </Alert>
      ) : null}

      <Input
        label="Email"
        name="email"
        type="email"
        ikon="mail"
        placeholder="nama@email.com"
        autoComplete="username"
        inputMode="email"
        required
        autoFocus
      />

      <PasswordInput
        label="Kata sandi"
        name="kata_sandi"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {lanjut ? <input type="hidden" name="lanjut" value={lanjut} /> : null}

      <div className="k-between">
        <Checkbox label="Ingat saya" name="ingat" value="1" defaultChecked />
        <Link href="/lupa-sandi" className="k-t-sm" style={{ color: "var(--k-brand)" }}>
          Lupa kata sandi?
        </Link>
      </div>

      <Button jenis="primary" blok ukuran="lg" type="submit" memuat={pending} ikon="login">
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
