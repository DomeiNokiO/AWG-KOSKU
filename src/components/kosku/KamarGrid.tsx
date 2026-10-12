"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Feedback";
import { Fab } from "@/components/ui/Fab";
import { FormKamarModal } from "./FormKamar";
import { KartuKamar } from "./KartuKamar";
import type { KamarRingkas } from "@/lib/db";

/**
 * KOSKU-UI — grid kamar + tombol tambah kamar (FAB).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Grid dipakai di halaman /kamar. Setiap kamar berupa kartu penuh (bukan
 * strip horizontal) — menu yang harus digeser ke samping untuk melihat semua
 * item sudah ditolak sebagai pola desain di kit ini (lihat docs/komponen/
 * navigasi.md).
 */
export function KamarGrid({ kamar }: { kamar: KamarRingkas[] }) {
  const [buka, setBuka] = useState(false);
  const [pending, mulai] = useTransition();

  return (
    <>
      <div className="k-grid k-grid-4">
        {kamar.map((k) => (
          <KartuKamar key={k.id} k={k} />
        ))}
      </div>

      <Fab ikon="plus" label="Tambah kamar" onClick={() => setBuka(true)} />

      <Modal buka={buka} judul="Tambah Kamar" onTutup={() => setBuka(false)}>
        <FormKamarModal
          onTutup={() => {
            setBuka(false);
            mulai(() => undefined);
          }}
        />
      </Modal>
    </>
  );
}