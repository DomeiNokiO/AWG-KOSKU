import { NextResponse } from "next/server";
import { hapusSesi } from "@/lib/sesi";

/**
 * AWG-KOSKU — endpoint logout (POST).
 *
 * Kenapa Route Handler, bukan Server Action: Sidebar/Topbar memanggilnya
 * dengan `fetch()` biasa — fetch tidak bisa memanggil server action.
 *
 * Riwayat bug: direktori ini tadinya ada TANPA route.ts. Fetch 404, cookie
 * tidak pernah dihapus, pengguna klik "Ya, keluar" tapi tetap login
 * (logout terlihat sukses — dialog tertutup — tanpa ada error yang
 * terlihat). Kunci regresi: uji alur logout end-to-end via browser.
 *
 * Keamanan:
 *  - hapusSesi() hanya mengosongkan cookie sesi ini (maxAge 0);
 *  - respons identik (`{ok:true}`) untuk sesi valid maupun tidak —
 *    endpoint ini bukan oracle status sesi;
 *  - method GET tidak diekspor (logout harus POST, tidak bisa dipicu
 *    permintaan GET lintas konteks seperti <img src>).
 */
export async function POST(): Promise<NextResponse> {
  await hapusSesi();
  return NextResponse.json({ ok: true });
}
