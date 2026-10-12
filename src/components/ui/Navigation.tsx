"use client";

import type { ReactNode } from "react";
import { Icon, type NamaIkon } from "./Icon";

/**
 * KOSKU-UI — navigasi: tab, pill, breadcrumb, pager, stepper.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Catatan desain: strip tab yang perlu digeser horizontal DITOLAK untuk menu
 * utama di layar sempit (sebagian item tidak terlihat sampai pengguna
 * menebak harus menggeser). Karena itu `Tabs` di sini hanya untuk sub-bagian
 * di dalam satu kartu, sedangkan menu utama memakai kartu/daftar penuh —
 * lihat docs/komponen/navigasi.md.
 */

export function Tabs<T extends string>({
  nilai,
  onUbah,
  opsi,
  label,
}: {
  nilai: T;
  onUbah: (v: T) => void;
  opsi: { nilai: T; label: string; hitung?: number; ikon?: NamaIkon | string }[];
  label?: string;
}) {
  return (
    <div className="k-tabs" role="tablist" aria-label={label}>
      {opsi.map((o) => (
        <button
          key={o.nilai}
          type="button"
          role="tab"
          aria-selected={nilai === o.nilai}
          className="k-tab"
          onClick={() => onUbah(o.nilai)}
        >
          {o.ikon ? <Icon name={o.ikon} size="sm" /> : null}
          {o.label}
          {typeof o.hitung === "number" ? <span className="k-tab-count">{o.hitung}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string>({
  nilai,
  onUbah,
  opsi,
  label,
}: {
  nilai: T;
  onUbah: (v: T) => void;
  opsi: { nilai: T; label: string; hitung?: number }[];
  label?: string;
}) {
  return (
    <div className="k-pills" role="tablist" aria-label={label}>
      {opsi.map((o) => (
        <button
          key={o.nilai}
          type="button"
          role="tab"
          aria-selected={nilai === o.nilai}
          className="k-pill"
          onClick={() => onUbah(o.nilai)}
        >
          {o.label}
          {typeof o.hitung === "number" ? <span className="k-tab-count">{o.hitung}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="k-crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="k-row-sm">
          {i > 0 ? <span className="k-sep" aria-hidden="true">/</span> : null}
          {it.href ? (
            <a href={it.href}>{it.label}</a>
          ) : (
            <span className="k-current" aria-current="page">
              {it.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Pagination({
  halaman,
  totalHalaman,
  onUbah,
  info,
}: {
  halaman: number;
  totalHalaman: number;
  onUbah: (h: number) => void;
  info?: string;
}) {
  if (totalHalaman <= 1) return info ? <p className="k-pager-info">{info}</p> : null;

  const sekitar: number[] = [];
  for (let i = Math.max(1, halaman - 1); i <= Math.min(totalHalaman, halaman + 1); i++) sekitar.push(i);

  return (
    <div className="k-row k-wrap">
      {info ? <p className="k-pager-info k-grow">{info}</p> : null}
      <div className="k-pager">
        <button type="button" className="k-pager-item" disabled={halaman === 1} onClick={() => onUbah(halaman - 1)} aria-label="Sebelumnya">
          <Icon name="chevron-left" size="sm" />
        </button>
        {sekitar[0] > 1 ? <span className="k-pager-info">…</span> : null}
        {sekitar.map((h) => (
          <button
            key={h}
            type="button"
            className="k-pager-item"
            aria-current={h === halaman ? "page" : undefined}
            onClick={() => onUbah(h)}
          >
            {h}
          </button>
        ))}
        {sekitar[sekitar.length - 1] < totalHalaman ? <span className="k-pager-info">…</span> : null}
        <button
          type="button"
          className="k-pager-item"
          disabled={halaman === totalHalaman}
          onClick={() => onUbah(halaman + 1)}
          aria-label="Berikutnya"
        >
          <Icon name="chevron-right" size="sm" />
        </button>
      </div>
    </div>
  );
}

export function Stepper({
  langkah,
  aktif,
}: {
  langkah: { judul: string; keterangan?: string }[];
  aktif: number;
}) {
  return (
    <ol className="k-steps">
      {langkah.map((l, i) => (
        <li
          key={l.judul}
          className={["k-step", i === aktif ? "k-active" : "", i < aktif ? "k-done" : ""].filter(Boolean).join(" ")}
          aria-current={i === aktif ? "step" : undefined}
        >
          <span className="k-step-num">{i < aktif ? <Icon name="check" size="xs" /> : i + 1}</span>
          <span className="k-grow">
            <span className="k-step-title">{l.judul}</span>
            {l.keterangan ? <span className="k-step-desc" style={{ display: "block" }}>{l.keterangan}</span> : null}
          </span>
          {i < langkah.length - 1 ? <span className="k-step-line" aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}

/** Baris tombol pintasan halaman (aksi cepat). */
export function QuickActions({ children }: { children: ReactNode }) {
  return <div className="k-btn-block-group">{children}</div>;
}
