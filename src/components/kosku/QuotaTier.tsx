"use client";

import { Card, CardHead } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Feedback";

/**
 * Panel kuota & tier paket. Data disuntik dari server (dashboard/setting)
 * — komponen ini murni tampil, tanpa fetch.
 */
export function QuotaTier({
  tier = "free",
  terpakai,
  batas,
}: {
  tier?: string;
  terpakai?: number;
  batas?: number;
}) {
  const t = tier.toLowerCase();
  const tone = t === "free" ? "netral" : t === "pro" ? "info" : "ok";
  const pakai = terpakai ?? 0;
  const maks = batas ?? 0;
  const persen = maks > 0 ? Math.min(100, Math.round((pakai / maks) * 100)) : 0;

  return (
    <Card>
      <CardHead judul="Paket & Kuota" ikon="sparkle" aksi={<Badge tone={tone}>{tier.toUpperCase()}</Badge>} />
      <div className="k-card-body k-col">
        <Progress nilai={persen} label={`Kuota terpakai: ${pakai} dari ${maks}`} />
        <p className="k-t-xs k-t-muted">
          {maks > 0
            ? `${maks - pakai} slot tersisa. Upgrade tier untuk menambah jumlah kamar.`
            : "Hubungi pengembang untuk informasi paket."}
        </p>
      </div>
    </Card>
  );
}
