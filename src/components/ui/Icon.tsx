import type { SVGProps } from "react";

/**
 * KOSKU-UI — ikon dari sprite lokal /icons.svg.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Semua ikon berasal dari sprite yang di-host sendiri (public/icons.svg),
 * jadi tidak ada permintaan ke CDN mana pun. Nama yang tidak ada di sprite
 * TIDAK diam-diam menghasilkan kotak kosong: kita sengaja menampilkan ikon
 * "help" supaya salah ketik langsung terlihat saat pengembangan.
 */

/** Daftar id yang benar-benar ada di public/icons.svg (dijaga oleh test/ikon.test.mjs). */
export const IKON = [
  "gauge","activity","server","wifi","database","cpu","hdd","network","globe",
  "alert-triangle","info","check-circle","x-circle","check","x","chevron-down",
  "chevron-right","chevron-left","chevron-up","menu","moon","sun","droplet","search",
  "bell","users","users-round","printer","download","upload","eye","eye-off","pen",
  "pen-line","trash","trash-2","file","file-text","arrow-up","arrow-down","arrow-left",
  "arrow-right","arrow-up-right","plus","minus","plus-circle","sliders","refresh",
  "refresh-cw","power","flag","box","link","clock","clock-history","zap","receipt",
  "money","money-bill","coins","coffee","store","user-plus","user-check","share",
  "filter","copy","pointer","square","circle","check-square","compass","folder","chat",
  "cloud-upload","cloud-sun","contrast","ellipsis","dots","type","image","excel","pdf",
  "router","chart","chart-line","chart-pie","table","calendar","calendar-check","route",
  "kanban","loader","hand","footprints","map-pin","map-pin-house","target","alert-circle",
  "help-circle","play-circle","mail","map","monitor","pie-chart","shield","shield-check",
  "smartphone","user","bed","gear","note","bug","logout","login","crown","house",
  "house-plus","wallet","card","whatsapp","send","paperclip","building","key","tag",
  "clipboard","sparkle","wrench","list","grid","inbox","lock","moon-star","badge-check",
  "quote","door",
] as const;

export type NamaIkon = (typeof IKON)[number];

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: NamaIkon | string;
  /** Ukuran praktis: xs 14 · sm 16 · md 20 (default) · lg 24 · xl 32 */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  title?: string;
};

export function Icon({ name, size = "md", className = "", title, ...rest }: Props) {
  const ada = (IKON as readonly string[]).includes(name);
  const id = ada ? name : "help-circle";
  const kelas = ["k-ic", size !== "md" ? `k-ic-${size}` : "", className].filter(Boolean).join(" ");

  return (
    <svg
      className={kelas}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <use href={`/icons.svg#ic-${id}`} />
    </svg>
  );
}

/** Avatar huruf awal — tanpa gambar eksternal, tanpa permintaan jaringan. */
export function Avatar({
  nama,
  size = "md",
  className = "",
}: {
  nama: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const awal = nama
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  const kelas = ["k-avatar", size !== "md" ? `k-avatar-${size}` : "", className].filter(Boolean).join(" ");
  return (
    <span className={kelas} aria-hidden="true">
      {awal || "?"}
    </span>
  );
}
