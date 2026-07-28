import { useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, PackagePlus, RefreshCcw, ShoppingCart, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCart, type CatalogItem } from "@/lib/cart";
import { ItemKindBadge } from "@/lib/itemKind";
import { trpc } from "@/providers/trpc";

type Suggestion = {
  item: CatalogItem;
  daily_sale_quantity: number;
  stock_basic: number;
  on_way_basic: number;
  available_days: number;
  out_of_stock?: boolean;
  safety_basic?: number;
  suggest_quantity: number;
  suggest_basic_quantity?: number;
  volume_m3?: number;
  urgency: "urgent" | "low" | "normal";
};

type AbnormalRow = {
  item: CatalogItem;
  stock_basic: number;
  daily_sale_quantity: number;
  available_days: number | null;
};

const URGENCY = {
  urgent: { label: "紧急", cls: "bg-rose-100 text-rose-700" },
  low: { label: "偏低", cls: "bg-amber-100 text-amber-700" },
  normal: { label: "建议", cls: "bg-blue-100 text-blue-700" },
} as const;

/** 智能补货建议（原版没有的功能） */
export default function ReplenishmentPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [tab, setTab] = useState<"suggest" | "negative" | "overstock">("suggest");
  const [filter, setFilter] = useState<"all" | "urgent" | "low" | "normal">("all");
  const [confirmBulk, setConfirmBulk] = useState(false);
  // 来货周期 / 安全体积（库存体积低于该值则补货）——均可调整
  const [cycleDays, setCycleDays] = useState(2);
  const [safetyVol, setSafetyVol] = useState(0.012);
  const data = trpc.biz.replenishment.useQuery(
    { cycleDays, safetyVolumeM3: safetyVol, urgentDays: 7, overstockDays: 60 },
    { staleTime: 5 * 60_000, placeholderData: (prev) => prev },
  );

  const items = (data.data?.items ?? []) as Suggestion[];
  const negatives = (data.data?.negatives ?? []) as AbnormalRow[];
  const overstocks = (data.data?.overstocks ?? []) as AbnormalRow[];
  const shown = filter === "all" ? items : items.filter((s) => s.urgency === filter);

  function addAll(list: Suggestion[]) {
    for (const s of list) cart.add(s.item, s.suggest_quantity);
    toast.success(`已将 ${list.length} 个建议商品加入采购车`);
    navigate("/m/order/cart");
  }

  return (
    <div className="space-y-3">
      {/* 头部说明 */}
      <div className="rounded-3xl border bg-gradient-to-br from-blue-600 to-sky-500 p-4 text-white shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-black">智能补货建议</h1>
            <p className="mt-1 text-xs text-blue-100">
              补货量 = 来货周期销量 + 安全库存 − 库存 − 在途；安全库存按商品实际体积折算，库存体积低于安全体积即触发补货。负库存记为账面异常，可售超 60 天记为积压。
              {data.data?.makebillSkipped ? `另有 ${data.data.makebillSkipped} 个制单组合商品（组合口径）未参与。` : ""}
            </p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => data.refetch()} disabled={data.isFetching}>
            <RefreshCcw className={cn("h-4 w-4", data.isFetching && "animate-spin")} />
          </Button>
        </div>
        {/* 参数设置 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span className="text-blue-100">来货周期</span>
            {[1, 2, 3, 7].map((d) => (
              <button key={d} onClick={() => setCycleDays(d)} className={cn("rounded-lg px-2 py-1", cycleDays === d ? "bg-white font-bold text-blue-700" : "bg-white/15 text-blue-100")}>
                {d}天
              </button>
            ))}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-blue-100">安全体积</span>
            {[0.006, 0.012, 0.024].map((v) => (
              <button key={v} onClick={() => setSafetyVol(v)} className={cn("rounded-lg px-2 py-1", safetyVol === v ? "bg-white font-bold text-blue-700" : "bg-white/15 text-blue-100")}>
                {v}m³
              </button>
            ))}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <StatCard label="建议补货" value={data.data?.total} />
          <StatCard label="紧急" value={data.data?.urgent} accent="text-rose-200" />
          <StatCard label="负库存异常" value={data.data?.negativeCount} accent="text-rose-200" />
          <StatCard label="库存积压" value={data.data?.overstockCount} accent="text-amber-200" />
        </div>
      </div>

      {/* 主 Tab：建议 / 负库存异常 / 库存积压 */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {([["suggest", `建议 ${data.data?.total ?? "-"}`], ["negative", `负库存 ${data.data?.negativeCount ?? "-"}`], ["overstock", `积压 ${data.data?.overstockCount ?? "-"}`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("rounded-xl py-2 text-[13px]", tab === k ? "bg-blue-600 font-semibold text-white" : "text-slate-500")}>
            {label}
          </button>
        ))}
      </div>

      {/* 筛选 + 一键加购（仅建议 Tab） */}
      {tab === "suggest" && (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1 rounded-2xl bg-white p-1 shadow-sm">
            {([["all", "全部"], ["urgent", "紧急"], ["low", "偏低"], ["normal", "建议"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)} className={cn("flex-1 rounded-xl py-2 text-[13px]", filter === k ? "bg-blue-600 font-semibold text-white" : "text-slate-500")}>
                {label}
              </button>
            ))}
          </div>
          <Button className="h-11 rounded-2xl bg-blue-600 px-3 hover:bg-blue-700" disabled={shown.length === 0} onClick={() => setConfirmBulk(true)}>
            <PackagePlus className="mr-1 h-4 w-4" />一键加购
          </Button>
        </div>
      )}

      {/* 负库存异常 / 库存积压列表 */}
      {tab !== "suggest" && (
        <div className="space-y-2 pb-4">
          {data.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
          {!data.isLoading && (tab === "negative" ? negatives : overstocks).length === 0 && (
            <div className="rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">
              {tab === "negative" ? "没有负库存商品，账面正常" : "没有积压商品，库存周转健康"}
            </div>
          )}
          {(tab === "negative" ? negatives : overstocks).map((row, i) => (
            <AbnormalCard key={`${row.item.id}-${i}`} row={row} kind={tab} onGoDiff={() => navigate("/m/smart/stockdiff")} />
          ))}
        </div>
      )}

      {/* 建议列表 */}
      {tab === "suggest" && (
      <div className="space-y-2 pb-4">
        {data.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        {!data.isLoading && shown.length === 0 && (
          <div className="rounded-3xl border bg-white px-4 py-14 text-center">
            <TrendingDown className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm text-slate-500">库存健康，当前没有需要补货的商品</p>
          </div>
        )}
        {shown.map((s) => {
          const u = URGENCY[s.urgency];
          const inCart = cart.lines.find((l) => l.item.id === s.item.id);
          return (
            <div key={s.item.id} className="rounded-3xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("border-0 text-[10px]", u.cls)}>{u.label}</Badge>
                    <ItemKindBadge item={s.item} />
                    <span className="truncate text-[14px] font-bold text-slate-900">{s.item.name}</span>
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-400">{s.item.code} · 规格 {s.item.purchase_spec || "-"}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] text-slate-400">可售</div>
                  {s.out_of_stock ? (
                    <div className="text-[16px] font-black leading-tight text-rose-600">断货</div>
                  ) : (
                    <div className={cn("text-[18px] font-black leading-tight", s.urgency === "urgent" ? "text-rose-600" : s.urgency === "low" ? "text-amber-600" : "text-blue-600")}>
                      {s.available_days}<span className="text-[11px] font-normal">天</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                <MiniCell label="14日均销" value={`${fmt(s.daily_sale_quantity)}${s.item.unit ?? ""}`} />
                <MiniCell label="库存" value={`${fmt(s.stock_basic)}${s.item.unit ?? ""}`} />
                <MiniCell label="在途" value={`${fmt(s.on_way_basic)}${s.item.unit ?? ""}`} />
                <MiniCell
                  label={`建议订货(${s.item.delivery_unit || s.item.unit || "个"})`}
                  value={`${s.suggest_quantity}${s.suggest_basic_quantity != null && (s.item.delivery_ratio ?? 1) > 1 ? `≈${fmt(s.suggest_basic_quantity)}${s.item.unit ?? ""}` : ""}`}
                  strong
                />
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                安全库存 ≈ {fmt(s.safety_basic ?? 0)}{s.item.unit ?? ""}（按 {data.data?.safetyVolumeM3 ?? 0.012}m³ 体积折算）{s.volume_m3 ? ` · 本次建议体积 ${s.volume_m3}m³` : ""}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[12px] text-slate-500">
                  单价 ¥{cart.unitPrice(s.item).toFixed(2)}/{s.item.delivery_unit || s.item.unit}
                </span>
                <Button
                  size="sm"
                  variant={inCart ? "secondary" : "default"}
                  className={cn("h-9 rounded-xl", !inCart && "bg-blue-600 hover:bg-blue-700")}
                  onClick={() => (inCart ? navigate("/m/order/cart") : cart.add(s.item, s.suggest_quantity))}
                >
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  {inCart ? `已加 ${inCart.quantity}` : "加采购车"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500" />一键加入采购车？</AlertDialogTitle>
            <AlertDialogDescription>
              将把当前列表 {shown.length} 个商品按建议量加入采购车（已有商品会累加数量）。加入后可在采购车中调整、保存或审核，<span className="font-semibold text-rose-600">提交前才会写入真实系统</span>。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => { setConfirmBulk(false); addAll(shown.slice(0, 50)); }}>
              加入（最多50种）
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AbnormalCard({ row, kind, onGoDiff }: { row: AbnormalRow; kind: "negative" | "overstock"; onGoDiff: () => void }) {
  const isNeg = kind === "negative";
  return (
    <div className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Badge className={cn("border-0 text-[10px]", isNeg ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
              {isNeg ? "账面异常" : "积压"}
            </Badge>
            <ItemKindBadge item={row.item} />
            <span className="truncate text-[14px] font-bold text-slate-900">{row.item.name}</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-400">{row.item.code} · 规格 {row.item.purchase_spec || "-"}</div>
        </div>
        <Badge className={cn("shrink-0 border-0 text-[13px]", isNeg ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700")}>
          {fmt(row.stock_basic)}{row.item.unit ?? ""}
        </Badge>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] leading-4 text-slate-400">
          {isNeg
            ? "账面库存为负，属于账实异常，不按账面补货——请先盘点/核对最近出入库单据。"
            : row.available_days != null
              ? `按 14 日均销 ${fmt(row.daily_sale_quantity)}${row.item.unit ?? ""} 估算可售约 ${row.available_days} 天，建议促销/调拨消化，暂缓补货。`
              : "近 14 天无销量且仍有库存，属于滞销积压，建议促销清仓。"}
        </p>
        {isNeg && (
          <Button size="sm" variant="outline" className="ml-2 h-8 shrink-0 rounded-lg text-[12px]" onClick={onGoDiff}>
            去核对
          </Button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value?: number; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-1 py-2">
      <div className="text-[11px] text-blue-100">{label}</div>
      <div className={cn("mt-0.5 text-lg font-black", accent ?? "text-white")}>{value ?? "-"}</div>
    </div>
  );
}

function MiniCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-1 py-1.5">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div className={cn("mt-0.5 truncate text-[12px]", strong ? "font-black text-blue-700" : "font-medium text-slate-700")}>{value}</div>
    </div>
  );
}

function fmt(n: number) {
  return n % 1 === 0 ? String(n) : String(Math.round(n * 10) / 10);
}
