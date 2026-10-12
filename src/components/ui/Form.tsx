"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId, useState } from "react";
import { Icon, type NamaIkon } from "./Icon";

/**
 * KOSKU-UI — kontrol formulir.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Prinsip yang dipakai:
 *  - label selalu terhubung ke input lewat `htmlFor`/`id` (klik label fokus);
 *  - pesan error ditulis di bawah field dan diumumkan ke pembaca layar
 *    (`aria-invalid` + `aria-describedby`), bukan hanya diwarnai merah;
 *  - setiap input punya `name` supaya bisa dikirim lewat FormData/Server Action.
 */

/* ------------------------------------------------------------------ Field */

export function Field({
  label,
  htmlFor,
  bantuan,
  error,
  wajib = false,
  children,
}: {
  label?: string;
  htmlFor?: string;
  bantuan?: string;
  error?: string | null;
  wajib?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={["k-field", error ? "k-field-error" : ""].filter(Boolean).join(" ")}>
      {label ? (
        <label className="k-label" htmlFor={htmlFor}>
          {label}
          {wajib ? <span className="k-req">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="k-error-text">{error}</p> : null}
      {!error && bantuan ? <p className="k-help">{bantuan}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Input */

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  bantuan?: string;
  error?: string | null;
  ikon?: NamaIkon | string;
  /** Tombol kecil di ujung input (mis. mata untuk kata sandi). */
  tambahan?: ReactNode;
};

export function Input({ label, bantuan, error, ikon, tambahan, className = "", id, ...rest }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;

  return (
    <Field label={label} htmlFor={fid} bantuan={bantuan} error={error} wajib={rest.required}>
      <div className={["k-input-wrap", tambahan ? "k-has-suffix" : ""].filter(Boolean).join(" ")}>
        {ikon ? <Icon name={ikon} size="sm" /> : null}
        <input
          id={fid}
          className={["k-input", className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : undefined}
          {...rest}
        />
        {tambahan ? <span className="k-input-suffix">{tambahan}</span> : null}
      </div>
      {error ? (
        <span id={`${fid}-err`} className="k-sr">
          {error}
        </span>
      ) : null}
    </Field>
  );
}

/** Input kata sandi dengan tombol lihat/sembunyikan. */
export function PasswordInput({ label, bantuan, error, id, ...rest }: Omit<InputProps, "type" | "tambahan" | "ikon">) {
  const [lihat, setLihat] = useState(false);
  const auto = useId();
  const fid = id ?? auto;

  return (
    <Field label={label} htmlFor={fid} bantuan={bantuan} error={error} wajib={rest.required}>
      <div className="k-input-wrap k-has-suffix">
        <Icon name="lock" size="sm" />
        <input
          id={fid}
          type={lihat ? "text" : "password"}
          className="k-input"
          autoComplete={rest.autoComplete ?? "current-password"}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        <span className="k-input-suffix">
          <button
            type="button"
            className="k-btn k-btn-ghost k-btn-icon k-btn-sm k-tip"
            data-tip={lihat ? "Sembunyikan" : "Lihat"}
            aria-label={lihat ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
            aria-pressed={lihat}
            onClick={() => setLihat((v) => !v)}
          >
            <Icon name={lihat ? "eye-off" : "eye"} size="sm" />
          </button>
        </span>
      </div>
      {error ? (
        <span id={`${fid}-err`} className="k-sr">
          {error}
        </span>
      ) : null}
    </Field>
  );
}

/** Input rupiah: menampilkan "1.100.000" sambil menyimpan angka polos. */
export function RupiahInput({
  label,
  bantuan,
  error,
  nilai,
  onNilai,
  name,
  required,
}: {
  label?: string;
  bantuan?: string;
  error?: string | null;
  nilai: number;
  onNilai: (n: number) => void;
  name?: string;
  required?: boolean;
}) {
  const auto = useId();
  const tampil = nilai ? new Intl.NumberFormat("id-ID").format(nilai) : "";

  return (
    <Field label={label} htmlFor={auto} bantuan={bantuan} error={error} wajib={required}>
      <div className="k-input-wrap">
        <span className="k-ic k-ic-sm" aria-hidden="true" style={{ position: "static", marginRight: 6 }}>
          Rp
        </span>
        <input
          id={auto}
          name={name}
          className="k-input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          required={required}
          value={tampil}
          onChange={(e) => {
            const digit = e.target.value.replace(/[^0-9]/g, "");
            onNilai(digit ? Math.min(Number.parseInt(digit, 10) || 0, 999_999_999_999) : 0);
          }}
        />
      </div>
    </Field>
  );
}

/* ------------------------------------------------------------------ Textarea */

export function Textarea({
  label,
  bantuan,
  error,
  id,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; bantuan?: string; error?: string | null }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} htmlFor={fid} bantuan={bantuan} error={error} wajib={rest.required}>
      <textarea id={fid} className="k-textarea" aria-invalid={error ? true : undefined} {...rest} />
    </Field>
  );
}

/* ------------------------------------------------------------------ Select */

export function Select({
  label,
  bantuan,
  error,
  opsi,
  id,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  bantuan?: string;
  error?: string | null;
  opsi: { nilai: string; label: string }[];
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field label={label} htmlFor={fid} bantuan={bantuan} error={error} wajib={rest.required}>
      <select id={fid} className="k-select" aria-invalid={error ? true : undefined} {...rest}>
        {opsi.map((o) => (
          <option key={o.nilai} value={o.nilai}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* --------------------------------------------------- Check / Radio / Switch */

export function Checkbox({
  label,
  keterangan,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; keterangan?: string }) {
  return (
    <label className="k-check">
      <input type="checkbox" {...rest} />
      <span>
        {label}
        {keterangan ? <span className="k-check-desc">{keterangan}</span> : null}
      </span>
    </label>
  );
}

export function Radio({
  label,
  keterangan,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string; keterangan?: string }) {
  return (
    <label className="k-radio">
      <input type="radio" {...rest} />
      <span>
        {label}
        {keterangan ? <span className="k-check-desc">{keterangan}</span> : null}
      </span>
    </label>
  );
}

/**
 * Saklar (switch). Dikendalikan penuh oleh pemanggil (`checked`/`onChange`),
 * jadi tidak ada dua sumber kebenaran untuk satu keadaan.
 */
export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <div className="k-row">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className="k-switch"
        onClick={() => onChange(!checked)}
      />
      <span className="k-t-sm k-t-muted">{label}</span>
    </div>
  );
}

/** Kontrol bergaya segmen (tab kecil). */
export function Segmented<T extends string>({
  nilai,
  onUbah,
  opsi,
  label,
}: {
  nilai: T;
  onUbah: (v: T) => void;
  opsi: { nilai: T; label: string }[];
  label?: string;
}) {
  return (
    <div className="k-seg" role="tablist" aria-label={label}>
      {opsi.map((o) => (
        <button
          key={o.nilai}
          type="button"
          role="tab"
          aria-selected={nilai === o.nilai}
          className="k-seg-item"
          onClick={() => onUbah(o.nilai)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
