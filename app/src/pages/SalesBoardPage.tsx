import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, ChevronRight, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { money, num } from "@/lib/format";
import { trpc } from "@/providers/trpc";
import { ItemKindBadge } from "@/lib/itemKind";

type Range = { key: string; label: string; from: string; to: string; cmpFrom: string; cmpTo: string };

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function makeRanges(): Range[] {
  const today = new Date();
  const t = ymd(today);
  const y = ymd(new Date(today.getTime() - 86400000));
  const d7 = ymd(new Date(today.getTime() - 6 * 86400000));
  const d7p = ymd(new Date(today.getTime() - 13 * 86400000));
  const d8 = ymd(new Date(today.getTime() - 7 * 86400000));
  const d30 = ymd(new Date(today.getTime() - 29 * 86400000));
  const d30p = ymd(new Date(today.getTime() - 59 * 86400000));
  const d31 = ymd(new Date(today.getTime() - 30 * 86400000));
  return [
    { key: "today", label: "今天", from: t, to: t, cmpFrom: y, cmpTo: y },
    { key: "yesterday", label: "昨天", from: y, to: y, cmpFrom: ymd(new Date(today.getTime() - 2 * 86400000)), cmpTo: ymd(new Date(today.getTime() - 2 * 86400000)) },
    { key: "7d", label: "近7天", from: d7, to: t, cmpFrom: d7p, cmpTo: d8 },
    { key: "30d", label: "近30天", from: d30, to: t, cmpFrom: d30p, cmpTo: d31 },
  ];
}

/** 销售看板（BI 首页数据 + 日趋势 + 畅销榜） */
export default function SalesBoardPage() {
  const navigate = useNavigate();
  const ranges = useMemo(makeRanges, []);
  const [range, setRange] = useState<Range>(ranges[0]);

  const board = trpc.biz.salesBoard.useQuery(
    { dateFrom: range.from, dateTo: range.to, compareFrom: range.cmpFrom, compareTo: range.cmpTo },
    { placeholderData: (prev) => prev },
  );
  const trend = trpc.biz.salesTrend.useQuery({ days: 7 });
  const topItems = trpc.biz.catalog.useQuery({ sort: "sale", page: 1, pageSize: 10 }, { staleTime: 5 * 60_000 });

  const cards = (board.data?.cards ?? []) as Record<string, any>[];
  const members = (board.data?.members ?? []) as Record<string, any>[];
  const payments = (board.data?.payments ?? []) as Record<string, any>[];
  const trendData = (trend.data ?? []) as Record<string, any>[];
  const maxSales = Math.max(1, ...trendData.map((d) => Number(d.sales) || 0));

  const pick = (list: Record<string, any>[], name: string) => list.find((c) => c.name === name);
  const sales = pick(cards, "销售额");
  const gross = pick(cards, "毛利");
  const grossRate = pick(cards, "毛利率");
  const orders = pick(cards, "客单量");
  const avg = pick(cards, "客单价");
  const memberSales = pick(members, "会员销售额");
  const salesValue = Number(sales?.comparator_value ?? NaN);
  const memberValue = Number(memberSales?.comparator_value ?? NaN);
  const memberRatio = Number.isFinite(salesValue) && salesValue > 0 && Number.isFinite(memberValue) ? (memberValue / salesValue) * 100 : null;

  return (
    <div className="space-y-3">
      {/* 头部 + 时间选择 */}
      <div className="rounded-3xl border bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-950">销售看板</h1>
              <Badge variant="secondary" className="rounded-lg">真实数据</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">{range.from} ~ {range.to}（环比 {range.cmpFrom} ~ {range.cmpTo}）· 无权限字段显示为 ****</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => { board.refetch(); trend.refetch(); }} disabled={board.isFetching}>
            <RefreshCcw className={cn("h-4 w-4", board.isFetching && "animate-spin")} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
          {ranges.map((r) => (
            <button key={r.key} onClick={() => setRange(r)} className={cn("rounded-xl py-2 text-[13px]", range.key === r.key ? "bg-white font-bold text-blue-700 shadow-sm" : "text-slate-500")}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi title="销售额" value={sales?.comparator_value ?? sales?.value} compare={sales?.last_week_comparison} strong />
        <Kpi title="毛利" value={gross?.comparator_value ?? gross?.value} compare={gross?.last_week_comparison} />
        <Kpi title="毛利率" value={grossRate?.comparator_value != null ? `${grossRate.comparator_value}%` : grossRate?.value} compare={grossRate?.last_week_comparison} />
        <Kpi title="客单量" value={orders?.comparator_value ?? orders?.value} compare={orders?.last_week_comparison} raw />
        <Kpi title="客单价" value={avg?.comparator_value != null ? `¥${Number(avg.comparator_value).toFixed(2)}` : avg?.value} sub="销售额/客单量" />
        <Kpi title="会员销售额" value={memberSales?.comparator_value ?? memberSales?.value} compare={memberSales?.last_week_comparison} />
        <Kpi title="会员销售占比" value={memberRatio != null ? `${memberRatio.toFixed(1)}%` : "--"} sub="按可见值计算" />
      </div>

      {/* 日趋势 */}
      <section className="rounded-3xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900"><BarChart3 className="h-4 w-4 text-blue-600" />近7天销售趋势</h2>
        </div>
        {trend.isLoading ? (
          <Skeleton className="h-36 rounded-2xl" />
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {trendData.map((d) => {
              const v = Number(d.sales) || 0;
              const h = Math.max(3, Math.round((v / maxSales) * 88));
              const masked = d.sales == null && d.salesMask === "****";
              return (
                <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] font-semibold text-slate-600">{masked ? "****" : v > 0 ? shortMoney(v) : "-"}</span>
                  <div className={cn("w-full rounded-t-md", v > 0 ? "bg-gradient-to-t from-blue-600 to-sky-400" : "bg-slate-100")} style={{ height: `${h}px` }} />
                  <span className="text-[10px] text-slate-400">{d.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {/* 支付方式 */}
        <section className="rounded-3xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-900">支付方式构成</h2>
          {board.isLoading ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : payments.length === 0 || (payments.length === 1 && !payments[0].name) ? (
            <div className="rounded-2xl border border-dashed p-5 text-center text-xs text-slate-400">当前账号暂无支付方式明细权限</div>
          ) : (
            <div className="space-y-2">
              {payments.filter((p) => p.name).map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">{p.name}</span>
                  <span className="font-semibold text-slate-900">{p.value} <span className="ml-1 text-xs font-normal text-slate-400">{p.rate}</span></span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 畅销 TOP10（14日均销） */}
        <section className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">畅销 TOP10（14日均销）</h2>
            <button onClick={() => navigate("/m/order/catalog")} className="flex items-center text-xs text-blue-600">去订货 <ChevronRight className="h-3 w-3" /></button>
          </div>
          <div className="space-y-1.5">
            {topItems.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            {((topItems.data?.items ?? []) as Record<string, any>[]).map((it, i) => (
              <div key={it.id} className="flex items-center gap-2 rounded-xl bg-slate-50/70 px-2.5 py-2">
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", i < 3 ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500")}>{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{it.name}</span>
                <ItemKindBadge item={it} />
                <span className="shrink-0 text-[12px] font-bold text-blue-700">{num(it.daily_sale_quantity)}{it.unit ?? ""}/日</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ title, value, compare, strong, raw, sub }: { title: string; value?: unknown; compare?: unknown; strong?: boolean; raw?: boolean; sub?: string }) {
  const display = value === undefined || value === null || value === "" ? "--" : raw ? num(value) : typeof value === "string" ? value : money(value);
  const cmp = compare !== undefined && compare !== null && compare !== "" ? (typeof compare === "string" ? compare : raw ? num(compare) : money(compare)) : null;
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-400">{title}</div>
      <div className={cn("mt-1 truncate text-[19px] text-slate-950", strong ? "font-black" : "font-bold")}>{display}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{sub ?? (cmp ? `环比 ${cmp}` : " ")}</div>
    </div>
  );
}

function shortMoney(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`;
  return v.toFixed(0);
}
