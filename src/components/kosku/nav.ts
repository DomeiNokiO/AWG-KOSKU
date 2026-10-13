import type { NamaIkon } from "@/components/ui/Icon";

/**
 * AWG-KOSKU — peta navigasi.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Menu dikelompokkan persis seperti struktur aplikasi (lihat dokumen
 * docs/komponen/navigasi.md): setiap grup punya label kecil di atasnya.
 * Halaman dalam tahap penyiapan ditandai `segera` supaya tidak menautkan
 * pengguna ke rute yang belum ada (404 tanpa error yang jelas).
 */

export type ItemNav = {
  label: string;
  href: string;
  ikon: NamaIkon;
  /** true = halaman belum tersedia; ditampilkan tetapi tidak dapat diklik. */
  segera?: boolean;
  lencana?: "tunggakan";
};

export type GrupNav = { label: string; item: ItemNav[] };

export const NAV: GrupNav[] = [
  {
    label: "Utama",
    item: [{ label: "Dashboard", href: "/dashboard", ikon: "gauge" }],
  },
  {
    label: "Penghuni",
    item: [
      { label: "Kamar", href: "/kamar", ikon: "bed" },
      { label: "Penyewa", href: "/penyewa", ikon: "users-round" },
    ],
  },
  {
    label: "Keuangan",
    item: [
      { label: "Pembayaran", href: "/pembayaran", ikon: "wallet", lencana: "tunggakan" },
      { label: "Laporan", href: "/laporan", ikon: "chart-line" },
    ],
  },
  {
    label: "Lainnya",
    item: [
      { label: "Aktivitas", href: "/aktivitas", ikon: "clock-history" },
      { label: "Catatan", href: "/catatan", ikon: "note" },
    ],
  },
  {
    label: "Pengaturan",
    item: [
      { label: "Laporan Bug", href: "/laporan-bug", ikon: "bug" },
      { label: "Setting", href: "/setting", ikon: "gear" },
      { label: "UI Kit", href: "/kit", ikon: "sparkle" },
    ],
  },
];

/** Semua rute nyata (dipakai proxy.ts & halaman 404 yang informatif). */
export const RUTE_ADA = NAV.flatMap((g) => g.item.filter((i) => !i.segera).map((i) => i.href));
