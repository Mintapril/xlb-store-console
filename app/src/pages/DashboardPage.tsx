import { ChevronRight, Clock3, ClipboardList, PackageCheck, PackageOpen, RefreshCcw, ScrollText, TrendingDown, Truck } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { money, stateLabel, stateTone } from "@/lib/format";
import { trpc } from "@/providers/trpc";

const cards = [
  { key: "requestOrder", label: "要货单", path: "/m/doc/requestOrder", icon: ClipboardList, accent: "from-sky-500 to-blue-600" },
  { key: "storeOrder", label: "门店订单", path: "/m/order/list", icon: ScrollText, accent: "from-emerald-500 to-teal-600" },
  { key: "deliveryOut", label: "配送出库", path: "/m/doc/deliveryOut", icon: Truck, accent: "from-violet-500 to-indigo-600" },
  { key: "receiveOrder", label: "门店收货", path: "/m/doc/receiveOrder", icon: PackageCheck, accent: "from-amber-500 to-orange-600" },
  { key: "stockCount", label: "盘点单", path: "/m/doc/stockCount", icon: PackageOpen, accent: "from-slate-500 to-slate-700" },
] as const;

export default function DashboardPage() {
  const navigate = useNavigate();
  const dash = trpc.biz.dashboard.useQuery(undefined, { refetchInterval: 60_000 });
  const repl = trpc.biz.replenishment.useQuery({ cycleDays: 2, safetyVolumeM3: 0.012, urgentDays: 7, overstockDays: 60 }, { staleTime: 5 * 60_000 });
  const expiry = trpc.biz.expiryAlerts.useQuery(undefined, { staleTime: 5 * 60_000 });

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="flex items-center justify-between rounded-3xl border bg-white p-4 shadow-sm md:p-5">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">经营看板</h1>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">近 50 条单据实时汇总 · 每分钟自动刷新</p>
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => dash.refetch()} disabled={dash.isFetching} aria-label="刷新">
          <RefreshCcw className={`h-4 w-4 ${dash.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 指标卡 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5 md:gap-3">
        {cards.map((card) => {
          const t = dash.data?.totals?.[card.key as keyof NonNullable<typeof dash.data>["totals"]];
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              onClick={() => navigate(card.path)}
              className="group rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:bg-blue-50/40"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${card.accent}`}>
                  <Icon className="h-4 w-4" />
                </span>
                {t && t.pending > 0 && <Badge className="rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-100">待审 {t.pending}</Badge>}
              </div>
              <div className="mt-3 text-xs text-slate-400">{card.label}（累计）</div>
              {dash.isLoading ? (
                <Skeleton className="mt-1 h-7 w-20 rounded-lg" />
              ) : (
                <>
                  <div className="mt-0.5 text-xl font-black text-slate-950">{(t?.count ?? 0).toLocaleString()}</div>
                  <div className="mt-1 text-xs text-slate-500">近50条金额 {money(t?.money ?? 0)}</div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* 智能助手（原版没有的增值功能） */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <button onClick={() => navigate("/m/smart/replenishment")} className="rounded-3xl border bg-gradient-to-br from-blue-600 to-sky-500 p-4 text-left text-white shadow-sm active:opacity-90">
          <div className="flex items-center justify-between">
            <TrendingDown className="h-5 w-5" />
            <ChevronRight className="h-4 w-4 text-white/70" />
          </div>
          <div className="mt-2 text-sm font-bold">智能补货建议</div>
          <div className="mt-0.5 text-[11px] text-blue-100">
            {repl.data ? <>紧急 {repl.data.urgent} · 偏低 {repl.data.low} · 共 {repl.data.total} 条建议</> : "按销量与库存自动计算"}
          </div>
        </button>
        <button onClick={() => navigate("/m/smart/expiry")} className="rounded-3xl border bg-gradient-to-br from-rose-500 to-orange-400 p-4 text-left text-white shadow-sm active:opacity-90">
          <div className="flex items-center justify-between">
            <Clock3 className="h-5 w-5" />
            <ChevronRight className="h-4 w-4 text-white/70" />
          </div>
          <div className="mt-2 text-sm font-bold">效期预警</div>
          <div className="mt-0.5 text-[11px] text-rose-100">
            {expiry.data ? <>已过期 {expiry.data.expired?.count ?? 0} · 7天 {expiry.data.d7?.count ?? 0} · 30天 {expiry.data.d30?.count ?? 0}</> : "批次临期自动分桶"}
          </div>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {/* 待办 */}
        <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 md:text-base">待审核单据</h2>
            <Badge variant="secondary" className="rounded-lg">{dash.data?.todos?.length ?? 0}</Badge>
          </div>
          <div className="space-y-2">
            {dash.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
            {!dash.isLoading && (dash.data?.todos?.length ?? 0) === 0 && (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">暂无待审核单据</div>
            )}
            {dash.data?.todos?.map((todo) => (
              <button
                key={`${todo.entity}-${todo.fid}`}
                onClick={() => navigate(todo.entity === "storeOrder" ? "/m/order/list" : `/m/doc/${todo.entity}`)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-slate-50/60 px-3 py-2.5 text-left active:bg-blue-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm font-semibold text-slate-800">{todo.fid}</span>
                  <span className="block text-xs text-slate-400">{todo.entityLabel} · {todo.createBy} · {todo.createTime.slice(5, 16)}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-slate-900">{money(todo.money)}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${stateTone(todo.state)}`}>{stateLabel(todo.state)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 最新动态 */}
        <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 md:text-base">最新单据</h2>
            <Badge variant="secondary" className="rounded-lg">实时</Badge>
          </div>
          <div className="space-y-2">
            {dash.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
            {dash.data?.recent?.map((item) => (
              <button
                key={`${item.entity}-${item.fid}`}
                onClick={() => navigate(item.entity === "storeOrder" ? "/m/order/list" : `/m/doc/${item.entity}`)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-left ring-1 ring-slate-100 active:bg-blue-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm font-semibold text-slate-800">{item.fid}</span>
                  <span className="block text-xs text-slate-400">{item.entityLabel} · {item.itemCount} 项 · {item.createTime.slice(5, 16)}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-slate-900">{money(item.money)}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${stateTone(item.state)}`}>{stateLabel(item.state)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
