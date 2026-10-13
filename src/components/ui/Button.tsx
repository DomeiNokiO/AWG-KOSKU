import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type NamaIkon } from "./Icon";

/**
 * AWG-KOSKU — tombol.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Komponen ini tidak "use client" supaya bisa dipakai di Server Component
 * maupun di dalam komponen klien. Kalau Anda mengirim `onClick` dari Server
 * Component, React akan menolaknya — itu memang batasnya: handler harus
 * berada di pohon klien.
 *
 * Jenis: primary · success · warn · danger · danger-soft · dark · soft ·
 * ghost · outline · netral (bawaan).
 */

export type JenisTombol =
  | "netral" | "primary" | "success" | "warn" | "danger" | "danger-soft"
  | "dark" | "soft" | "ghost" | "outline";

const KELAS: Record<JenisTombol, string> = {
  netral: "",
  primary: "k-btn-primary",
  success: "k-btn-success",
  warn: "k-btn-warn",
  danger: "k-btn-danger",
  "danger-soft": "k-btn-danger-soft",
  dark: "k-btn-dark",
  soft: "k-btn-soft",
  ghost: "k-btn-ghost",
  outline: "k-btn-outline",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  jenis?: JenisTombol;
  ukuran?: "sm" | "md" | "lg";
  ikon?: NamaIkon | string;
  ikonKanan?: NamaIkon | string;
  /** Positif = ikon di kiri, "kanan" = ikon di kanan (default kiri). */
  ikonDi?: "kiri" | "kanan";
  blok?: boolean;
  /** true = tampilkan spinner dan cegah klik ganda. */
  memuat?: boolean;
  pill?: boolean;
  children?: ReactNode;
};

export function Button({
  jenis = "netral",
  ukuran = "md",
  ikon,
  ikonKanan,
  ikonDi = "kiri",
  blok = false,
  memuat = false,
  pill = false,
  className = "",
  children,
  disabled,
  ...rest
}: Props) {
  const kelas = [
    "k-btn",
    KELAS[jenis],
    ukuran !== "md" ? `k-btn-${ukuran}` : "",
    blok ? "k-btn-block" : "",
    pill ? "k-btn-pill" : "",
    memuat ? "k-btn-loading" : "",
    !children ? "k-btn-icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const kiri = ikonDi === "kiri" ? ikon : undefined;
  const kanan = ikonDi === "kanan" ? ikonKanan ?? ikon : undefined;

  return (
    <button className={kelas} disabled={disabled || memuat} {...rest}>
      {kiri ? <Icon name={kiri} size="sm" /> : null}
      {children}
      {kanan ? <Icon name={kanan} size="sm" /> : null}
    </button>
  );
}

/** Kelompok tombol dengan jarak konsisten. */
export function ButtonGroup({ children }: { children: ReactNode }) {
  return <div className="k-btn-group">{children}</div>;
}
