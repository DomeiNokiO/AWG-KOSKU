"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { Confirm } from "@/components/ui/Feedback";
import { NAV } from "./nav";
import type { Sesi } from "@/lib/sesi";

/**
 * AWG-KOSKU — sidebar.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Perilaku responsif: di bawah 900px sidebar berubah menjadi panel geser
 * yang dibuka lewat tombol hamburger di topbar. Status terlarang (miskin
 * JS) tetap terlayani karena tautan berupa <a> sungguhan, bukan div berklik.
 */

export function Sidebar({ sesi, tunggakan }: { sesi: Sesi; tunggakan: number }) {
  const path = usePathname();
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [tanyaKeluar, setTanyaKeluar] = useState(false);
  const [pending, mulai] = useTransition();

  const keluar = async () => {
    // Endpoint POST: logout harus mengubah keadaan, jadi tidak boleh lewat
    // GET (bisa dipicu oleh <img src> di halaman lain).
    await fetch("/api/auth/logout", { method: "POST" });
    // push (bukan window.location) supaya cache RSC lama tidak berisi data
    // privat sesi sebelumnya; refresh memaksa render ulang di server.
    router.push("/masuk?keluar=1");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        className="k-hamburger k-btn k-btn-ghost k-btn-icon"
        aria-label="Buka menu"
        aria-expanded={buka}
        onClick={() => setBuka((v) => !v)}
      >
        <Icon name="menu" />
      </button>

      {buka ? <div className="k-sb-backdrop" onClick={() => setBuka(false)} /> : null}

      <aside className={["k-sidebar", buka ? "k-open" : ""].filter(Boolean).join(" ")} aria-label="Menu utama">
        <div className="k-brand-box">
          <span className="k-brand-logo" aria-hidden="true">
            <Icon name="house" size="lg" />
          </span>
          <span className="k-grow">
            <span className="k-brand-name">AWG-KOSKU</span>
            <span className="k-brand-tag">Manajemen Kamar Kos</span>
          </span>
          {/* Tombol tutup: di mobile topbar tertutup drawer, sehingga tanpa
              tombol ini satu-satunya jalan keluar adalah menebak backdrop. */}
          <button type="button" className="k-sb-close" aria-label="Tutup menu" onClick={() => setBuka(false)}>
            <Icon name="x" size="sm" />
          </button>
        </div>

        <nav className="k-nav">
          {NAV.map((grup) => (
            <div key={grup.label}>
              <p className="k-nav-label">{grup.label}</p>
              {grup.item.map((item) => {
                const aktif = path === item.href || path.startsWith(`${item.href}/`);
                const isi = (
                  <>
                    <Icon name={item.ikon} size="sm" />
                    <span>{item.label}</span>
                    {item.lencana === "tunggakan" && tunggakan > 0 ? (
                      <span className="k-nav-badge k-badge k-badge-bad">{tunggakan}</span>
                    ) : null}
                    {item.label === "Setting" ? <Icon name="chevron-right" size="xs" className="k-nav-chev" /> : null}
                  </>
                );

                return item.segera ? (
                  <span key={item.href} className="k-nav-link" aria-disabled="true" style={{ opacity: 0.55, cursor: "not-allowed" }}>
                    {isi}
                  </span>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={["k-nav-link", aktif ? "k-active" : ""].filter(Boolean).join(" ")}
                    aria-current={aktif ? "page" : undefined}
                    onClick={() => setBuka(false)}
                  >
                    {isi}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="k-side-foot">
          <div className="k-tier">
            <span className="k-tier-lbl">Tier Kamu</span>
            <span className="k-tier-val">{sesi.tier === "free" ? "FREE" : sesi.tier.toUpperCase()}</span>
          </div>

          <button
            type="button"
            className="k-logout"
            onClick={() => setTanyaKeluar(true)}
            disabled={pending}
            aria-label={`Keluar dari akun ${sesi.nama}`}
          >
            <Icon name="logout" size="sm" />
            {pending ? "Keluar…" : "Keluar"}
          </button>
        </div>
      </aside>

      <Confirm
        buka={tanyaKeluar}
        judul="Keluar dari AWG-KOSKU?"
        pesan={
          <>
            Anda akan keluar dari akun <strong>{sesi.nama}</strong>. Sesi berakhir dan Anda kembali ke halaman masuk.
          </>
        }
        labelYa="Ya, keluar"
        labelTidak="Tetap di sini"
        onYa={() => mulai(() => void keluar())}
        onTidak={() => setTanyaKeluar(false)}
      />
    </>
  );
}
