import "server-only";
import { cookies } from "next/headers";
import { env } from "./env";
import { q, PERAN_SAH, type Peran } from "./db";
import { bacaTokenSesi, buatTokenSesi, namaCookie } from "./core/session.mjs";

/**
 * KOSKU-UI — manajemen sesi.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Sesi = cookie berisi <payload>.<tanda tangan HMAC-SHA256>. Ini sesi
 * "stateless": tidak ada tabel sesi, tidak ada id yang bisa ditebak, dan
 * tetap sah walau proses di-restart atau ada beberapa instance.
 *
 * Trade-off yang disadari: mencabut satu sesi sebelum TTL habis butuh daftar
 * cabut (bukan bawaan). Untuk aplikasi ini TTL 12 jam dianggap memadai —
 * dicatat di README bagian "Batasan".
 *
 * Cookie TIDAK PERNAH memuat kata sandi atau data pribadi lain: hanya id
 * pengguna. Peran & tier selalu dibaca ULANG dari database tiap permintaan,
 * sehingga penurunan hak akses langsung berlaku tanpa menunggu logout.
 */

export type Sesi = {
  id: number;
  nama: string;
  email: string;
  peran: Peran;
  tier: string;
};

const COOKIE = namaCookie(env.cookieSecure);

export async function buatSesi(userId: number): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, buatTokenSesi(userId, env.sessionSecret, env.sessionTtlMs), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    path: "/",
    maxAge: Math.floor(env.sessionTtlMs / 1000),
  });
}

export async function hapusSesi(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: env.cookieSecure,
    path: "/",
    maxAge: 0,
  });
}

export async function sesiSekarang(): Promise<Sesi | null> {
  const jar = await cookies();
  const muatan = bacaTokenSesi(jar.get(COOKIE)?.value, env.sessionSecret);
  if (!muatan) return null;

  const row = q.penggunaById(muatan.sub);
  if (!row) return null;

  const peran = (PERAN_SAH as readonly string[]).includes(row.peran) ? (row.peran as Peran) : "kasir";
  return { id: Number(row.id), nama: String(row.nama), email: String(row.email), peran, tier: String(row.tier) };
}

/**
 * Dipakai di setiap Server Action & Route Handler.
 *
 * Kenapa tidak cukup "tombolnya disembunyikan": Server Action adalah endpoint
 * POST publik — siapa pun yang tahu namanya bisa memanggilnya langsung tanpa
 * melewati UI. Karena itu otorisasi diperiksa di sisi server, per aksi.
 */
export async function wajibSesi(): Promise<Sesi> {
  const sesi = await sesiSekarang();
  if (!sesi) throw new Error("UNAUTHORIZED");
  return sesi;
}

/** Hanya peran tertentu yang boleh (mis. hanya pemilik boleh menghapus). */
export async function wajibPeran(daftar: readonly Peran[]): Promise<Sesi> {
  const sesi = await wajibSesi();
  if (!daftar.includes(sesi.peran)) throw new Error("FORBIDDEN");
  return sesi;
}
