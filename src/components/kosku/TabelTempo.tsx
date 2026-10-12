"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon, Avatar } from "@/components/ui/Icon";
import { Badge, type Nada } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { rupiah, tanggal, selisihHari } from "@/lib/core/format.mjs";
import { tandaiLunasAction } from "@/actions/kosku";
import type { TagihanTempo } from "@/lib/db";

export type BarisTempo = TagihanTempo & { telepon: string };

function labelTempo(diff: number): { text: string; tone: Nada } {
  if (diff < 0) {
    const h = Math.abs(diff);
    return { text: `${h} hari telat`, tone: "bad" };
  }
  if (diff === 0) return { text: "Jatuh tempo hari ini", tone: "warn" };
  if (diff <= 3) return { text: `${diff} hari lagi`, tone: "warn" };
  return { text: `${diff} hari lagi`, tone: "ok" };
}

function pesanPengingat(nama: string, kamar: string | null, jatuh: string, jumlah: number) {
  const telat = selisihHari(jatuh);
  const status = labelTempo(telat).text;
  return (
    `Halo ${nama}, ini pengingat tagihan sewa kamar ${kamar ?? "-"} ` +
    `sebesar ${rupiah(jumlah)} yang jatuh tempo ${tanggal(jatuh)} (${status}). Terima kasih 🙏`
  );
}

export function TabelTempo({ baris }: { baris: BarisTempo[] }) {
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState<{ nada: "ok" | "danger"; teks: string } | null>(null);
  const [pending, mulai] = useTransition();
  const [sedangProses, setSedangProses] = useState<number | null>(null);

  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    if (!k) return baris;
    return baris.filter(
      (b) => b.nama.toLowerCase().includes(k) || String(b.kamar ?? "").toLowerCase().includes(k),
    );
  }, [baris, cari]);

  const bayar = (id: number, nama: string) => {
    setSedangProses(id);
    mulai(async () => {
      const hasil = await tandaiLunasAction(id);
      setPesan({ nada: hasil.error ? "danger" : "ok", teks: hasil.error ?? hasil.sukses ?? "Selesai." });
      setSedangProses(null);
    });
  };

  return (
    <>
      <div className="k-card-head">
        <div className="k-grow">
          <h2 className="k-card-title">
            <Icon name="alert-triangle" size="sm" />
            <span>Jatuh Tempo / Belum Lunas</span>
          </h2>
          <p className="k-card-sub">Diurutkan dari yang paling telat.</p>
        </div>
        <Badge tone="bad">{baris.length}</Badge>
      </div>

      <div className="k-toolbar">
        <div className="k-input-wrap k-grow">
          <Icon name="search" size="sm" />
          <input
            className="k-input"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama atau kamar…"
            aria-label="Cari penyewa atau kamar"
          />
        </div>
        <span className="k-t-sm k-t-muted k-nowrap">
          {tersaring.length} dari {baris.length} data
        </span>
      </div>

      {pesan ? (
        <div style={{ padding: "12px 20px 0" }}>
          <Alert nada={pesan.nada} onTutup={() => setPesan(null)}>
            {pesan.teks}
          </Alert>
        </div>
      ) : null}

      <div className="k-table-wrap k-table-cards">
        <table className="k-table">
          <thead>
            <tr>
              <th scope="col">Penyewa</th>
              <th scope="col">Kamar</th>
              <th scope="col">Jatuh Tempo</th>
              <th scope="col" className="k-t-right">Tagihan</th>
              <th scope="col">Status Tempo</th>
              <th scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tersaring.length === 0 ? (
              <tr>
                <td colSpan={6} className="k-t-center k-t-muted" style={{ padding: 32 }}>
                  Tidak ada tagihan yang cocok. Semua lunas itu kabar baik. 🎉
                </td>
              </tr>
            ) : (
              tersaring.map((b) => {
                const diff = selisihHari(b.jatuh_tempo);
                const tempo = labelTempo(diff);
                const link = `https://wa.me/${b.telepon}?text=${encodeURIComponent(
                  pesanPengingat(b.nama, b.kamar, b.jatuh_tempo, b.jumlah),
                )}`;

                return (
                  <tr key={b.id}>
                    <td data-label="Penyewa">
                      <span className="k-td-tenant">
                        <Avatar nama={b.nama} size="sm" />
                        <span className="k-td-tenant-name">{b.nama}</span>
                      </span>
                    </td>
                    <td data-label="Kamar" className="k-td-strong">{b.kamar ?? "-"}</td>
                    <td data-label="Jatuh Tempo" className="k-td-num">{tanggal(b.jatuh_tempo)}</td>
                    <td data-label="Tagihan" className="k-t-right k-td-num k-td-strong">{rupiah(b.jumlah)}</td>
                    <td data-label="Status Tempo">
                      <Badge tone={tempo.tone} dot>{tempo.text}</Badge>
                    </td>
                    <td data-label="Aksi">
                      <span className="k-row-actions">
                        <a
                          className="k-btn k-btn-success k-btn-sm"
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Kirim pengingat WhatsApp ke ${b.nama}`}
                        >
                          <Icon name="whatsapp" size="sm" /> Kirim
                        </a>
                        <Button
                          jenis="primary"
                          ukuran="sm"
                          ikon="wallet"
                          memuat={pending && sedangProses === b.id}
                          onClick={() => bayar(b.id, b.nama)}
                          aria-label={`Tandai lunas tagihan ${b.nama}`}
                        >
                          Bayar
                        </Button>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}