"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Icon, type NamaIkon } from "./Icon";

/**
 * KOSKU-UI — tampilan data: grafik batang, sparkline, timeline, accordion,
 * tabel dengan pencarian & pengurutan, dan tabel kartu untuk layar sempit.
 * Author: AWGNET-RACING & AGENT AI TEAM
 */

/* ------------------------------------------------------- Grafik batang */

export function BarChart({
  data,
  tinggi = 140,
  format,
  label,
}: {
  data: { label: string; nilai: number; aksen?: boolean }[];
  tinggi?: number;
  format?: (n: number) => string;
  label?: string;
}) {
  const maks = Math.max(1, ...data.map((d) => d.nilai));
  return (
    <div className="k-bars" style={{ height: tinggi }} role="img" aria-label={label ?? "Grafik batang"}>
      {data.map((d) => (
        <div key={d.label} className={["k-bars-col", d.aksen ? "k-accent" : ""].filter(Boolean).join(" ")}>
          <span className="k-t-xs k-t-faint k-nowrap">{format ? format(d.nilai) : d.nilai}</span>
          <div className="k-bars-fill k-grow" style={{ height: `${Math.max(4, (d.nilai / maks) * 100)}%` }} />
          <span className="k-bars-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Sparkline sederhana dari deret angka. */
export function Sparkline({ data, tinggi = 40 }: { data: number[]; tinggi?: number }) {
  const titik = useMemo(() => {
    if (data.length === 0) return "";
    const maks = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const rentang = maks - min || 1;
    return data
      .map((v, i) => {
        const x = (i / Math.max(1, data.length - 1)) * 100;
        const y = 100 - ((v - min) / rentang) * 100;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data]);

  if (!titik) return null;

  return (
    <svg className="k-spark" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height: tinggi }} role="img" aria-label="Tren">
      <polyline points={`0,100 ${titik} 100,100`} className="k-spark-area" />
      <polyline points={titik} />
    </svg>
  );
}

/* ---------------------------------------------------------- Timeline */

export function Timeline({
  items,
}: {
  items: { judul: string; keterangan?: string; waktu?: string; nada?: "ok" | "warn" | "bad" }[];
}) {
  return (
    <div className="k-timeline">
      {items.map((it, i) => (
        <div key={`${it.judul}-${i}`} className={["k-tl-item", it.nada ? `k-${it.nada}` : ""].filter(Boolean).join(" ")}>
          <p className="k-tl-title">{it.judul}</p>
          {it.keterangan ? <p className="k-tl-sub">{it.keterangan}</p> : null}
          {it.waktu ? <p className="k-tl-sub k-t-xs">{it.waktu}</p> : null}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- Accordion */

export function Accordion({ items }: { items: { judul: string; isi: ReactNode; ikon?: NamaIkon | string }[] }) {
  const [buka, setBuka] = useState<number | null>(0);
  return (
    <div className="k-acc">
      {items.map((it, i) => (
        <div className="k-acc-item" key={it.judul}>
          <button
            type="button"
            className="k-acc-head"
            aria-expanded={buka === i}
            aria-controls={`acc-${i}`}
            onClick={() => setBuka(buka === i ? null : i)}
          >
            {it.ikon ? <Icon name={it.ikon} size="sm" /> : null}
            <span>{it.judul}</span>
            <Icon name="chevron-down" size="sm" className="k-acc-arrow" />
          </button>
          {buka === i ? (
            <div className="k-acc-body" id={`acc-${i}`}>
              {it.isi}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- Tabel */

export type Kolom<T> = {
  kunci: string;
  judul: string;
  /** Nilai teks yang dipakai untuk pencarian & pengurutan. */
  nilai: (baris: T) => string | number;
  sel: (baris: T) => ReactNode;
  rata?: "kiri" | "kanan";
  lebar?: string;
};

/**
 * Tabel generik dengan pencarian + pengurutan + paginasi.
 * `min-width` di dalam pembungkus `overflow-x:auto` — bukan overflow halaman.
 */
export function DataTable<T>({
  kolom,
  baris,
  cari = "",
  onCari,
  placeholderCari = "Cari…",
  kosong = "Belum ada data.",
  perHalaman,
  aksi,
  kelas,
}: {
  kolom: Kolom<T>[];
  baris: T[];
  cari?: string;
  onCari?: (v: string) => void;
  placeholderCari?: string;
  kosong?: string;
  perHalaman?: number;
  aksi?: ReactNode;
  kelas?: string;
}) {
  const [urut, setUrut] = useState<{ kunci: string; naik: boolean } | null>(null);
  const [halaman, setHalaman] = useState(1);

  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    const hasil = !k
      ? baris
      : baris.filter((b) => kolom.some((c) => String(c.nilai(b)).toLowerCase().includes(k)));
    if (!urut) return hasil;
    const kol = kolom.find((c) => c.kunci === urut.kunci);
    if (!kol) return hasil;
    return [...hasil].sort((a, b) => {
      const x = kol.nilai(a);
      const y = kol.nilai(b);
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id");
      return urut.naik ? cmp : -cmp;
    });
  }, [baris, kolom, cari, urut]);

  const total = tersaring.length;
  const per = perHalaman ?? (total || 1);
  const totalHalaman = Math.max(1, Math.ceil(total / per));
  const h = Math.min(halaman, totalHalaman);
  const tampil = perHalaman ? tersaring.slice((h - 1) * per, h * per) : tersaring;

  return (
    <div className={kelas}>
      {onCari || aksi ? (
        <div className="k-toolbar">
          {onCari ? (
            <div className="k-input-wrap k-grow">
              <Icon name="search" size="sm" />
              <input
                className="k-input"
                value={cari}
                placeholder={placeholderCari}
                onChange={(e) => {
                  onCari(e.target.value);
                  setHalaman(1);
                }}
                aria-label={placeholderCari}
              />
            </div>
          ) : null}
          {aksi}
        </div>
      ) : null}

      <div className="k-table-wrap">
        <table className="k-table">
          <thead>
            <tr>
              {kolom.map((c) => (
                <th key={c.kunci} style={c.lebar ? { width: c.lebar } : undefined} aria-sort={urut?.kunci === c.kunci ? (urut.naik ? "ascending" : "descending") : "none"}>
                  {c.kunci === "aksi" ? (
                    c.judul
                  ) : (
                    <button
                      type="button"
                      className="k-row-sm"
                      onClick={() => setUrut((u) => (u?.kunci === c.kunci ? { kunci: c.kunci, naik: !u.naik } : { kunci: c.kunci, naik: true }))}
                    >
                      {c.judul}
                      <Icon name={urut?.kunci === c.kunci && !urut.naik ? "arrow-down" : "arrow-up"} size="xs" className={urut?.kunci === c.kunci ? "" : "k-hide"} />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tampil.length === 0 ? (
              <tr>
                <td colSpan={kolom.length} className="k-t-center k-t-muted" style={{ padding: 28 }}>
                  {kosong}
                </td>
              </tr>
            ) : (
              tampil.map((b, i) => (
                <tr key={i}>
                  {kolom.map((c) => (
                    <td key={c.kunci} className={c.rata === "kanan" ? "k-t-right k-td-num" : ""}>
                      {c.sel(b)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {perHalaman && total > per ? (
        <div className="k-table-foot">
          <span className="k-pager-info">
            Menampilkan {(h - 1) * per + 1}–{Math.min(h * per, total)} dari {total} data
          </span>
          <div className="k-pager">
            <button type="button" className="k-pager-item" disabled={h === 1} onClick={() => setHalaman(h - 1)} aria-label="Sebelumnya">
              <Icon name="chevron-left" size="sm" />
            </button>
            <span className="k-pager-item" aria-current="page">{h}</span>
            <button type="button" className="k-pager-item" disabled={h === totalHalaman} onClick={() => setHalaman(h + 1)} aria-label="Berikutnya">
              <Icon name="chevron-right" size="sm" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
