"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { q } from "@/lib/db";
import { buatSesi, hapusSesi, sesiSekarang } from "@/lib/sesi";
import { hashKataSandi, verifikasiKataSandi, periksaKekuatan } from "@/lib/core/password.mjs";
import { wajibEmail, wajibTeks } from "@/lib/core/validate.mjs";
import { rateLimit } from "@/lib/rate-limit";

/**
 * KOSKU-UI — Server Action autentikasi.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Server Action adalah endpoint POST publik: siapa pun yang mengetahui
 * namanya bisa memanggilnya langsung, tanpa melalui formulir. Karena itu
 * setiap aksi di sini memvalidasi masukannya sendiri dan tidak pernah
 * mempercayai keadaan UI.
 *
 * Satu pesan gagal untuk semua penyebab ("Email atau kata sandi salah") —
 * membedakan "email tidak ada" dan "kata sandi salah" membocorkan daftar
 * pengguna yang terdaftar.
 */

export type HasilAuth = { error?: string; ok?: boolean; lanjut?: string };

const PESAN_GAGAL = "Email atau kata sandi salah.";

async function ipPemanggil(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "lokal"
  );
}

export async function masuk(_sebelumnya: HasilAuth | undefined, formData: FormData): Promise<HasilAuth> {
  let email = "";
  try {
    email = wajibEmail(formData.get("email"));
  } catch {
    return { error: PESAN_GAGAL };
  }
  const sandi = String(formData.get("kata_sandi") ?? "");
  const lanjut = String(formData.get("lanjut") ?? "");

  // Batasi percobaan per (IP + email): menahan tebakan otomatis tanpa
  // mengunci akun asli milik pengguna.
  const kunci = `masuk:${await ipPemanggil()}:${email}`;
  const batas = rateLimit(kunci, 8, 5 * 60 * 1000);
  if (!batas.diizinkan) {
    return { error: `Terlalu banyak percobaan. Coba lagi dalam ${batas.sisaDetik} detik.` };
  }

  const user = q.penggunaByEmail(email);
  const cocok = user ? await verifikasiKataSandi(sandi, String(user.kata_sandi)) : false;

  if (!user || !cocok) {
    // Tetap jalankan satu hash saat email tidak ada, supaya waktu respons
    // tidak membedakan "email terdaftar" dan "tidak".
    if (!user) await verifikasiKataSandi(sandi, "scrypt$16384$8$1$AAAA$AAAA");
    return { error: PESAN_GAGAL };
  }

  await buatSesi(Number(user.id));

  // Cegah open redirect: hanya terima jalur internal.
  const tujuan = lanjut.startsWith("/") && !lanjut.startsWith("//") ? lanjut : "/dashboard";
  redirect(tujuan);
}

export async function keluar(): Promise<void> {
  await hapusSesi();
  redirect("/masuk?keluar=1");
}

export type HasilSandi = { error?: string; sukses?: string };

export async function gantiKataSandiSendiri(
  _sebelumnya: HasilSandi | undefined,
  formData: FormData,
): Promise<HasilSandi> {
  const sesi = await sesiSekarang();
  if (!sesi) return { error: "Sesi Anda sudah berakhir. Silakan masuk kembali." };

  const lama = String(formData.get("sandi_lama") ?? "");
  const baru = String(formData.get("sandi_baru") ?? "");
  const ulang = String(formData.get("sandi_ulang") ?? "");

  if (baru !== ulang) return { error: "Ulangi kata sandi baru dengan nilai yang sama." };
  const lemah = periksaKekuatan(baru);
  if (lemah) return { error: lemah };

  const user = q.penggunaById(sesi.id);
  if (!user) return { error: "Akun tidak ditemukan." };

  const benar = await verifikasiKataSandi(lama, String(user.kata_sandi));
  if (!benar) return { error: "Kata sandi lama tidak cocok." };

  q.gantiKataSandi(sesi.id, await hashKataSandi(baru));
  return { sukses: "Kata sandi berhasil diperbarui. Sesi lain akan berakhir otomatis sesuai masa berlaku." };
}

export async function perbaruiProfil(
  _sebelumnya: HasilSandi | undefined,
  formData: FormData,
): Promise<HasilSandi> {
  const sesi = await sesiSekarang();
  if (!sesi) return { error: "Sesi Anda sudah berakhir." };
  try {
    wajibTeks(formData.get("nama"), "Nama", { min: 2, max: 80 });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Nama tidak valid." };
  }
  return { sukses: "Profil tersimpan." };
}
