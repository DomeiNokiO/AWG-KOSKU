import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/Feedback";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

/**
 * AWG-KOSKU — halaman lupa kata sandi.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Pemulihan lewat email memerlukan layanan pengiriman (SMTP) yang belum
 * disertakan pada v1.0. Halaman ini menjelaskan keadaan sebenarnya dan
 * memberi jalur yang benar-benar bekerja, bukan formulir yang mengirim
 * permintaan ke ruang hampa.
 */

export default function HalamanLupaSandi() {
  return (
    <div className="k-auth">
      <section className="k-auth-side" aria-label="Tentang AWG-KOSKU">
        <div className="k-auth-side-inner">
          <span className="k-brand-logo" aria-hidden="true">
            <Icon name="key" size="lg" />
          </span>
          <h1 className="k-auth-headline" style={{ marginTop: 16 }}>
            Lupa kata sandi?
          </h1>
          <p className="k-auth-point k-t-md" style={{ marginTop: 12, color: "rgba(255,255,255,.85)" }}>
            Pemulihan mandiri lewat email belum aktif pada versi ini. Ada dua jalur resmi di bawah.
          </p>
        </div>
      </section>

      <section className="k-auth-main">
        <div className="k-auth-card">
          <h2 className="k-auth-title">Cara mengembalikan akses</h2>
          <div className="k-col" style={{ marginTop: 16 }}>
            <Alert nada="brand" judul="1. Jalur cepat (pemilik kos)">
              Jalankan ulang seed untuk mengatur ulang kata sandi akun pemilik:
              <code className="k-mono k-t-sm" style={{ display: "block", marginTop: 6 }}>
                npm run seed
              </code>
            </Alert>
            <Alert nada="info" judul="2. Umumnya">
              Saat sudah masuk, buka <strong>Setting → Keamanan</strong> untuk mengganti kata sandi Anda sendiri.
            </Alert>
            <p className="k-t-sm k-t-muted">
              Jangan pernah mengirim kata sandi lewat pesan atau email. Tim kami tidak pernah memintanya.
            </p>
            <Link className="k-btn k-btn-primary k-btn-block" href="/masuk">
              <Icon name="arrow-left" size="sm" /> Kembali ke halaman masuk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
