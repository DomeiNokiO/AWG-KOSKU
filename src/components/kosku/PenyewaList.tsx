"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Kolom } from "@/components/ui/DataDisplay";
import { Confirm, Modal, toast } from "@/components/ui/Feedback";
import { Fab } from "@/components/ui/Fab";
import { Avatar } from "@/components/ui/Icon";
import { rupiah, tanggal } from "@/lib/core/format.mjs";
import { ubahStatusPenyewaAction } from "@/actions/kosku";
import { FormPenyewaModal } from "./FormKamar";
import type { PenyewaRingkas } from "@/lib/db";

/**
 * KOSKU-UI — daftar penyewa dengan pencarian/pengurutan (DataTable),
 * FAB tambah penyewa, dan konfirmasi ketika penyewa keluar.
 */
export function PenyewaList({ penyewa }: { penyewa: PenyewaRingkas[] }) {
  const [cari, setCari] = useState("");
  const [bukaTambah, setBukaTambah] = useState(false);
  const [tanyaKeluar, setTanyaKeluar] = useState<PenyewaRingkas | null>(null);
  const [pending, mulai] = useTransition();

  const kolom: Kolom<PenyewaRingkas>[] = [
    {
      kunci: "nama",
      judul: "Penyewa",
      nilai: (p) => p.nama,
      sel: (p) => (
        <span className="k-td-tenant">
          <Avatar nama={p.nama} size="sm" />
          <span>
            <span className="k-td-tenant-name" style={{ display: "block" }}>
              {p.nama}
            </span>
            <span className="k-t-xs k-t-muted" style={{ display: "block" }}>
              {p.telepon}
            </span>
          </span>
        </span>
      ),
    },
    { kunci: "kamar", judul: "Kamar", nilai: (p) => p.kamar ?? "", sel: (p) => <span className="k-td-strong">{p.kamar ?? "-"}</span> },
    { kunci: "masuk", judul: "Masuk", nilai: (p) => p.tanggal_masuk, sel: (p) => <span className="k-td-num">{tanggal(p.tanggal_masuk)}</span> },
    {
      kunci: "status",
      judul: "Status",
      nilai: (p) => p.status,
      sel: (p) => <Badge tone={p.status === "aktif" ? "ok" : "netral"}>{p.status === "aktif" ? "Aktif" : "Keluar"}</Badge>,
    },
    {
      kunci: "tagihan",
      judul: "Tagihan Terbuka",
      nilai: (p) => p.tagihan_terbuka,
      sel: (p) => (
        <span className={p.tagihan_terbuka > 0 ? "k-td-num k-td-strong" : "k-td-num k-t-muted"}>
          {p.tagihan_terbuka > 0 ? rupiah(p.tagihan_terbuka) : "Lunas"}
        </span>
      ),
    },
    {
      kunci: "aksi",
      judul: "",
      nilai: (p) => p.id,
      sel: (p) => (
        <div className="k-row-actions">
          {p.status === "aktif" ? (
            <Button jenis="danger-soft" ukuran="sm" ikon="logout" onClick={() => setTanyaKeluar(p)}>
              Keluar
            </Button>
          ) : (
            <Button jenis="outline" ukuran="sm" ikon="refresh" memuat={pending} onClick={() => mulai(() => void ubahStatusPenyewaAction(p.id, "aktif"))}>
              Aktifkan
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        kolom={kolom}
        baris={penyewa}
        cari={cari}
        onCari={setCari}
        placeholderCari="Cari nama / kamar / telepon…"
        kosong="Belum ada penyewa terdaftar."
        perHalaman={8}
      />

      <Fab ikon="user-plus" label="Daftarkan penyewa" nada="primary" onClick={() => setBukaTambah(true)} />

      <Modal buka={bukaTambah} judul="Daftarkan Penyewa Baru" onTutup={() => setBukaTambah(false)}>
        <FormPenyewaModal onTutup={() => setBukaTambah(false)} />
      </Modal>

      <Confirm
        buka={tanyaKeluar !== null}
        judul={`Penyewa ${tanyaKeluar?.nama ?? ""} keluar?`}
        pesan={
          <>
            Kamar <strong>{tanyaKeluar?.kamar ?? "-"}</strong> akan otomatis menjadi <strong>kosong</strong> dan
            tagihan aktif tetap tercatat. Aksi ini bisa dibatalkan dengan mengaktifkan kembali penyewa.
          </>
        }
        labelYa="Ya, tandai keluar"
        onYa={() => {
          if (!tanyaKeluar) return;
          mulai(async () => {
            const hasil = await ubahStatusPenyewaAction(tanyaKeluar.id, "keluar");
            toast(hasil.error ? { judul: "Gagal", pesan: hasil.error, nada: "danger" } : { judul: "Selesai", pesan: hasil.sukses, nada: "ok" });
            setTanyaKeluar(null);
          });
        }}
        onTidak={() => setTanyaKeluar(null)}
      />
    </>
  );
}