"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Filter rentang tanggal — state di URL supaya bisa dibagikan/dicetak ulang. */
export function FilterTanggal({ dari, sampai }: { dari: string; sampai: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [d, setD] = useState(dari);
  const [s, setS] = useState(sampai);

  // Sinkron saat URL berubah (mis. tombol "Terapkan" / tombol lunas di tab
  // laporan): state di-adjust saat render, bukan di useEffect — tanpa
  // set-state-in-effect dan tanpa render basi.
  const [dariSebelumnya, setDariSebelumnya] = useState(dari);
  const [sampaiSebelumnya, setSampaiSebelumnya] = useState(sampai);
  if (dariSebelumnya !== dari) {
    setDariSebelumnya(dari);
    setD(dari);
  }
  if (sampaiSebelumnya !== sampai) {
    setSampaiSebelumnya(sampai);
    setS(sampai);
  }

  const terapkan = () => {
    const q = new URLSearchParams(sp.toString());
    q.set("dari", d);
    q.set("sampai", s);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  return (
    <div className="k-toolbar">
      <div className="k-row-sm" style={{ flexWrap: "wrap" }}>
        <label className="k-t-sm k-t-muted">Dari</label>
        <input className="k-input k-input-sm" type="date" value={d} onChange={(e) => setD(e.target.value)} aria-label="Tanggal mulai" />
        <label className="k-t-sm k-t-muted">Sampai</label>
        <input className="k-input k-input-sm" type="date" value={s} onChange={(e) => setS(e.target.value)} aria-label="Tanggal selesai" />
      </div>
      <div className="k-grow" />
      <Button jenis="primary" ukuran="sm" ikon="filter" onClick={terapkan}>Terapkan</Button>
    </div>
  );
}
