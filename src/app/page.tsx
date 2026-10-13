import { redirect } from "next/navigation";
import { sesiSekarang } from "@/lib/sesi";

/**
 * AWG-KOSKU — gerbang akar.
 * Author: AWGNET-RACING & AGENT AI TEAM
 *
 * "/" tidak punya halaman sendiri: ia hanya mengarahkan ke dashboard atau
 * halaman masuk. Dengan begitu tidak ada URL yang menampilkan kerangka kosong.
 */
export default async function Akar() {
  const sesi = await sesiSekarang();
  redirect(sesi ? "/dashboard" : "/masuk");
}
