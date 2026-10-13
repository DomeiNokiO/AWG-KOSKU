import { Card, CardHead, SectionTitle, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, PasswordInput, Select, Textarea, Checkbox } from "@/components/ui/Form";
import { Alert, Spinner, EmptyState, Progress, Skeleton } from "@/components/ui/Feedback";
import { DescList } from "@/components/ui/Card";
import { ToastDemo } from "./ToastDemo";

export const metadata = { title: "UI Kit" };

/**
 * Galeri komponen — rujukan visual untuk pengembang.
 * Halaman ini sengaja tanpa data: hanya menampilkan kit.
 */
export default function HalamanKit() {
  return (
    <>
      <SectionTitle judul="UI Kit" sub="Semua komponen AWG-KOSKU dengan palet & spasi yang sama. Rujukan: docs/UI-KIT.md" />

      <div className="k-grid k-grid-2">
        <Card>
          <CardHead judul="Tombol" ikon="pointer" />
          <div className="k-card-body">
            <div className="k-row" style={{ flexWrap: "wrap" }}>
              <Button jenis="primary" ikon="plus">Utama</Button>
              <Button jenis="soft">Soft</Button>
              <Button jenis="outline" ikon="download">Outline</Button>
              <Button jenis="danger" ikon="trash">Bahaya</Button>
              <Button jenis="ghost" ikon="edit">Ghost</Button>
              <Button jenis="primary" memuat>Memuat</Button>
            </div>
            <div className="k-row" style={{ flexWrap: "wrap" }}>
              <Button jenis="primary" ukuran="sm">Kecil</Button>
              <Button jenis="primary">Sedang</Button>
              <Button jenis="primary" ukuran="lg">Besar</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead judul="Badge" ikon="tag" />
          <div className="k-card-body">
            <div className="k-row" style={{ flexWrap: "wrap" }}>
              <Badge tone="info">info</Badge>
              <Badge tone="ok">ok</Badge>
              <Badge tone="warn">warn</Badge>
              <Badge tone="bad">bad</Badge>
              <Badge tone="netral">netral</Badge>
              <Badge tone="violet">violet</Badge>
            </div>
            <DescList items={[{ label: "Tersier", nilai: <Badge tone="info">info</Badge> }, { label: "Accent", nilai: <Badge tone="brand">brand</Badge> }]} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHead judul="Form" ikon="edit" sub="Label, required, hint, error, dan kontrol sensitif." />
        <div className="k-card-body k-col">
          <div className="k-grid k-grid-2">
            <Input label="Nama" name="demo-nama" required bantuan="Nama lengkap sesuai KTP." />
            <Input label="Email" name="demo-email" type="email" error="Format email belum benar." />
            <Select
              label="Metode"
              name="demo-metode"
              opsi={[
                { nilai: "transfer", label: "Transfer" },
                { nilai: "tunai", label: "Tunai" },
                { nilai: "qris", label: "QRIS" },
              ]}
            />
            <PasswordInput label="Sandi" name="demo-sandi" bantuan="Minimal 8 karakter." />
          </div>
          <Textarea label="Catatan" name="demo-catatan" rows={2} placeholder="Opsional…" />
          <div className="k-grid k-grid-2">
            <Checkbox label="Aktifkan denda" name="demo-check-denda" defaultChecked />
            <Checkbox label="Kirim pengingat otomatis" name="demo-check-wa" defaultChecked />
          </div>
        </div>
      </Card>

      <div className="k-grid k-grid-2">
        <Card>
          <CardHead judul="Notifikasi" ikon="bell" />
          <div className="k-card-body k-col">
            <Alert nada="info">Ini informasi umum untuk pengguna.</Alert>
            <Alert nada="ok">Aksi berhasil disimpan.</Alert>
            <Alert nada="warn">Kuota mendekati batas.</Alert>
            <Alert nada="danger">Gagal menyimpan data.</Alert>
            <ToastDemo />
            <div className="k-row"><Spinner /> <span className="k-t-sm k-t-muted">Spinner tunggal</span></div>
          </div>
        </Card>

        <Card>
          <CardHead judul="Statistik & Progress" ikon="chart-line" />
          <div className="k-card-body k-col">
            <div className="k-grid k-grid-2">
              <StatCard nilai="8" label="Kamar Terisi" ikon="bed" warna="green" />
              <StatCard nilai="Rp 18,4jt" label="Pemasukan" ikon="arrow-down-left" warna="blue" tren={{ arah: "up", teks: "+12% vs bulan lalu" }} />
            </div>
            <Progress nilai={48} label="Okupansi 48%" />
            <Progress nilai={92} label="Kuota mendekati batas" ukuran="sm" />
          </div>
        </Card>
      </div>

      <div className="k-grid k-grid-2">
        <Card>
          <CardHead judul="Daftar Baris" ikon="list" />
          <div className="k-card-body">
            <dl className="k-dl">
              <div className="k-dl-item">
                <dt>Kamar A-01 · Budi · Rp 850.000/bln</dt>
                <dd><Badge tone="ok">Terisi</Badge></dd>
              </div>
              <div className="k-dl-item">
                <dt>Kamar A-02 · Kosong</dt>
                <dd><Badge tone="netral">Tersedia</Badge></dd>
              </div>
            </dl>
          </div>
        </Card>
        <Card>
          <CardHead judul="Kosong & Memuat" ikon="inbox" />
          <div className="k-card-body k-col">
            <EmptyState judul="Belum ada data" pesan="Tambahkan kamar pertama untuk memulai." ikon="inbox" />
            <Skeleton baris={2} />
          </div>
        </Card>
      </div>
    </>
  );
}
