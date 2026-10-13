"use client";

import { useState, type ReactNode } from "react";
import { Icon, type NamaIkon } from "./Icon";
import { Tooltip } from "./Feedback";

/**
 * AWG-KOSKU — tombol aksi mengambang (FAB) & tumpukannya.
 * Author: AWGNET-RACING & AGENT AI TEAM
 */

export function Fab({
  ikon,
  label,
  onClick,
  nada = "danger",
  kecil = false,
}: {
  ikon: NamaIkon | string;
  label: string;
  onClick?: () => void;
  nada?: "danger" | "primary" | "muted";
  kecil?: boolean;
}) {
  return (
    <Tooltip teks={label}>
      <button
        type="button"
        className={["k-fab", nada === "primary" ? "k-fab-primary" : nada === "muted" ? "k-fab-muted" : "", kecil ? "k-fab-sm" : ""]
          .filter(Boolean)
          .join(" ")}
        aria-label={label}
        onClick={onClick}
      >
        <Icon name={ikon} size={kecil ? "md" : "lg"} />
      </button>
    </Tooltip>
  );
}

/** Tumpukan FAB: satu tombol utama + aksi sekunder yang muncul saat dibuka. */
export function FabMenu({
  aksi,
  labelUtama = "Aksi cepat",
}: {
  aksi: { ikon: NamaIkon | string; label: string; onPilih: () => void }[];
  labelUtama?: string;
}) {
  const [buka, setBuka] = useState(false);

  return (
    <div className="k-fab-zone">
      {buka
        ? aksi.map((a) => <Fab key={a.label} ikon={a.ikon} label={a.label} onClick={() => { a.onPilih(); setBuka(false); }} nada="muted" kecil />)
        : null}
      <button
        type="button"
        className="k-fab"
        aria-label={buka ? "Tutup aksi cepat" : labelUtama}
        aria-expanded={buka}
        onClick={() => setBuka((v) => !v)}
      >
        <Icon name={buka ? "x" : "plus"} size="lg" />
      </button>
    </div>
  );
}

export function FabZone({ children }: { children: ReactNode }) {
  return <div className="k-fab-zone">{children}</div>;
}
