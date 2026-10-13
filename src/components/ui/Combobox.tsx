"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * AWG-KOSKU — Combobox (select dengan pencarian) & MultiSelect.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Kenapa bukan `<select>` biasa: pilihan kamar/penyewa bisa ratusan dan
 * `<select>` tidak bisa dicari. Komponen ini tetap ramah keyboard:
 *   ↑/↓ pindah sorotan · Enter pilih · Esc tutup · ketik untuk menyaring.
 *
 * Catatan penting soal nilai: input tersembunyi (`name`) selalu membawa
 * nilai yang sesungguhnya, jadi komponen ini tetap bekerja di dalam
 * `<form>` + Server Action tanpa JS tambahan di sisi pemanggil.
 */

export type Opsi = {
  nilai: string;
  label: string;
  /** Keterangan kecil di kanan (mis. tarif kamar). */
  meta?: string;
  /** Grup opsional untuk pengelompokan. */
  grup?: string;
  nonaktif?: boolean;
};

type Umum = {
  opsi: Opsi[];
  placeholder?: string;
  label?: string;
  bantuan?: string;
  error?: string | null;
  name?: string;
  required?: boolean;
  kosongTeks?: string;
  disabled?: boolean;
};

/**
 * Saring opsi. Sengaja tanpa useMemo: jumlah opsi form biasanya puluhan dan
 * filter O(n) lebih murah daripada memoisasi — juga tidak boleh pakai hook
 * di fungsi non-komponen (rules-of-hooks).
 */
function saring(opsi: Opsi[], cari: string) {
  const k = cari.trim().toLowerCase();
  if (!k) return opsi;
  return opsi.filter(
    (o) =>
      o.label.toLowerCase().includes(k) ||
      o.nilai.toLowerCase().includes(k) ||
      (o.meta ?? "").toLowerCase().includes(k),
  );
}

/* ---------------------------------------------------------------- Tunggal */

export function Combobox({
  opsi,
  nilai,
  onPilih,
  placeholder = "Pilih…",
  label,
  bantuan,
  error,
  name,
  required = false,
  kosongTeks = "Tidak ada hasil.",
  disabled = false,
}: Umum & { nilai: string; onPilih: (v: string) => void }) {
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const [sorot, setSorot] = useState(0);
  const akar = useRef<HTMLDivElement>(null);
  const id = useId();

  const hasil = saring(opsi, cari);
  const terpilih = opsi.find((o) => o.nilai === nilai);

  // Tutup saat klik di luar. Reset sorotan dilakukan di handler pembuka,
  // bukan di effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!buka) return;
    const onDoc = (e: MouseEvent) => {
      if (akar.current && !akar.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [buka]);

  const pilih = (o: Opsi) => {
    if (o.nonaktif) return;
    onPilih(o.nilai);
    setBuka(false);
    setCari("");
  };

  return (
    <div className={["k-field", error ? "k-field-error" : ""].filter(Boolean).join(" ")}>
      {label ? (
        <label className="k-label" htmlFor={id}>
          {label}
          {required ? <span className="k-req">*</span> : null}
        </label>
      ) : null}

      <div className="k-combo" ref={akar}>
        <button
          type="button"
          id={id}
          className="k-combo-trigger"
          aria-expanded={buka}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => { setSorot(0); setBuka((v) => !v); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSorot(0);
              setBuka(true);
            }
          }}
        >
          <span className={["k-combo-value", terpilih ? "" : "k-placeholder"].filter(Boolean).join(" ")}>
            {terpilih ? terpilih.label : placeholder}
          </span>
          <Icon name="chevron-down" size="sm" />
        </button>

        {buka ? (
          <div className="k-combo-panel" role="listbox" aria-label={label ?? "Pilihan"}>
            <div className="k-combo-search">
              <Icon name="search" size="sm" />
              <input
                className="k-input"
                autoFocus
                value={cari}
                placeholder="Cari…"
                onChange={(e) => setCari(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSorot((s) => Math.min(s + 1, hasil.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSorot((s) => Math.max(s - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (hasil[sorot]) pilih(hasil[sorot]);
                  } else if (e.key === "Escape") {
                    setBuka(false);
                  }
                }}
              />
            </div>

            {hasil.length === 0 ? (
              <p className="k-combo-empty">{kosongTeks}</p>
            ) : (
              hasil.map((o, i) => (
                <div
                  key={o.nilai}
                  role="option"
                  aria-selected={o.nilai === nilai}
                  className={["k-combo-opt", i === sorot ? "k-active" : ""].filter(Boolean).join(" ")}
                  onMouseEnter={() => setSorot(i)}
                  onClick={() => pilih(o)}
                >
                  <span>{o.label}</span>
                  {o.meta ? <span className="k-combo-meta">{o.meta}</span> : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {name ? <input type="hidden" name={name} value={nilai} /> : null}
      {error ? <p className="k-error-text">{error}</p> : null}
      {!error && bantuan ? <p className="k-help">{bantuan}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Multi */

export function MultiSelect({
  opsi,
  nilai,
  onUbah,
  placeholder = "Pilih beberapa…",
  label,
  bantuan,
  error,
  name,
  disabled = false,
  maks = 50,
}: Umum & { nilai: string[]; onUbah: (v: string[]) => void; maks?: number }) {
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState("");
  const akar = useRef<HTMLDivElement>(null);
  const id = useId();
  const hasil = saring(opsi, cari);

  useEffect(() => {
    if (!buka) return;
    const onDoc = (e: MouseEvent) => {
      if (akar.current && !akar.current.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [buka]);

  const toggle = (v: string) => {
    if (nilai.includes(v)) onUbah(nilai.filter((x) => x !== v));
    else if (nilai.length < maks) onUbah([...nilai, v]);
  };

  return (
    <div className={["k-field", error ? "k-field-error" : ""].filter(Boolean).join(" ")}>
      {label ? <span className="k-label">{label}</span> : null}

      <div className="k-combo" ref={akar}>
        <button
          type="button"
          id={id}
          className="k-combo-trigger"
          aria-expanded={buka}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setBuka((v) => !v)}
        >
          {nilai.length === 0 ? (
            <span className="k-combo-value k-placeholder">{placeholder}</span>
          ) : (
            <span className="k-combo-tags">
              {nilai.slice(0, 3).map((v) => (
                <span key={v} className="k-combo-tag">
                  {opsi.find((o) => o.nilai === v)?.label ?? v}
                </span>
              ))}
              {nilai.length > 3 ? <span className="k-combo-tag">+{nilai.length - 3}</span> : null}
            </span>
          )}
          <Icon name="chevron-down" size="sm" />
        </button>

        {buka ? (
          <div className="k-combo-panel" role="listbox" aria-multiselectable="true" aria-label={label ?? "Pilihan"}>
            <div className="k-combo-search">
              <Icon name="search" size="sm" />
              <input className="k-input" autoFocus value={cari} placeholder="Cari…" onChange={(e) => setCari(e.target.value)} />
            </div>
            {hasil.length === 0 ? (
              <p className="k-combo-empty">Tidak ada hasil.</p>
            ) : (
              hasil.map((o) => (
                <div
                  key={o.nilai}
                  role="option"
                  aria-selected={nilai.includes(o.nilai)}
                  className={["k-combo-opt", nilai.includes(o.nilai) ? "k-active" : ""].filter(Boolean).join(" ")}
                  onClick={() => toggle(o.nilai)}
                >
                  <input type="checkbox" checked={nilai.includes(o.nilai)} readOnly tabIndex={-1} />
                  <span>{o.label}</span>
                  {o.meta ? <span className="k-combo-meta">{o.meta}</span> : null}
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {name
        ? nilai.map((v) => <input key={v} type="hidden" name={name} value={v} />)
        : null}
      {error ? <p className="k-error-text">{error}</p> : null}
      {!error && bantuan ? <p className="k-help">{bantuan}</p> : null}
    </div>
  );
}
