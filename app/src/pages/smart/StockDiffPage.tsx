import { useState } from "react";
import { AlertOctagon, ClipboardCheck, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { money, num } from "@/lib/format";
import { trpc } from "@/providers/trpc";
import { ItemKindBadge } from "@/lib/itemKind";

type Row = Record<string, any>;

const TABS = [
  { key: "negatives", label: "负库存" },
  { key: "zeroSales", label: "零库存有销量" },
  { key: "checkDiff", label: "盘点差异" },
] as const;

/** 库存差异识别（原版没有的增值功能） */
export default function StockDiffPage() {
  const [tab, setTab] = useState<string>("negatives");
  const data = trpc.biz.stockDiff.useQuery(undefined, { staleTime: 5 * 60_000 });

  const negatives = data.data?.negatives;
  const zeroSales = data.data?.zeroSales;
  const checkDiff = data.data?.checkDiff as Row | null | undefined;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border bg-gradient-to-br from-slate-700 to-slate-900 p-4 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-black"><AlertOctagon className="h-5 w-5" />库存差异识别</h1>
            <p className="mt-1 text-xs text-slate-300">负库存、零库存有销量、账面与实盘差异三类异常自动识别，帮助定位账实不符。</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => data.refetch()} disabled={data.isFetching}>
            <RefreshCcw className={cn("h-4 w-4", data.isFetching && "animate-spin")} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="负库存" value={negatives?.count} />
          <Stat label="零库存有销量" value={zeroSales?.count} />
          <Stat label="盘点差异额" value={checkDiff ? money(checkDiff.diff_money) : undefined} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("rounded-xl py-2 text-[13px]", tab === t.key ? "bg-slate-800 font-bold text-white" : "text-slate-500")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 pb-4">
        {data.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}

        {!data.isLoading && tab === "negatives" && (
          <>
            {(negatives?.items?.length ?? 0) === 0 && <Empty text="没有负库存商品，账面正常" />}
            {negatives?.items?.map((row: Row, i: number) => (
              <div key={`${row.item_code}-${i}`} className="rounded-3xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-bold text-slate-900">{row.item_name}</span>
                      <ItemKindBadge item={row} />
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400">{row.item_code} · {row.storehouse_name ?? "-"}</div>
                  </div>
                  <Badge className="shrink-0 border-0 bg-rose-100 text-rose-700">{num(row.basic_quantity)}{row.basic_unit ?? ""}</Badge>
                </div>
                <div className="mt-1.5 text-[11px] text-slate-400">账面为负，必然存在漏盘/错单/未审核出入库，请优先核对最近单据。最近入库：{row.latest_in_date ?? "--"}</div>
              </div>
            ))}
          </>
        )}

        {!data.isLoading && tab === "zeroSales" && (
          <>
            {(zeroSales?.items?.length ?? 0) === 0 && <Empty text="没有零库存仍产生销量的商品" />}
            {zeroSales?.items?.map((row: Row, i: number) => {
              const it = row.item as Row;
              return (
                <div key={`${it.id}-${i}`} className="rounded-3xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-bold text-slate-900">{it.name}</span>
                        <ItemKindBadge item={it} />
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-400">{it.code} · 规格 {it.purchase_spec || "-"}</div>
                    </div>
                    <Badge className="shrink-0 border-0 bg-amber-100 text-amber-700">{num(row.stock_basic)}{it.unit ?? ""}</Badge>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">14日均销 {num(row.daily_sale_quantity)}{it.unit ?? ""} 但账面库存 ≤ 0：可能是负库存被归零显示，或存在未入账销售。</div>
                </div>
              );
            })}
          </>
        )}

        {!data.isLoading && tab === "checkDiff" && (
          <>
            {!checkDiff ? (
              <Empty text="最近没有已完成/已审核的盘点单" />
            ) : (
              <>
                <div className="rounded-3xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-slate-400" />
                    <span className="font-mono text-sm font-bold text-slate-900">{checkDiff.fid}</span>
                    <Badge variant="secondary" className="rounded-lg">{String(checkDiff.state) === "AUDIT" ? "已审核" : "已完成"}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {checkDiff.storehouse_name ?? "-"} · {String(checkDiff.operate_date ?? "").slice(0, 16)} · {checkDiff.create_by ?? "-"} · 差异金额 <span className="font-bold text-rose-600">{money(checkDiff.diff_money)}</span>
                  </div>
                </div>
                {((checkDiff.items as Row[]) ?? []).map((row: Row, i: number) => (
                  <div key={`${row.item_code}-${i}`} className="rounded-3xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[14px] font-bold text-slate-900">{row.item_name}</span>
                          <ItemKindBadge item={row} />
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-slate-400">{row.item_code}</div>
                      </div>
                      <Badge className={cn("shrink-0 border-0", Number(row.diff_quantity) < 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>
                        {Number(row.diff_quantity) > 0 ? "+" : ""}{num(row.diff_quantity)}{row.unit ?? ""}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <Cell label="账面" value={`${num(row.stock_quantity)}${row.unit ?? ""}`} />
                      <Cell label="实盘" value={`${num(row.quantity)}${row.unit ?? ""}`} />
                      <Cell label="差异额" value={money(row.diff_money)} strong />
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-1 py-2">
      <div className="text-[11px] text-slate-300">{label}</div>
      <div className="mt-0.5 truncate text-lg font-black text-white">{value ?? "-"}</div>
    </div>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-1 py-1.5">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={cn("mt-0.5 truncate text-[12px]", strong ? "font-black text-rose-600" : "font-medium text-slate-700")}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">{text}</div>;
}
