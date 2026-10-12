import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * KOSKU-UI — badge, chip, pill.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Nama nada sengaja dipakai konsisten di seluruh kit supaya tidak ada kelas
 * yang "hampir benar" lalu tampil tanpa gaya — kesalahan yang tidak berisik
 * dan paling sering lolos saat perombakan UI.
 */

export type Nada = "netral" | "ok" | "warn" | "bad" | "info" | "brand" | "violet" | "solid";

const KELAS: Record<Nada, string> = {
  netral: "",
  ok: "k-badge-ok",
  warn: "k-badge-warn",
  bad: "k-badge-bad",
  info: "k-badge-info",
  brand: "k-badge-brand",
  violet: "k-badge-violet",
  solid: "k-badge-solid",
};

export function Badge({
  children,
  tone = "netral",
  dot = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Nada;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={["k-badge", KELAS[tone], className].filter(Boolean).join(" ")}>
      {dot ? <span className="k-badge-dot" /> : null}
      {children}
    </span>
  );
}

export function Chip({ children, onHapus }: { children: ReactNode; onHapus?: () => void }) {
  return (
    <span className="k-chip">
      {children}
      {onHapus ? (
        <button type="button" onClick={onHapus} aria-label="Hapus" className="k-tip" data-tip="Hapus">
          <Icon name="x" size="xs" />
        </button>
      ) : null}
    </span>
  );
}
