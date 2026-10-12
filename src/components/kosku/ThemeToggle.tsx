"use client";

import { useSyncExternalStore } from "react";
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

function bacaTema(): Tema {
  return document.documentElement.getAttribute("data-k-theme") === "gelap" ? "gelap" : "terang";
}
function dengarTema(pemanggil: () => void) {
  window.addEventListener("kosku-tema", pemanggil);
  return () => window.removeEventListener("kosku-tema", pemanggil);
}

export function ThemeToggle() {
  // Sumber kebenaran = atribut DOM (diset skrip awal). Dibaca lewat
  // useSyncExternalStore: tanpa setState di effect, dan sinkron saat hidrasi.
  const tema = useSyncExternalStore(dengarTema, bacaTema, () => "terang" as Tema);
  const siap = useSyncExternalStore(() => () => {}, () => true, () => false);

  const ubah = () => {
    const baru: Tema = tema === "gelap" ? "terang" : "gelap";
    document.documentElement.setAttribute("data-k-theme", baru);
    try {
      localStorage.setItem("kosku-tema", baru);
    } catch {
      /* mode privat: tema tetap berlaku untuk sesi ini */
    }
    // Beritahu pendengar store (useSyncExternalStore) bahwa atribut berubah.
    window.dispatchEvent(new Event("kosku-tema"));
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
