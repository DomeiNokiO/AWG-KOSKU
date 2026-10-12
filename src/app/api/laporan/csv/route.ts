import { NextRequest, NextResponse } from "next/server";
import { sesiSekarang } from "@/lib/sesi";
import { q } from "@/lib/db";
import { csvField } from "@/lib/core/validate.mjs";
import type { BarisCsvRiwayat } from "@/lib/tipe-baris";

/**
 * Export laporan arus kas (CSV).
 *
 * Keamanan:
 *  - wajib sesi (Route Handler tidak otomatis terproteksi oleh layout);
 *  - format tanggal divalidasi dengan regex sebelum masuk query;
 *  - seluruh nilai sel diawali karakter kutip (`'=...`) sehingga formula
 *    Excel/Sheets tidak pernah dieksekusi (CSV formula injection);
 *  - semua query memakai prepared statement.
 */
const TGL = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const sesi = await sesiSekarang();
  if (!sesi) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const hariIni = new Date().toISOString().slice(0, 10);
  const dari = sp.get("dari") || hariIni.slice(0, 8) + "01";
  const sampai = sp.get("sampai") || hariIni;
  if (!TGL.test(dari) || !TGL.test(sampai)) {
    return NextResponse.json({ error: "Format tanggal tidak sah" }, { status: 400 });
  }

  const kas = q.arusKas({ dari, sampai });
  const aging = q.agingTunggakan();
  const riwayat = q.paginan({
    table: "riwayat_bayar r",
    select: "r.tanggal, p.nama, k.nomor AS kamar, b.periode, r.jumlah, r.metode",
    joins: "JOIN penyewa p ON p.id = r.penyewa_id LEFT JOIN kamar k ON k.id = p.kamar_id LEFT JOIN pembayaran b ON b.id = r.tagihan_id",
    where: ["date(r.tanggal) BETWEEN ? AND ?"],
    params: [dari, sampai],
    sort: "tanggal",
    sortWhitelist: ["tanggal"],
    order: "asc",
    page: 1,
    limit: 100000,
  });

  // csvField (core/validate.mjs) menetralkan formula `= + - @` TAB CR dan
  // mengutip sel sesuai RFC 4180 — satu implementasi dipakai di seluruh app.
  const baris = (arr: unknown[]) => arr.map(csvField).join(",");

  const csv = [
    baris(["KOSKU — Laporan Arus Kas"]),
    baris(["Rentang", dari, "s.d.", sampai]),
    "",
    baris(["Ringkasan"]),
    baris(["Pemasukan", kas.pemasukan]),
    baris(["Pengeluaran", kas.pengeluaran]),
    baris(["Bersih", kas.bersih]),
    "",
    baris(["Kategori Pengeluaran", "Total"]),
    ...kas.perKategori.map((k) => baris([k.kategori, k.total])),
    "",
    baris(["Aging Tunggakan"]),
    baris(["Penyewa", "Kamar", "Periode", "Telat (hari)", "Sisa"]),
    ...aging.baris.map((b) => baris([b.nama, b.kamar ?? "-", b.periode, b.telat_hari, b.sisa])),
    "",
    baris(["Riwayat Pembayaran"]),
    baris(["Tanggal", "Penyewa", "Kamar", "Periode", "Jumlah", "Metode"]),
    ...riwayat.data.map((r: BarisCsvRiwayat) => baris([r.tanggal, r.nama, r.kamar ?? "-", r.periode ?? "", r.jumlah, r.metode])),
  ].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${dari}-${sampai}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
