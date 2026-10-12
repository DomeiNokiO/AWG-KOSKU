import "server-only";

/**
 * KOSKU-UI — pembatas laju sederhana (in-process).
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * Cakupan: SATU proses. Kalau aplikasi dijalankan di beberapa instance,
 * batas efektifnya menjadi N kali lipat — untuk itu pindahkan ke penyimpanan
 * bersama (Redis) saat skala menuntut. Untuk aplikasi ini (satu proses,
 * ratusan pengguna) pembatas in-process sudah memadai, dan tetap jauh lebih
 * baik daripada tidak ada sama sekali di endpoint login.
 *
 * Tujuannya menahan tebakan otomatis, bukan menahan serangan volumetrik —
 * itu tugas lapisan tepi (proxy/WAF).
 */

type Catatan = { jumlah: number; sampai: number };

const peta = new Map<string, Catatan>();
const MAKS_ENTRI = 5000;

function bersihkan(now: number) {
  if (peta.size < MAKS_ENTRI) return;
  for (const [k, v] of peta) if (v.sampai < now) peta.delete(k);
}

export function rateLimit(
  kunci: string,
  maks = 10,
  jendelaMs = 60_000,
): { diizinkan: boolean; sisa: number; sisaDetik: number } {
  const now = Date.now();
  bersihkan(now);

  const lama = peta.get(kunci);
  if (!lama || lama.sampai < now) {
    peta.set(kunci, { jumlah: 1, sampai: now + jendelaMs });
    return { diizinkan: true, sisa: maks - 1, sisaDetik: Math.ceil(jendelaMs / 1000) };
  }

  lama.jumlah += 1;
  if (lama.jumlah > maks) {
    return { diizinkan: false, sisa: 0, sisaDetik: Math.max(1, Math.ceil((lama.sampai - now) / 1000)) };
  }
  return { diizinkan: true, sisa: maks - lama.jumlah, sisaDetik: Math.max(1, Math.ceil((lama.sampai - now) / 1000)) };
}

/** Dipakai setelah login sukses supaya pengguna sah tidak langsung terkunci. */
export function resetRateLimit(kunci: string) {
  peta.delete(kunci);
}
