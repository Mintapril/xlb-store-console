import { useState } from "react";
import { Clock3, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { money, num } from "@/lib/format";
import { trpc } from "@/providers/trpc";

type Bucket = { count: number; value: number; items: Row[] };
type Row = Record<string, any>;

const BUCKETS = [
  { key: "expired", label: "已过期", cls: "bg-rose-600", chip: "bg-rose-100 text-rose-700" },
  { key: "d7", label: "7天内", cls: "bg-rose-400", chip: "bg-rose-50 text-rose-600" },
  { key: "d30", label: "30天内", cls: "bg-amber-400", chip: "bg-amber-50 text-amber-700" },
  { key: "d90", label: "90天内", cls: "bg-sky-400", chip: "bg-sky-50 text-sky-700" },
] as const;

/** 效期预警（原版没有的功能） */
export default function ExpiryPage() {
  const [active, setActive] = useState<string>("expired");
  const data = trpc.biz.expiryAlerts.useQuery(undefined, { staleTime: 5 * 60_000 });

  const buckets = (data.data ?? {}) as Record<string, Bucket>;
  const current = buckets[active];
  const totalValue = BUCKETS.reduce((acc, b) => acc + (buckets[b.key]?.value ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* 头部 */}
      <div className="rounded-3xl border bg-gradient-to-br from-rose-500 to-orange-400 p-4 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-black">效期预警</h1>
            <p className="mt-1 text-xs text-rose-100">批次库存按到期日自动分桶，零售口径估算损失敞口，越早处理损失越小。</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => data.refetch()} disabled={data.isFetching}>
            <RefreshCcw className={cn("h-4 w-4", data.isFetching && "animate-spin")} />
          </Button>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] text-rose-100">90天内总敞口（零售价）</div>
            <div className="text-2xl font-black">{money(totalValue)}</div>
          </div>
          <Clock3 className="h-8 w-8 text-white/50" />
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/25">
          {BUCKETS.map((b) => {
            const v = buckets[b.key]?.value ?? 0;
            const pct = totalValue > 0 ? (v / totalValue) * 100 : 0;
            return pct > 0 ? <div key={b.key} className={b.cls} style={{ width: `${pct}%` }} /> : null;
          })}
        </div>
      </div>

      {/* 分桶 Tab */}
      <div className="grid grid-cols-4 gap-2">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            onClick={() => setActive(b.key)}
            className={cn("rounded-2xl border bg-white p-2.5 text-center shadow-sm", active === b.key && "ring-2 ring-blue-500")}
          >
            <Badge className={cn("mb-1 border-0 text-[10px]", b.chip)}>{b.label}</Badge>
            <div className="text-lg font-black text-slate-900">{buckets[b.key]?.count ?? "-"}</div>
            <div className="text-[10px] text-slate-400">{money(buckets[b.key]?.value ?? 0)}</div>
          </button>
        ))}
      </div>

      {/* 明细 */}
      <div className="space-y-2 pb-4">
        {data.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
        {!data.isLoading && (current?.items?.length ?? 0) === 0 && (
          <div className="rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">该区间没有临期/过期商品</div>
        )}
        {current?.items?.map((row, i) => (
          <div key={`${row.item_code}-${row.batch_number}-${i}`} className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-bold text-slate-900">{row.item_name}</div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                  {row.item_code}
                  {row.batch_number ? ` · 批次 ${row.batch_number}` : ""}
                </div>
              </div>
              <Badge className={cn("shrink-0 border-0", row.days_left < 0 ? "bg-rose-600 text-white" : row.days_left <= 7 ? "bg-rose-100 text-rose-700" : row.days_left <= 30 ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700")}>
                {row.days_left < 0 ? `已过期 ${-row.days_left} 天` : `剩 ${row.days_left} 天`}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
              <Cell label="数量" value={`${num(row.basic_quantity)}${row.basic_unit ?? ""}`} />
              <Cell label="生产日期" value={row.producing_date ?? "--"} />
              <Cell label="到期日" value={row.expire_date ?? "--"} />
              <Cell label="敞口" value={money(row.value)} strong />
            </div>
          </div>
        ))}
      </div>
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
