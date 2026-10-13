import type { ReactNode } from "react";
import { Icon, type NamaIkon } from "./Icon";

/**
 * AWG-KOSKU — kartu.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Struktur yang didukung: head (judul + aksi), body, foot. Semua bagian
 * opsional; jangan memaksa memakai head kalau isinya cuma judul.
 */

export function Card({
  children,
  accent,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  accent?: "brand" | "success" | "warn" | "danger";
  className?: string;
  hover?: boolean;
}) {
  return (
    <section
      className={[
        "k-card",
        accent ? `k-card-accent k-accent-${accent}` : "",
        hover ? "k-card-hover" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

export function CardHead({
  judul,
  sub,
  ikon,
  aksi,
  children,
}: {
  judul: ReactNode;
  sub?: ReactNode;
  ikon?: NamaIkon | string;
  aksi?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="k-card-head">
      <div className="k-grow">
        <h2 className="k-card-title">
          {ikon ? <Icon name={ikon} size="sm" /> : null}
          <span>{judul}</span>
        </h2>
        {sub ? <p className="k-card-sub">{sub}</p> : null}
      </div>
      {aksi}
      {children}
    </header>
  );
}

export function CardBody({
  children,
  rapat = false,
  className = "",
}: {
  children: ReactNode;
  /** true = padding vertikal lebih kecil (untuk daftar rapat). */
  rapat?: boolean;
  className?: string;
}) {
  return <div className={["k-card-body", rapat ? "k-card-body-tight" : "", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardFoot({ children }: { children: ReactNode }) {
  return <footer className="k-card-foot">{children}</footer>;
}

/** Kartu statistik: ikon berwarna + angka besar + label. */
export function StatCard({
  nilai,
  label,
  ikon,
  warna = "blue",
  tren,
  catatan,
  className = "",
}: {
  nilai: ReactNode;
  label: string;
  ikon: NamaIkon | string;
  warna?: "blue" | "green" | "orange" | "violet" | "red" | "slate";
  tren?: { arah: "up" | "down"; teks: string };
  catatan?: string;
  className?: string;
}) {
  return (
    <article className={["k-stat", `k-ico-${warna}`, className].filter(Boolean).join(" ")}>
      <div className="k-stat-ico">
        <Icon name={ikon} size="lg" />
      </div>
      <div className="k-stat-main">
        <p className="k-stat-val">{nilai}</p>
        <p className="k-stat-lbl">{label}</p>
        {tren ? (
          <p className={`k-stat-trend ${tren.arah}`}>
            <Icon name={tren.arah === "up" ? "arrow-up" : "arrow-down"} size="xs" /> {tren.teks}
          </p>
        ) : null}
        {catatan ? <p className="k-stat-lbl">{catatan}</p> : null}
      </div>
    </article>
  );
}

export function SectionTitle({
  judul,
  sub,
  aksi,
}: {
  judul: string;
  sub?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="k-section">
      <div>
        <h2 className="k-section-title">{judul}</h2>
        {sub ? <p className="k-section-sub">{sub}</p> : null}
      </div>
      {aksi}
    </div>
  );
}

/** Daftar pasangan label–nilai (detail kamar, detail penyewa). */
export function DescList({ items }: { items: { label: string; nilai: ReactNode }[] }) {
  return (
    <dl className="k-dl">
      {items.map((it) => (
        <div className="k-dl-item" key={it.label}>
          <dt>{it.label}</dt>
          <dd>{it.nilai}</dd>
        </div>
      ))}
    </dl>
  );
}
