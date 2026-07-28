import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, ChevronLeft, ChevronRight, PencilLine, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { money, num, stateLabel, stateTone } from "@/lib/format";
import { trpc } from "@/providers/trpc";
import { useCart, type CatalogItem } from "@/lib/cart";

const TABS = [
  { key: "全部", label: "全部" },
  { key: "INIT", label: "制单" },
  { key: "PAID", label: "待支付" },
  { key: "AUDIT", label: "审核" },
  { key: "INVALID", label: "作废" },
] as const;

type Row = Record<string, any>;

export default function OrderListPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const utils = trpc.useUtils();
  // 门店订单看单页默认只显示制单中
  const [tab, setTab] = useState<string>("INIT");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFid, setSelectedFid] = useState<string>();
  const [pendingAction, setPendingAction] = useState<{ action: "audit" | "invalid" | "delete"; fid: string } | null>(null);
  const [actionMemo, setActionMemo] = useState("");
  const [confirmOrder, setConfirmOrder] = useState<Row | null>(null);
  const [receiveMap, setReceiveMap] = useState<Record<number, number>>({});

  const list = trpc.biz.docList.useQuery(
    { entity: "storeOrder", state: tab, keyword, page, pageSize: 10 },
    { placeholderData: (prev) => prev },
  );
  const detail = trpc.biz.docDetail.useQuery(
    { entity: "storeOrder", fid: selectedFid! },
    { enabled: Boolean(selectedFid) },
  );
  const action = trpc.biz.docAction.useMutation({
    onSuccess: async () => {
      toast.success("操作已在真实业务系统生效");
      setPendingAction(null);
      setSelectedFid(undefined);
      await Promise.all([utils.biz.docList.invalidate(), utils.biz.docDetail.invalidate(), utils.biz.dashboard.invalidate()]);
    },
    onError: (e) => toast.error("操作失败", { description: e.message }),
  });
  const confirm = trpc.biz.confirmStoreOrder.useMutation({
    onSuccess: async () => {
      toast.success("确认实收成功");
      setConfirmOrder(null);
      await Promise.all([utils.biz.docList.invalidate(), utils.biz.docDetail.invalidate(), utils.biz.dashboard.invalidate()]);
    },
    onError: (e) => toast.error("确认实收失败", { description: e.message }),
  });

  const rows: Row[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 0;
  const pageMoney = rows.reduce((acc, r) => acc + (Number(r.money) || 0), 0);

  function loadToCart(order: Row) {
    const lines = (order.details ?? []) as Row[];
    cart.clear();
    for (const d of lines) {
      const item: CatalogItem = {
        id: Number(d.item_id),
        code: String(d.item_code ?? ""),
        bar_code: d.item_bar_code ?? "",
        name: String(d.item_name ?? ""),
        unit: d.basic_unit ?? d.unit ?? "个",
        delivery_unit: d.unit ?? "个",
        delivery_ratio: Number(d.ratio) || 1,
        basic_price: Number(d.basic_price) || 0,
        purchase_spec: d.purchase_spec ?? "",
        default_image_url: Array.isArray(d.image_urls) ? d.image_urls[0] : undefined,
      };
      cart.add(item, Number(d.quantity) || 1);
    }
    if (order.memo) cart.setMemo(String(order.memo));
  }

  function editInCart(order: Row) {
    loadToCart(order);
    setSelectedFid(undefined);
    navigate(`/m/order/cart?fid=${order.fid}`);
  }

  /** 点击单据卡片：制单直接进入点货（采购车编辑）页，其他状态看详情 */
  async function openOrder(row: Row) {
    if (row.state === "INIT") {
      const order = await utils.biz.docDetail.fetch({ entity: "storeOrder", fid: String(row.fid) });
      loadToCart(order as Row);
      navigate(`/m/order/cart?fid=${row.fid}`);
      return;
    }
    setSelectedFid(String(row.fid));
  }

  const ACTION_LABEL: Record<string, string> = { audit: "审核", invalid: "作废", delete: "删除" };

  /** 打开确认实收弹窗：预填实收=已配送 ?? 订货数量 */
  function openConfirm(order: Row) {
    const map: Record<number, number> = {};
    for (const d of (order.details ?? []) as Row[]) {
      map[Number(d.item_id)] = Number(d.receive_quantity ?? d.delivery_quantity ?? d.quantity ?? 0);
    }
    setReceiveMap(map);
    setConfirmOrder(order);
  }

  return (
    <div className="-mx-3 -mt-3 flex min-h-[calc(100vh-56px-64px)] flex-col md:-mx-4 md:-mt-4 lg:-mx-6 lg:-mt-6">
      {/* 搜索 + Tab */}
      <div className="sticky top-14 z-30 border-b bg-white/95 backdrop-blur">
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder="搜索完整单号（DD…）"
              className="h-10 rounded-xl bg-slate-100 pl-9"
            />
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 px-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={cn(
                "relative px-3 py-2.5 text-[14px]",
                tab === t.key ? "font-bold text-blue-700" : "text-slate-500",
              )}
            >
              {t.label}
              {tab === t.key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />}
            </button>
          ))}
          <span className="ml-auto pb-1 text-xs text-slate-400">{total.toLocaleString()} 单</span>
        </div>
      </div>

      {/* 订单卡片 */}
      <div className="flex-1 space-y-2 p-3 pb-24">
        {list.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        {!list.isLoading && rows.length === 0 && (
          <div className="rounded-2xl border bg-white px-4 py-16 text-center text-sm text-slate-400">暂无{tab === "全部" ? "" : TABS.find((t) => t.key === tab)?.label}订单</div>
        )}
        {rows.map((row) => (
          <button key={row.fid} onClick={() => openOrder(row)} className="w-full rounded-2xl border bg-white p-4 text-left shadow-sm active:bg-blue-50/40">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[16px] font-bold text-slate-950">{row.fid}</span>
              <span className="flex shrink-0 gap-1">
                <Badge variant="outline" className="border-blue-200 text-[10px] font-normal text-blue-600">{stateLabel(row.type)}</Badge>
                <Badge className={cn("border-0 text-[10px]", stateTone(String(row.state)))}>{stateLabel(row.state)}</Badge>
              </span>
            </div>
            <OrderThumbs fid={String(row.fid)} />
            <div className="mt-2 flex items-end justify-between">
              <div className="text-[12px] text-slate-500">
                制单人：{row.create_by ?? "-"} {String(row.create_time ?? "").slice(0, 16)}
              </div>
              <div className="text-right">
                <span className="text-[18px] font-black text-rose-600">¥{num(row.money)}</span>
                <div className="text-[11px] text-slate-400">共 {row.item_count ?? 0} 项</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 分页 + 汇总条 */}
      <div className="fixed inset-x-0 bottom-[64px] z-30 border-t bg-white/95 backdrop-blur md:bottom-0">
        <div className="flex items-center justify-between px-4 py-1.5 text-[12px] text-slate-500">
          <span>
            本页要货金额：<span className="font-bold text-rose-600">¥{num(pageMoney)}</span>
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1 || list.isFetching} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">{page}/{Math.max(totalPages, 1)}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages || list.isFetching} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 新建订货 FAB */}
      <button
        onClick={() => navigate("/m/order/catalog")}
        className="fixed bottom-32 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40"
        aria-label="新建订货"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 详情抽屉 */}
      <Sheet open={selectedFid !== undefined} onOpenChange={(o) => !o && setSelectedFid(undefined)}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          {detail.data ? (
            <OrderDetail
              order={detail.data as Row}
              onEdit={() => editInCart(detail.data as Row)}
              onAction={(a) => setPendingAction({ action: a, fid: String(detail.data!.fid) })}
              onConfirm={() => openConfirm(detail.data as Row)}
            />
          ) : (
            <div className="space-y-4 p-5"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40" /><Skeleton className="h-56" /></div>
          )}
        </SheetContent>
      </Sheet>

      {/* 写操作确认（作废/删除可填原因） */}
      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" />确认{ACTION_LABEL[pendingAction?.action ?? "audit"]}？
            </AlertDialogTitle>
            <AlertDialogDescription>
              单据：<span className="font-mono">{pendingAction?.fid}</span>。
              <span className="font-semibold text-rose-600">该操作直接作用于真实业务系统。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(pendingAction?.action === "invalid" || pendingAction?.action === "delete") && (
            <Textarea
              value={actionMemo}
              onChange={(e) => setActionMemo(e.target.value)}
              placeholder={pendingAction.action === "invalid" ? "作废原因（必填建议）" : "删除原因（可选）"}
              className="min-h-20 rounded-xl"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAction) return;
                action.mutate({ entity: "storeOrder", action: pendingAction.action, fid: pendingAction.fid, memo: actionMemo || undefined });
                setActionMemo("");
              }}
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={action.isPending}
            >
              {action.isPending ? "执行中..." : "确认执行"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 确认实收弹窗：逐行填写实收数量 */}
      <AlertDialog open={Boolean(confirmOrder)} onOpenChange={(o) => !o && setConfirmOrder(null)}>
        <AlertDialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>确认实收</AlertDialogTitle>
            <AlertDialogDescription>
              单据：<span className="font-mono">{confirmOrder?.fid}</span>。请逐行核对实际收货数量（预填为应配送数量），提交后进入"已确认实收"，<span className="font-semibold text-rose-600">不可再作废</span>。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto py-1">
            {((confirmOrder?.details ?? []) as Row[]).map((d, i) => {
              const itemId = Number(d.item_id);
              return (
                <div key={i} className="flex items-center gap-2 rounded-xl border bg-slate-50/60 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-slate-800">{d.item_name}</div>
                    <div className="text-[11px] text-slate-400">订货 {num(d.quantity)} {d.unit}{Number(d.delivery_quantity) > 0 ? ` · 已配送 ${num(d.delivery_quantity)}` : ""}</div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={receiveMap[itemId] ?? 0}
                    onChange={(e) => setReceiveMap((m) => ({ ...m, [itemId]: Math.max(0, Number(e.target.value) || 0) }))}
                    className="h-9 w-20 rounded-lg text-right"
                  />
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={confirm.isPending}
              onClick={() => {
                if (!confirmOrder) return;
                confirm.mutate({
                  fid: String(confirmOrder.fid),
                  lines: ((confirmOrder.details ?? []) as Row[]).map((d) => ({
                    item_id: Number(d.item_id),
                    receive_quantity: receiveMap[Number(d.item_id)] ?? 0,
                  })),
                });
              }}
            >
              {confirm.isPending ? "提交中..." : "提交实收"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** 卡片商品缩略图（取详情前4张图） */
function OrderThumbs({ fid }: { fid: string }) {
  const detail = trpc.biz.docDetail.useQuery({ entity: "storeOrder", fid }, { staleTime: 5 * 60_000 });
  const urls = useMemo(() => {
    const details = (detail.data?.details ?? []) as Row[];
    return details.slice(0, 4).map((d) => (Array.isArray(d.image_urls) ? d.image_urls[0] : null)).filter(Boolean) as string[];
  }, [detail.data]);
  if (detail.isLoading) return <Skeleton className="mt-3 h-14 w-full rounded-xl" />;
  if (urls.length === 0) return null;
  return (
    <div className="mt-3 flex gap-2 overflow-hidden">
      {urls.map((u, i) => (
        <img key={i} src={u} alt="" className="h-14 w-14 rounded-lg border bg-slate-50 object-cover" loading="lazy" />
      ))}
    </div>
  );
}

function OrderDetail({ order, onEdit, onAction, onConfirm }: { order: Row; onEdit: () => void; onAction: (a: "audit" | "invalid" | "delete") => void; onConfirm: () => void }) {
  const lines = (order.details ?? []) as Row[];
  const stateText = stateLabel(order.state);
  return (
    <div>
      <SheetHeader className="border-b px-4 py-3 text-left">
        <SheetTitle className="text-base">门店订单详情</SheetTitle>
        <SheetDescription className="font-mono text-xs">{order.fid}</SheetDescription>
      </SheetHeader>

      {/* 状态横幅 */}
      <div className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-semibold",
        order.state === "AUDIT" ? "bg-emerald-50 text-emerald-700" : order.state === "INVALID" ? "bg-slate-100 text-slate-500" : "bg-blue-50 text-blue-700")}>
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white",
          order.state === "AUDIT" ? "bg-emerald-500" : order.state === "INVALID" ? "bg-slate-400" : "bg-blue-600")}>!</span>
        {stateText}
      </div>

      {/* 主单信息 */}
      <div className="space-y-1.5 px-4 py-3 text-[13px]">
        <div className="flex justify-between"><span className="text-slate-400">可用余额</span><span className="font-bold text-rose-600">{order.available_balance != null ? money(order.available_balance) : "--"}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">收货门店</span><span>{order.store_name ?? "-"}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">订单类型</span><span>{stateLabel(order.type)}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">制单人</span><span>{order.create_by ?? "-"} · {String(order.create_time ?? "").slice(0, 19)}</span></div>
        {order.memo && <div className="flex justify-between"><span className="text-slate-400">备注</span><span>{order.memo}</span></div>}
      </div>

      {/* 明细 */}
      <div className="border-t">
        <div className="flex items-center justify-between px-4 py-2 text-[13px] text-slate-500">
          <span>商品明细</span><span>共 {lines.length} 项</span>
        </div>
        <div className="divide-y">
          {lines.map((d, i) => (
            <div key={i} className="flex gap-3 px-4 py-2.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {Array.isArray(d.image_urls) && d.image_urls[0] ? <img src={d.image_urls[0]} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 text-[13px] font-semibold text-slate-900">{d.item_name}</span>
                  <span className="shrink-0 text-[14px] font-black text-rose-600">{money(d.money)}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">规格：{d.purchase_spec || "-"}　条码：{d.item_bar_code || "-"}</div>
                <div className="mt-0.5 flex justify-between text-[12px] text-slate-600">
                  <span>{money(d.price)} /{d.unit}</span>
                  <span>× {num(d.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 汇总 + 操作 */}
      <div className="sticky bottom-0 border-t bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="text-[20px] font-black text-rose-600">{money(order.money)}</span>
            {Number(order.logistics_fee) > 0 && <span className="ml-2 text-[12px] text-slate-500">（含统配 {money(order.logistics_fee)}）</span>}
            <div className="text-[12px] text-slate-400">体积：{order.volume ?? "--"}m³　品项：{order.item_count ?? lines.length}　数量：{num(order.quantity)}</div>
          </div>
        </div>
        <div className="flex gap-2">
          {order.state === "INIT" && (
            <>
              <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={onEdit}>
                <PencilLine className="mr-1 h-4 w-4" />点货
              </Button>
              <Button className="h-11 flex-1 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => onAction("audit")}>审核</Button>
              <Button variant="outline" className="h-11 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onAction("delete")}>删除</Button>
            </>
          )}
          {/* 确认实收：仅已审核 + 供应商已确认（网页版规则） */}
          {order.state === "AUDIT" && order.confirm_state === "SUPPLIER_CONFIRM" && (
            <Button className="h-11 flex-1 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={onConfirm}>确认实收</Button>
          )}
          {/* 作废：仅已审核且未门店确认（INIT/SUPPLIER_CONFIRM） */}
          {order.state === "AUDIT" && (order.confirm_state === "INIT" || order.confirm_state === "SUPPLIER_CONFIRM") && (
            <Button variant="outline" className="h-11 flex-1 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onAction("invalid")}>作废</Button>
          )}
          {order.state === "AUDIT" && order.confirm_state === "STORE_CONFIRM" && (
            <div className="flex-1 rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-700">已确认实收</div>
          )}
        </div>
      </div>
    </div>
  );
}
