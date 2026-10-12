"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icon";
import { Button, ButtonGroup } from "./Button";
import { Spinner } from "./Feedback";
import type { Paginated, PaginasiParams } from "@/lib/pagination";

export type Kolom<T> = {
  kunci: keyof T | string;
  judul: string;
  nilai?: (r: T) => string | number;
  sel?: (r: T) => React.ReactNode;
  lebar?: string;
  rata?: "kiri" | "tengah" | "kanan";
  bisaUrut?: boolean;
  nowrap?: boolean;
};

export type DataTableServerProps<T> = {
  kolom: Kolom<T>[];
  ambilData: (p: PaginasiParams) => Promise<Paginated<T>>;
  defaultLimit?: number;
  defaultSort?: string;
  defaultOrder?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | undefined>;
  placeholderCari?: string;
  kosong?: React.ReactNode;
  bisaPilih?: boolean;
  aksiBaris?: (r: T) => React.ReactNode;
  onBarisKlik?: (r: T) => void;
  debounceMs?: number;
};

export function DataTableServer<T extends Record<string, any>>({
  kolom,
  ambilData,
  defaultLimit = 10,
  defaultSort = "id",
  defaultOrder = "desc",
  filters = {},
  placeholderCari = "Cari...",
  kosong = "Tidak ada data.",
  aksiBaris,
  onBarisKlik,
  debounceMs = 350,
}: DataTableServerProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [data, setData] = useState<Paginated<T> | null>(null);
  const [cari, setCari] = useState(sp.get("q") ?? sp.get("search") ?? "");
  const [loading, start] = useTransition();

  const params = useMemo(() => {
    const p: PaginasiParams = {
      page: Number(sp.get("page") || 1),
      limit: Number(sp.get("limit") || defaultLimit),
      search: sp.get("q") ?? sp.get("search") ?? "",
      sort: sp.get("sort") ?? defaultSort,
      order: (sp.get("order") === "asc" ? "asc" : "desc") as "asc" | "desc",
    };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") (p as any)[k] = v;
    });
    return p;
  }, [sp, defaultLimit, defaultSort, defaultOrder, filters]);

  useEffect(() => {
    start(async () => {
      const res = await ambilData(params);
      setData(res);
    });
  }, [params, ambilData]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = new URLSearchParams(sp.toString());
      if (cari) q.set("q", cari); else q.delete("q");
      q.set("page", "1");
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [cari]);

  const ubahUrut = (k: string) => {
    const q = new URLSearchParams(sp.toString());
    const cur = q.get("sort") ?? defaultSort;
    const ord = q.get("order") === "asc" ? "desc" : "asc";
    q.set("sort", k);
    q.set("order", cur === k ? ord : "asc");
    q.set("page", "1");
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const gantiHal = (hal: number) => {
    const q = new URLSearchParams(sp.toString());
    q.set("page", String(hal));
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const gantiLimit = (lim: number) => {
    const q = new URLSearchParams(sp.toString());
    q.set("limit", String(lim));
    q.set("page", "1");
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  const pages = data?.pages ?? 1;
  const page = data?.page ?? 1;

  return (
    <>
      <div className="k-toolbar">
        <div className="k-input-wrap k-grow">
          <Icon name="search" size="sm" />
          <input className="k-input" placeholder={placeholderCari} value={cari} onChange={(e) => setCari(e.target.value)} />
        </div>
        <select className="k-select k-select-sm" value={params.limit} onChange={(e) => gantiLimit(Number(e.target.value))}>
          {[10, 25, 50, 100].map((x) => <option key={x} value={x}>{x}/hal</option>)}
        </select>
      </div>

      <div className="k-table-wrap k-table-cards">
        <table className="k-table">
          <thead>
            <tr>
              {kolom.map((k) => (
                <th key={String(k.kunci)} onClick={() => k.bisaUrut && ubahUrut(String(k.kunci))} style={{ cursor: k.bisaUrut ? "pointer" : "default", whiteSpace: "nowrap" }}>
                  {k.judul}
                </th>
              ))}
              {aksiBaris && <th>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr><td colSpan={kolom.length + (aksiBaris?1:0)}><div className="k-row" style={{justifyContent:"center",padding:24}}><Spinner /> Memuat...</div></td></tr>
            ) : data && data.data.length === 0 ? (
              <tr><td colSpan={kolom.length + (aksiBaris?1:0)} className="k-t-center k-t-muted" style={{padding:32}}>{kosong}</td></tr>
            ) : data ? (
              data.data.map((r, i) => (
                <tr key={i} onClick={() => onBarisKlik?.(r)} style={onBarisKlik?{cursor:"pointer"}:{}}>
                  {kolom.map((k) => (
                    <td key={String(k.kunci)} data-label={k.judul}>
                      {k.sel ? k.sel(r) : String(k.nilai ? k.nilai(r) : (r as any)[k.kunci] ?? "-")}
                    </td>
                  ))}
                  {aksiBaris && <td data-label="Aksi"><span className="k-row-actions">{aksiBaris(r)}</span></td>}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="k-between" style={{marginTop:12}}>
          <span className="k-t-sm k-t-muted">Hal {page} / {pages} · Total {data?.total??0}</span>
          <ButtonGroup>
            <Button jenis="ghost" ukuran="sm" disabled={page<=1} onClick={()=>gantiHal(page-1)}>Prev</Button>
            <Button jenis="ghost" ukuran="sm" disabled={page>=pages} onClick={()=>gantiHal(page+1)}>Next</Button>
          </ButtonGroup>
        </div>
      )}
    </>
  );
}
