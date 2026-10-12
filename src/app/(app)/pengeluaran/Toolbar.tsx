"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Feedback";
import { ModalPengeluaran, ModalKategori } from "./FormPengeluaran";

/** Toolbar halaman pengeluaran: buka modal lewat tombol (bukan FAB). */
export function ToolbarPengeluaran({ kategori, peran }: { kategori: { id: number; nama: string }[]; peran: string }) {
  const [bukaPengeluaran, setBukaPengeluaran] = useState(false);
  const [bukaKategori, setBukaKategori] = useState(false);
  const boleh = peran === "pemilik" || peran === "admin";

  return (
    <div className="k-toolbar">
      <div className="k-grow" />
      {boleh && (
        <div className="k-row-sm">
          <Button jenis="outline" ikon="tag" onClick={() => setBukaKategori(true)}>Kategori</Button>
          <Button jenis="primary" ikon="plus" onClick={() => setBukaPengeluaran(true)}>Catat Pengeluaran</Button>
        </div>
      )}

      <Modal buka={bukaPengeluaran} judul="Catat Pengeluaran" onTutup={() => setBukaPengeluaran(false)}>
        <ModalPengeluaran kategori={kategori} onTutup={() => setBukaPengeluaran(false)} />
      </Modal>
      <Modal buka={bukaKategori} judul="Kategori Pengeluaran" onTutup={() => setBukaKategori(false)}>
        <ModalKategori onTutup={() => setBukaKategori(false)} />
      </Modal>
    </div>
  );
}
