"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * KOSKU-UI — saklar tema terang/gelap.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Tema awal sudah dipasang oleh skrip bertanda nonce di <head> supaya tidak
 * ada kedipan saat memuat. Komponen ini hanya menyinkronkan tombol dengan
 * keadaan sebenarnya setelah hidrasi, jadi tidak pernah "menebak" tema.
 */

type Tema = "terang" | "gelap";

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("terang");
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    const sekarang = (document.documentElement.getAttribute("data-k-theme") as Tema) ?? "terang";
    setTema(sekarang === "gelap" ? "gelap" : "terang");
    setSiap(true);
  }, []);

  const ubah = () => {
    const baru: Tema = tema === "gelap" ? "terang" : "gelap";
    document.documentElement.setAttribute("data-k-theme", baru);
    try {
      localStorage.setItem("kosku-tema", baru);
    } catch {
      /* mode privat: tema tetap berlaku untuk sesi ini */
    }
    setTema(baru);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={tema === "gelap"}
      aria-label={tema === "gelap" ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      className="k-switch k-tip"
      data-tip={tema === "gelap" ? "Tema terang" : "Tema gelap"}
      onClick={ubah}
      disabled={!siap}
    >
      <span className="k-sr">
        <Icon name={tema === "gelap" ? "moon" : "sun"} size="xs" />
      </span>
    </button>
  );
}
