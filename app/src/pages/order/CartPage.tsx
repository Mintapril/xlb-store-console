import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AlertTriangle, ChevronRight, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart, type CatalogItem } from "@/lib/cart";
import { ItemKindBadge } from "@/lib/itemKind";
import { trpc } from "@/providers/trpc";

/**
 * 采购车（App 截图1风格）：明细步进器 + 备注 + 汇总条 + 保存/审核。
 * 支持编辑模式：?fid=DD... 时“保存”走 updateOrder。
 */
export default function CartPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editFid = params.get("fid") ?? undefined;
  const cart = useCart();
  const utils = trpc.useUtils();
  const [confirmAudit, setConfirmAudit] = useState(false);

  const create = trpc.biz.createOrder.useMutation();
  const update = trpc.biz.updateOrder.useMutation();
  const audit = trpc.biz.docAction.useMutation();

  const busy = create.isPending || update.isPending || audit.isPending;

  async function afterSaved(fid: string) {
    cart.clear();
    await Promise.all([utils.biz.docList.invalidate(), utils.biz.dashboard.invalidate()]);
    return fid;
  }

  async function handleSave() {
    try {
      const payload = { memo: cart.memo, details: cart.lines.map((l) => ({ quantity: l.quantity, item: mapItem(l.item) })) };
      const data = editFid ? await update.mutateAsync({ fid: editFid, ...payload }) : await create.mutateAsync(payload);
      const fid = String((data as Record<string, unknown>)?.fid ?? editFid ?? "");
      await afterSaved(fid);
      toast.success(editFid ? "订单已保存" : "订单已创建（制单）", { description: fid });
      navigate("/m/order/list");
    } catch (error) {
      toast.error("保存失败", { description: (error as Error).message });
    }
  }

  async function handleAudit() {
    setConfirmAudit(false);
    try {
      const payload = { memo: cart.memo, details: cart.lines.map((l) => ({ quantity: l.quantity, item: mapItem(l.item) })) };
      const data = editFid ? await update.mutateAsync({ fid: editFid, ...payload }) : await create.mutateAsync(payload);
      const fid = String((data as Record<string, unknown>)?.fid ?? editFid ?? "");
      if (!fid) throw new Error("未获取到单号");
      await audit.mutateAsync({ entity: "storeOrder", action: "audit", fid });
      await afterSaved(fid);
      toast.success("订单已审核", { description: fid });
      navigate("/m/order/list");
    } catch (error) {
      toast.error("审核失败", { description: (error as Error).message });
    }
  }

  if (cart.lines.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
        <ShoppingCart className="h-12 w-12 text-slate-200" />
        <p className="text-sm">采购车是空的，去挑选商品吧</p>
        <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/m/order/catalog")}>去选品</Button>
      </div>
    );
  }

  return (
    <div className="-mx-3 -mt-3 md:-mx-4 md:-mt-4 lg:-mx-6 lg:-mt-6">
      {/* 状态条 */}
      <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] text-white">!</span>
        {editFid ? `编辑订单 ${editFid}` : "制单"}
      </div>

      {/* 单据备注 + 添加商品 */}
      <div className="flex items-center border-b bg-white">
        <button
          onClick={() => {
            const v = window.prompt("单据备注", cart.memo);
            if (v !== null) cart.setMemo(v);
          }}
          className="flex flex-1 items-center justify-between px-4 py-3.5 text-sm"
        >
          <span className="font-medium text-slate-800">单据备注</span>
          <span className="flex items-center gap-1 text-slate-400">
            {cart.memo || "请填写"}
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
        <button
          onClick={() => navigate(editFid ? `/m/order/catalog?fid=${editFid}` : "/m/order/catalog")}
          className="flex items-center gap-1 border-l px-4 py-3.5 text-sm font-semibold text-blue-600 active:bg-blue-50"
        >
          <Plus className="h-4 w-4" />添加
        </button>
      </div>

      {/* 明细 */}
      <div className="divide-y bg-white">
        {cart.lines.map((line) => {
          const price = cart.unitPrice(line.item);
          const lineTotal = Math.round(price * line.quantity * 100) / 100;
          return (
            <div key={line.item.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {(line.item.delivery_ratio ?? 1) > 1 && (
                      <Badge variant="outline" className="h-4 shrink-0 border-orange-300 px-1 text-[9px] text-orange-500">拆零</Badge>
                    )}
                    <ItemKindBadge item={line.item} />
                    <span className="line-clamp-2 text-[15px] font-semibold text-slate-900">{line.item.name}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-3 text-[12px] text-slate-500">
                    <div>规格：{line.item.purchase_spec || "-"}</div>
                    <div>14日均销：{fmtQty(line.item.daily_sale_quantity)}{line.item.unit ?? ""}</div>
                    <div>条码：{line.item.bar_code || "-"}</div>
                    <div>库存：{fmtQty(line.item.basic_stock_quantity ?? line.item.stock_quantity)}{line.item.unit ?? ""}</div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[16px] font-black text-rose-600">¥{lineTotal.toFixed(2)}</div>
                  <button onClick={() => cart.remove(line.item.id)} className="mt-1 text-slate-300 active:text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[15px] font-semibold text-slate-800">
                  ¥{price.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}
                  <span className="text-[12px] font-normal text-slate-400"> /{line.item.delivery_unit || line.item.unit || "个"}</span>
                </span>
                <div className="flex items-center rounded-lg border">
                  <button onClick={() => cart.setQty(line.item.id, line.quantity - 1)} className="flex h-9 w-10 items-center justify-center border-r text-lg text-slate-600 active:bg-slate-50">−</button>
                  <input
                    value={line.quantity}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v)) cart.setQty(line.item.id, Math.max(0, v));
                    }}
                    className="h-9 w-14 border-r text-center text-[15px] font-bold outline-none"
                    inputMode="decimal"
                  />
                  <button onClick={() => cart.setQty(line.item.id, line.quantity + 1)} className="flex h-9 w-10 items-center justify-center text-lg text-slate-600 active:bg-slate-50">+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 汇总 + 操作（吸底，移动端在底部导航之上） */}
      <div className="sticky bottom-[64px] z-30 border-t bg-white shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.25)] md:bottom-0">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <span className="text-[20px] font-black text-rose-600">¥{cart.totalMoney.toFixed(2)}</span>
            <span className="ml-2 text-[12px] text-slate-500">（含统配 ¥{cart.totalLogistics.toFixed(1)}）</span>
            <div className="text-[12px] text-slate-400">
              体积：{cart.totalVolume}m³　品项：<span className="font-semibold text-slate-700">{cart.count}</span>　数量：
              <span className="font-semibold text-slate-700">{cart.lines.reduce((a, l) => a + l.quantity, 0)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-3">
          <Button variant="outline" className="h-12 rounded-xl text-base" disabled={busy} onClick={handleSave}>
            {update.isPending || (create.isPending && !audit.isPending) ? "保存中..." : "保存"}
          </Button>
          <Button className="h-12 rounded-xl bg-blue-600 text-base hover:bg-blue-700" disabled={busy} onClick={() => setConfirmAudit(true)}>
            审核
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmAudit} onOpenChange={setConfirmAudit}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" />确认审核该订单？
            </AlertDialogTitle>
            <AlertDialogDescription>
              共 {cart.count} 项、金额 ¥{cart.totalMoney.toFixed(2)}。审核将先{editFid ? "保存修改" : "创建订单"}再提交审核，
              <span className="font-semibold text-rose-600">直接作用于真实业务系统</span>，审核后不可自行修改。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">再想想</AlertDialogCancel>
            <AlertDialogAction onClick={handleAudit} className="rounded-xl bg-blue-600 hover:bg-blue-700" disabled={busy}>
              确认审核
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function fmtQty(v: unknown): string {
  if (v === null || v === undefined) return "--";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n % 1 === 0 ? String(n) : String(Math.round(n * 1000) / 1000);
}

function mapItem(item: CatalogItem) {
  return {
    id: item.id,
    code: item.code,
    bar_code: item.bar_code ?? "",
    name: item.name,
    unit: item.unit ?? "个",
    delivery_unit: item.delivery_unit ?? item.unit ?? "个",
    delivery_ratio: item.delivery_ratio ?? 1,
    basic_price: item.basic_price ?? 0,
  };
}
