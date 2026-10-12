import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { rupiah } from "@/lib/core/format.mjs";
import type { KamarRingkas } from "@/lib/db";

/** Kartu daring untuk satu kamar. */
export function KartuKamar({ k }: { k: KamarRingkas }) {
  return (
    <Card hover>
      <div className="k-card-body k-col" style={{ gap: "var(--k-s3)" }}>
        <div className="k-between">
          <span className="k-h2">{k.nomor}</span>
          <Badge tone={k.status === "terisi" ? "ok" : k.status === "perbaikan" ? "bad" : "netral"}>
            {k.status === "terisi" ? "Terisi" : k.status === "perbaikan" ? "Perbaikan" : "Kosong"}
          </Badge>
        </div>
        <div className="k-col" style={{ gap: 2 }}>
          <span className="k-t-sm k-t-muted">{k.tipe} · Lantai {k.lantai}</span>
          <span className="k-t-strong">{rupiah(k.tarif)}<span className="k-t-sm k-t-muted">/bulan</span></span>
        </div>
        <div className="k-hr" />
        <div className="k-between">
          {k.penyewa ? (
            <span className="k-row-sm"><Icon name="user" size="sm" /> {k.penyewa}</span>
          ) : (
            <span className="k-t-sm k-t-muted">Belum ada penyewa</span>
          )}
          <Icon name="chevron-right" size="sm" className="k-t-faint" />
        </div>
      </div>
    </Card>
  );
}