import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Landmark, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { money } from "@/lib/format";
import { trpc } from "@/providers/trpc";

type Row = Record<string, any>;

/** 月度对账单（BMS 资金分账） */
export default function MonthBillsPage() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [signTarget, setSignTarget] = useState<Row | null>(null);

  const list = trpc.biz.monthBills.useQuery({ page, pageSize: 10 }, {
    placeholderData: (prev) => prev,
    retry: false,
  });
  const sign = trpc.biz.signMonthBill.useMutation({
    onSuccess: async () => {
      toast.success("签名确认成功");
      setSignTarget(null);
      await utils.biz.monthBills.invalidate();
    },
    onError: (e) => toast.error("签名确认失败", { description: e.message }),
  });

  const rows: Row[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  if (list.isError) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center shadow-sm">
        <Landmark className="mx-auto mb-3 h-10 w-10 text-slate-200" />
        <p className="text-sm text-slate-500">{list.error.message.includes("权限") ? "当前账号暂无月度对账单权限" : list.error.message}</p>
        <p className="mt-1 text-xs text-slate-400">请使用具备 BMS 资金分账权限的账号登录（如门店投资人手机号短信登录）</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-start justify-between rounded-3xl border bg-white p-4 shadow-sm md:p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">月度对账单</h1>
            <Badge variant="secondary" className="rounded-lg">BMS 资金分账</Badge>
          </div>
          <p className="mt-1 hidden text-sm text-slate-500 md:block">门店与总部资金月度对账，含资金、商品、单据、预付卡等分项。</p>
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => list.refetch()} disabled={list.isFetching} aria-label="刷新">
          <RefreshCcw className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {list.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        {!list.isLoading && rows.length === 0 && (
          <div className="rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">暂无对账单</div>
        )}
        {rows.map((row) => {
          const signed = Boolean(row.merchant_sign_time);
          const open = expanded === row.id;
          return (
            <div key={row.id} className="rounded-3xl border bg-white p-4 shadow-sm">
              <button onClick={() => setExpanded(open ? null : row.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-[15px] font-bold text-slate-950">{row.statistical_time_value}</div>
                    <div className="mt-0.5 font-mono text-xs text-slate-400">{row.order_id}</div>
                  </div>
                  <Badge className={signed ? "rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-100"}>
                    {signed ? "已签名" : "待签名确认"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <FeeCell label="期初" value={row.capital_begin_fee} />
                  <FeeCell label="应收" value={row.capital_receivable_fee} accent="text-emerald-600" />
                  <FeeCell label="应付" value={row.capital_payable_fee} accent="text-rose-600" />
                  <FeeCell label="期末" value={row.capital_end_fee} strong />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  {row.merchant_name} · 财务签名 {row.finance_sign_time ? String(row.finance_sign_time).slice(0, 10) : "--"} · 商户签名 {signed ? String(row.merchant_sign_time).slice(0, 10) : "--"}
                </div>
              </button>

              {open && (
                <div className="mt-3 space-y-1.5 border-t pt-3">
                  <FeeRow label="商品应收/应付" left={`${money(row.item_receivable_fee)} / ${money(row.item_payable_fee)}`} />
                  <FeeRow label="单据应收/应付" left={`${money(row.bill_receivable_fee)} / ${money(row.bill_payable_fee)}`} />
                  <FeeRow label="消费应收/应付" left={`${money(row.consume_payable_fee)} / ${money(row.consume_need_payable_fee)}`} />
                  <FeeRow label="预付卡" left={row.card_begin_fee_value ?? "--"} />
                  <FeeRow label="积分" left={money(row.points_end_fee)} />
                  <FeeRow label="信用期初/期末" left={`${money(row.credit_begin_fee)} / ${money(row.credit_end_fee)}`} />
                  <FeeRow label="资金账户" left={row.capital_account ?? "--"} mono />
                  <FeeRow label="资金组织" left={row.organization_name ?? "--"} />
                  {!signed && (
                    <Button className="mt-2 h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => setSignTarget(row)}>
                      签名确认
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-3xl border bg-white px-4 py-3 shadow-sm">
        <span className="text-xs text-slate-400 md:text-sm">共 {total} 期</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page <= 1 || list.isFetching} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="mr-1 h-4 w-4" />上一页
          </Button>
          <span className="text-sm text-slate-500">{page}/{totalPages}</span>
          <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page >= totalPages || list.isFetching} onClick={() => setPage((p) => p + 1)}>
            下一页<ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={Boolean(signTarget)} onOpenChange={(o) => !o && setSignTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" />确认签名？
            </AlertDialogTitle>
            <AlertDialogDescription>
              对账单：{signTarget?.statistical_time_value}（期末 {money(signTarget?.capital_end_fee)}）。
              签名确认表示你认可该期对账结果，<span className="font-semibold text-rose-600">直接作用于真实业务系统，不可撤销</span>。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-blue-600 hover:bg-blue-700" disabled={sign.isPending} onClick={() => signTarget && sign.mutate({ id: signTarget.id })}>
              {sign.isPending ? "提交中..." : "确认签名"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FeeCell({ label, value, strong, accent }: { label: string; value: unknown; strong?: boolean; accent?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-1 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-0.5 truncate text-[13px] ${strong ? "font-black text-slate-950" : "font-semibold text-slate-700"} ${accent ?? ""}`}>
        {money(value)}
      </div>
    </div>
  );
}

function FeeRow({ label, left, mono }: { label: string; left: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2 text-[13px]">
      <span className="text-slate-400">{label}</span>
      <span className={mono ? "font-mono text-[12px] text-slate-700" : "font-medium text-slate-700"}>{left}</span>
    </div>
  );
}
