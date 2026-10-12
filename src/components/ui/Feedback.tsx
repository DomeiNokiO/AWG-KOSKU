"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon, type NamaIkon } from "./Icon";

/**
 * KOSKU-UI — umpan balik: toast, alert, modal, drawer, tooltip, progress,
 * spinner, skeleton, empty state.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Semua overlay di sini memakai satu implementasi fokus yang sama:
 * kunci fokus di dalam panel, `Escape` menutup, klik latar menutup, dan
 * fokus dikembalikan ke elemen pemicu. Tanpa itu, pengguna keyboard bisa
 * "keluar" dari dialog ke halaman di belakangnya tanpa sadar.
 */

/* ------------------------------------------------------------------ Toast */

export type Toast = {
  id: number;
  judul: string;
  pesan?: string;
  nada?: "info" | "ok" | "warn" | "danger";
  /** Milidetik; 0 = tidak menutup otomatis. */
  durasi?: number;
};

let penampilLuar: ((t: Omit<Toast, "id">) => number) | null = null;

/** Panggil dari mana pun (termasuk event handler) tanpa Context. */
export function toast(t: Omit<Toast, "id">) {
  return penampilLuar?.(t) ?? -1;
}

export function ToastHost() {
  const [daftar, setDaftar] = useState<Toast[]>([]);
  const urut = useRef(0);

  const tutup = useCallback((id: number) => {
    setDaftar((d) => d.filter((t) => t.id !== id));
  }, []);

  const tampilkan = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++urut.current;
      const baru: Toast = { id, nada: "info", durasi: 4200, ...t };
      setDaftar((d) => [...d, baru].slice(-4));
      const durasi = baru.durasi ?? 4200;
      if (durasi > 0) window.setTimeout(() => tutup(id), durasi);
      return id;
    },
    [tutup],
  );

  // Ekspos ke modul lain (dipanggil dari handler mana pun).
  useEffect(() => {
    penampilLuar = tampilkan;
    return () => {
      penampilLuar = null;
    };
  }, [tampilkan]);

  const ikon: Record<string, NamaIkon> = {
    info: "info",
    ok: "check-circle",
    warn: "alert-triangle",
    danger: "x-circle",
  };

  return (
    <div className="k-toast-zone" role="status" aria-live="polite" aria-atomic="false">
      {daftar.map((t) => (
        <div key={t.id} className={`k-toast k-toast-${t.nada}`}>
          <span className={`k-toast-ico k-toast-${t.nada}`}>
            <Icon name={ikon[t.nada ?? "info"]} size="sm" />
          </span>
          <div className="k-grow">
            <p className="k-toast-title">{t.judul}</p>
            {t.pesan ? <p className="k-toast-msg">{t.pesan}</p> : null}
          </div>
          <button type="button" className="k-toast-close" aria-label="Tutup notifikasi" onClick={() => tutup(t.id)}>
            <Icon name="x" size="sm" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Alert */

export function Alert({
  judul,
  children,
  nada = "info",
  ikon,
  onTutup,
}: {
  judul?: string;
  children?: ReactNode;
  nada?: "info" | "ok" | "warn" | "danger" | "brand";
  ikon?: NamaIkon | string;
  onTutup?: () => void;
}) {
  const bawaan: Record<string, NamaIkon> = {
    info: "info",
    ok: "check-circle",
    warn: "alert-triangle",
    danger: "alert-circle",
    brand: "sparkle",
  };
  return (
    <div className={`k-alert k-alert-${nada === "info" ? "info" : nada}`} role={nada === "danger" ? "alert" : "status"}>
      <Icon name={ikon ?? bawaan[nada]} size="sm" />
      <div className="k-grow">
        {judul ? <p className="k-alert-title">{judul}</p> : null}
        {children}
      </div>
      {onTutup ? (
        <button type="button" className="k-alert-close" aria-label="Tutup" onClick={onTutup}>
          <Icon name="x" size="sm" />
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------- Kunci fokus */

function fokusable(el: HTMLElement): HTMLElement[] {
  return Array.from(
    el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((n) => n.offsetParent !== null || n === document.activeElement);
}

function Overlay({
  judul,
  onTutup,
  children,
  kaki,
  kelas = "",
  labelTutup = "Tutup",
}: {
  judul: string;
  onTutup: () => void;
  children: ReactNode;
  kaki?: ReactNode;
  kelas?: string;
  labelTutup?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const sebelum = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sebelum.current = document.activeElement as HTMLElement;
    const simpul = panel.current;
    const pertama = simpul ? fokusable(simpul)[0] : null;
    (pertama ?? simpul)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onTutup();
        return;
      }
      if (e.key === "Tab" && simpul) {
        const bisa = fokusable(simpul);
        if (bisa.length === 0) return;
        const awal = bisa[0];
        const akhir = bisa[bisa.length - 1];
        if (e.shiftKey && document.activeElement === awal) {
          e.preventDefault();
          akhir.focus();
        } else if (!e.shiftKey && document.activeElement === akhir) {
          e.preventDefault();
          awal.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      sebelum.current?.focus?.();
    };
  }, [onTutup]);

  return (
    <div className="k-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div
        className={["k-modal", kelas].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        tabIndex={-1}
        ref={panel}
      >
        <header className="k-modal-head">
          <h2 className="k-modal-title k-grow">{judul}</h2>
          <button type="button" className="k-btn k-btn-ghost k-btn-icon k-btn-sm" aria-label={labelTutup} onClick={onTutup}>
            <Icon name="x" size="sm" />
          </button>
        </header>
        <div className="k-modal-body">{children}</div>
        {kaki ? <footer className="k-modal-foot">{kaki}</footer> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({
  buka,
  judul,
  onTutup,
  children,
  kaki,
  ukuran = "md",
}: {
  buka: boolean;
  judul: string;
  onTutup: () => void;
  children: ReactNode;
  kaki?: ReactNode;
  ukuran?: "sm" | "md" | "lg";
}) {
  if (!buka) return null;
  return (
    <Overlay judul={judul} onTutup={onTutup} kaki={kaki} kelas={ukuran === "md" ? "" : `k-modal-${ukuran}`}>
      {children}
    </Overlay>
  );
}

/** Modal konfirmasi untuk aksi merusak (hapus, batalkan, putuskan). */
export function Confirm({
  buka,
  judul,
  pesan,
  labelYa = "Ya, lanjutkan",
  labelTidak = "Batal",
  nada = "danger",
  onYa,
  onTidak,
}: {
  buka: boolean;
  judul: string;
  pesan: ReactNode;
  labelYa?: string;
  labelTidak?: string;
  nada?: "danger" | "warn" | "primary";
  onYa: () => void;
  onTidak: () => void;
}) {
  return (
    <Modal
      buka={buka}
      judul={judul}
      onTutup={onTidak}
      ukuran="sm"
      kaki={
        <>
          <button type="button" className="k-btn k-btn-outline" onClick={onTidak}>
            {labelTidak}
          </button>
          <button type="button" className={`k-btn k-btn-${nada}`} onClick={onYa}>
            {labelYa}
          </button>
        </>
      }
    >
      <p>{pesan}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Drawer */

export function Drawer({
  buka,
  judul,
  onTutup,
  children,
  kaki,
  sisi = "kanan",
}: {
  buka: boolean;
  judul: string;
  onTutup: () => void;
  children: ReactNode;
  kaki?: ReactNode;
  sisi?: "kanan" | "kiri";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const sebelum = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!buka) return;
    sebelum.current = document.activeElement as HTMLElement;
    const simpul = panel.current;
    const bisa = simpul ? fokusable(simpul) : [];
    (bisa[0] ?? simpul)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTutup();
      if (e.key === "Tab" && simpul) {
        const f = fokusable(simpul);
        if (!f.length) return;
        const awal = f[0];
        const akhir = f[f.length - 1];
        if (e.shiftKey && document.activeElement === awal) {
          e.preventDefault();
          akhir.focus();
        } else if (!e.shiftKey && document.activeElement === akhir) {
          e.preventDefault();
          awal.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      sebelum.current?.focus?.();
    };
  }, [buka, onTutup]);

  if (!buka) return null;

  return (
    <>
      <div className="k-drawer-backdrop" onClick={onTutup} />
      <aside
        className={["k-drawer", sisi === "kiri" ? "k-drawer-left" : ""].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        tabIndex={-1}
        ref={panel}
      >
        <header className="k-drawer-head">
          <h2 className="k-drawer-title k-grow">{judul}</h2>
          <button type="button" className="k-btn k-btn-ghost k-btn-icon k-btn-sm" aria-label="Tutup" onClick={onTutup}>
            <Icon name="x" size="sm" />
          </button>
        </header>
        <div className="k-drawer-body">{children}</div>
        {kaki ? <footer className="k-drawer-foot">{kaki}</footer> : null}
      </aside>
    </>
  );
}

/* --------------------------------------------------------------- Dropdown */

export function Menu({
  pemicu,
  children,
  rata = "kanan",
}: {
  pemicu: (buka: boolean) => ReactNode;
  children: ReactNode;
  rata?: "kanan" | "kiri";
}) {
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const onDoc = (e: MouseEvent) => {
      if (akar.current && !akar.current.contains(e.target as Node)) setBuka(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [buka]);

  return (
    <div className="k-menu-wrap" ref={akar}>
      <div onClick={() => setBuka((v) => !v)}>{pemicu(buka)}</div>
      {buka ? (
        <div className={["k-menu", rata === "kiri" ? "k-menu-left" : ""].filter(Boolean).join(" ")} onClick={() => setBuka(false)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  ikon,
  petunjuk,
  onPilih,
  bahaya = false,
}: {
  children: ReactNode;
  ikon?: NamaIkon | string;
  petunjuk?: string;
  onPilih?: () => void;
  bahaya?: boolean;
}) {
  return (
    <button type="button" className={["k-menu-item", bahaya ? "k-danger" : ""].filter(Boolean).join(" ")} onClick={onPilih}>
      {ikon ? <Icon name={ikon} size="sm" /> : null}
      <span>{children}</span>
      {petunjuk ? <span className="k-menu-hint">{petunjuk}</span> : null}
    </button>
  );
}

/* ----------------------------------------------------- Progress / Skeleton */

export function Progress({
  nilai,
  label,
  diAtasGelap = false,
  ukuran = "md",
}: {
  nilai: number;
  label?: string;
  diAtasGelap?: boolean;
  ukuran?: "sm" | "md" | "lg";
}) {
  const p = Math.min(100, Math.max(0, Math.round(nilai)));
  return (
    <div
      className={["k-progress", diAtasGelap ? "k-progress-onDark" : "", ukuran !== "md" ? `k-progress-${ukuran}` : ""]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Kemajuan"}
    >
      <div className="k-progress-fill" style={{ width: `${p}%` }} />
    </div>
  );
}

export function Spinner({ ukuran = "md", label = "Memuat…" }: { ukuran?: "sm" | "md" | "lg"; label?: string }) {
  return (
    <span className={["k-spinner", ukuran !== "md" ? `k-spinner-${ukuran}` : ""].filter(Boolean).join(" ")} role="status" aria-label={label} />
  );
}

export function Skeleton({ baris = 3 }: { baris?: number }) {
  const daftar = useMemo(() => Array.from({ length: baris }), [baris]);
  return (
    <div aria-hidden="true">
      {daftar.map((_, i) => (
        <div key={i} className="k-skel k-skel-line" />
      ))}
    </div>
  );
}

export function EmptyState({
  judul,
  pesan,
  ikon = "inbox",
  aksi,
}: {
  judul: string;
  pesan?: string;
  ikon?: NamaIkon | string;
  aksi?: ReactNode;
}) {
  return (
    <div className="k-empty">
      <div className="k-empty-ico">
        <Icon name={ikon} size="lg" />
      </div>
      <p className="k-empty-title">{judul}</p>
      {pesan ? <p className="k-empty-msg">{pesan}</p> : null}
      {aksi}
    </div>
  );
}

/* ---------------------------------------------------------------- Tooltip */

export function Tooltip({ teks, children }: { teks: string; children: ReactNode }) {
  return (
    <span className="k-tip" data-tip={teks}>
      {children}
    </span>
  );
}
