import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";
import { Icon } from "@/components/ui/Icon";
import { MasukForm } from "./MasukForm";

/**
 * AWG-KOSKU — halaman masuk.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Rute ini publik (lihat daftar RUTE_PUBLIK di src/proxy.ts). Kalau
 * pengunjung sudah punya sesi yang sah, ia langsung dialihkan ke dashboard —
 * tidak ada gunanya menampilkan formulir masuk ke pengguna yang sudah masuk.
 */

export const metadata: Metadata = { title: "Masuk" };

const POIN = [
  "Pantau kamar terisi, kosong, dan yang perlu perbaikan.",
  "Kirim pengingat tagihan sekali klik lewat WhatsApp.",
  "Tandai pembayaran lunas tanpa membuka buku kas.",
];

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string; keluar?: string }>;
}) {
  const sp = await searchParams;
  const sesi = await sesiSekarang();
  if (sesi) redirect("/dashboard");

  // Hanya terima jalur internal — mencegah open redirect lewat ?lanjut=https://…
  const lanjut = sp.lanjut && sp.lanjut.startsWith("/") && !sp.lanjut.startsWith("//") ? sp.lanjut : undefined;

  return (
    <div className="k-auth">
      <section className="k-auth-side" aria-label="Tentang AWG-KOSKU">
        <div className="k-auth-side-inner">
          <span className="k-brand-logo" aria-hidden="true">
            <Icon name="house" size="lg" />
          </span>
          <p className="k-auth-eyebrow" style={{ marginTop: 16 }}>
            Manajemen Kamar Kos
          </p>
          <h1 className="k-auth-headline">
            Semua urusan kos
            <br />
            dalam satu dashboard.
          </h1>
          <div className="k-auth-points">
            {POIN.map((p) => (
              <p className="k-auth-point" key={p}>
                <Icon name="check-circle" size="sm" />
                <span>{p}</span>
              </p>
            ))}
          </div>
        </div>
        <p className="k-t-sm" style={{ color: "rgba(255,255,255,.55)", position: "relative", zIndex: 1 }}>
          AWGNET-RACING &amp; AGENT AI TEAM · v1.0
        </p>
      </section>

      <section className="k-auth-main">
        <div className="k-auth-card">
          <h2 className="k-auth-title">Masuk ke AWG-KOSKU</h2>
          <p className="k-auth-sub">Gunakan email dan kata sandi akun Anda.</p>

          <div style={{ marginTop: 24 }}>
            <MasukForm lanjut={lanjut} keluar={Boolean(sp.keluar)} />
          </div>

          <div className="k-auth-note">
            <strong>Akun demo</strong> (dari <code>npm run seed</code>):
            <span className="k-auth-demo">
              <code>admin@kosku.id · kosku12345</code>
              <code>pemilik@kosku.id · kosku12345</code>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
