"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Icon";
import { Menu, MenuItem } from "@/components/ui/Feedback";
import { ThemeToggle } from "./ThemeToggle";
import type { Sesi } from "@/lib/sesi";

/**
 * AWG-KOSKU — topbar.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Susunan mengikuti referensi desain: judul halaman (diberikan halaman lewat
 * props), lalu di kanan: saklar tema · Pasang Aplikasi · indikator tier ·
 * menu pengguna · menu tambahan.
 */

export function Topbar({ sesi, judul }: { sesi: Sesi; judul: string }) {
  const router = useRouter();
  const [pasang, setPasang] = useState<"siap" | "terpasang" | "takDidukung">("siap");

  /** Navigasi dalam aplikasi wajib lewat router (bukan window.location) —
   *  mempertahankan cache RSC & mencegah reload penuh yang membuang state. */
  const pergi = (ke: string) => () => router.push(ke);

  /** Unduhan CSV: memicu <a programatik>, bukan navigasi halaman. */
  const unduhCsv = () => {
    const a = document.createElement("a");
    a.href = "/api/laporan/csv";
    a.download = "laporan-kosku.csv";
    a.click();
  };

  const pasangAplikasi = () => {
    // PWA belum disertakan di v1.0; tombol tetap ada agar struktur UI sesuai
    // referensi, tetapi memberi tahu pengguna dengan jujur alih-alih diam.
    setPasang("takDidukung");
  };

  return (
    <header className="k-topbar">
      <h1 className="k-topbar-title k-grow">{judul}</h1>

      <div className="k-topbar-actions">
        <ThemeToggle />

        <button
          type="button"
          className="k-btn k-btn-primary k-btn-sm k-hide-sm"
          onClick={pasangAplikasi}
          aria-live="polite"
        >
          <Icon name="download" size="sm" />
          {pasang === "takDidukung" ? "Segera hadir" : "Pasang Aplikasi"}
        </button>

        <span className="k-row-sm k-t-sm k-t-muted k-hide-md k-tip" data-tip={`Tier akun: ${sesi.tier}`}>
          <Icon name="crown" size="sm" />
          {sesi.tier === "free" ? "Free" : sesi.tier}
        </span>

        <Menu
          pemicu={() => (
            <button type="button" className="k-topbar-user" aria-label="Menu pengguna">
              <Avatar nama={sesi.nama} size="sm" />
              <span className="k-user">
                <span className="k-user-name k-hide-sm">{sesi.email.split("@")[0]}</span>
                <Icon name="chevron-down" size="xs" />
              </span>
            </button>
          )}
        >
          <p className="k-menu-label">{sesi.email}</p>
          <MenuItem ikon="user" petunjuk={sesi.peran} onPilih={pergi("/setting")}>
            {sesi.nama}
          </MenuItem>
          <div className="k-menu-sep" />
          <MenuItem ikon="gear" onPilih={pergi("/setting")}>
            Setting akun
          </MenuItem>
          <MenuItem ikon="sparkle" onPilih={pergi("/kit")}>
            UI Kit
          </MenuItem>
          <MenuItem ikon="bug" onPilih={pergi("/laporan-bug")}>
            Laporkan bug
          </MenuItem>
          <div className="k-menu-sep" />
          <MenuItem
            ikon="logout"
            bahaya
            onPilih={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              // Router + refresh: buang cache RSC sesi lama tanpa location assign.
              router.push("/masuk?keluar=1");
              router.refresh();
            }}
          >
            Keluar
          </MenuItem>
        </Menu>

        <Menu
          pemicu={() => (
            <button type="button" className="k-btn k-btn-ghost k-btn-icon k-btn-sm" aria-label="Menu tambahan">
              <Icon name="dots" />
            </button>
          )}
        >
          <p className="k-menu-label">Pintasan</p>
          <MenuItem ikon="table" onPilih={pergi("/pembayaran")}>
            Semua tagihan
          </MenuItem>
          <MenuItem ikon="download" onPilih={unduhCsv}>
            Ekspor CSV
          </MenuItem>
          <MenuItem ikon="printer" onPilih={() => window.print()}>
            Cetak halaman
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
}
