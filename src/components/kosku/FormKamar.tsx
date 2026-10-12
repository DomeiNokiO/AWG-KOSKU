"use client";

import { useActionState } from "react";
import { tambahPenyewaAction, simpanKamarAction, type Hasil } from "@/actions/kosku";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { Alert } from "@/components/ui/Feedback";

/** Formulir tambah/edit kamar, dibungkus Modal oleh pemanggil. */
export function FormKamarModal({ onTutup }: { onTutup: () => void }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(simpanKamarAction, undefined);

  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:"var(--k-s3)"}}>
        <Input label="Nomor kamar" name="nomor" placeholder="14 / A1 / LT2-3" required />
        <Input label="Tipe" name="tipe" placeholder="Standar / VIP / Putra" defaultValue="Standar" required />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--k-s3)"}}>
        <Input label="Lantai" name="lantai" type="number" defaultValue="1" required />
        <Input label="Tarif (Rp)" name="tarif" type="number" min={0} step={50000} defaultValue="650000" required />
      </div>
      <Select label="Status" name="status" defaultValue="kosong" opsi={[
        {nilai:"kosong",label:"Kosong"},
        {nilai:"terisi",label:"Terisi"},
        {nilai:"perbaikan",label:"Perbaikan"},
      ]} />
      <div className="k-btn-block-group">
        <Button jenis="primary" type="submit" memuat={pending} ikon="check">Simpan kamar</Button>
        <Button jenis="ghost" type="button" onClick={onTutup}>Batal</Button>
      </div>
    </form>
  );
}

/** Formulir pendaftaran penyewa baru: sekalian membuat tagihan pertama. */
export function FormPenyewaModal({ onTutup }: { onTutup: () => void }) {
  const [state, action, pending] = useActionState<Hasil | undefined, FormData>(tambahPenyewaAction, undefined);

  return (
    <form action={action} className="k-col">
      {state?.error ? <Alert nada="danger">{state.error}</Alert> : null}
      {state?.sukses ? <Alert nada="ok">{state.sukses}</Alert> : null}
      <Input label="Nama lengkap" name="nama" placeholder="Nama penyewa" autoComplete="off" required />
      <Input label="Nomor WhatsApp" name="telepon" placeholder="0812 3456 7890" inputMode="tel" required />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--k-s3)"}}>
        <Input label="Nomor kamar" name="kamar" placeholder="mis. 14" required />
        <Input label="Tanggal masuk" name="tanggal_masuk" type="date" required />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--k-s3)"}}>
        <Input label="Durasi sewa (bulan)" name="durasi_bulan" type="number" min={1} max={60} defaultValue={6} required />
        <Input label="Tarif (Rp/bulan)" name="tarif" type="number" min={0} step={50000} defaultValue={650000} required />
      </div>
      <div className="k-btn-block-group">
        <Button jenis="success" type="submit" memuat={pending} ikon="user-plus">Daftarkan penyewa</Button>
        <Button jenis="ghost" type="button" onClick={onTutup}>Batal</Button>
      </div>
      <p className="k-help">Tagihan bulan pertama dibuat otomatis saat pendaftaran.</p>
    </form>
  );
}
