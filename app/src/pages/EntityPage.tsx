import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { entities, type ActionDef, type ColumnDef } from "@/lib/registry";
import { dateText, getPathValue, money, num, stateLabel, stateTone } from "@/lib/format";
import { trpc } from "@/providers/trpc";

type DocRow = Record<string, any>;
type PendingAction = { action: ActionDef; fid: string; state: string } | undefined;

export default function EntityPage({ entityKey }: { entityKey: string }) {
  const def = entities[entityKey];
  const utils = trpc.useUtils();
  const [keyword, setKeyword] = useState("");
  const [state, setState] = useState("全部");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFid, setSelectedFid] = useState<string>();
  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const [actionMemo, setActionMemo] = useState("");

  const list = trpc.biz.docList.useQuery(
    { entity: entityKey, state, keyword, dateFrom, dateTo, page, pageSize: 20 },
    { enabled: Boolean(def), placeholderData: (prev) => prev },
  );
  const detail = trpc.biz.docDetail.useQuery(
    { entity: entityKey, fid: selectedFid! },
    { enabled: Boolean(def && selectedFid) },
  );
  const action = trpc.biz.docAction.useMutation({
    onSuccess: async () => {
      toast.success("操作已在真实业务系统生效");
      setPendingAction(undefined);
      setActionMemo("");
      await Promise.all([utils.biz.docList.invalidate(), utils.biz.docDetail.invalidate(), utils.biz.dashboard.invalidate()]);
    },
    onError: (error) => toast.error("操作失败", { description: error.message }),
  });

  if (!def) {
    return <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">未知业务实体：{entityKey}</div>;
  }

  const rows: DocRow[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = list.data?.totalPages ?? 0;

  function runAction() {
    if (!pendingAction) return;
    action.mutate({
      entity: entityKey,
      action: pendingAction.action.action,
      fid: pendingAction.fid,
      memo: actionMemo || undefined,
    });
  }

  const primaryCols = def.columns.slice(0, 3);
  const restCols = def.columns.slice(3);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* 查询工具栏 */}
      <div className="rounded-3xl border bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">{def.label}</h1>
              <Badge variant="secondary" className="rounded-lg">真实数据</Badge>
            </div>
            <p className="mt-1 hidden text-sm text-slate-500 md:block">{def.description}</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => list.refetch()} disabled={list.isFetching} aria-label="刷新">
            <RefreshCcw className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              placeholder={`完整单号精确查询（${def.fidHint}）`}
              className="h-10 w-full rounded-xl pl-9 md:w-[260px]"
            />
          </div>
          <Select value={state} onValueChange={(v) => { setState(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-full rounded-xl md:w-[130px]"><SelectValue placeholder="状态" /></SelectTrigger>
            <SelectContent>
              {["全部", ...def.states].map((s) => <SelectItem key={s} value={s}>{s === "全部" ? "全部状态" : stateLabel(s)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl md:w-[150px]" aria-label="开始日期" />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-10 w-full rounded-xl md:w-[150px]" aria-label="结束日期" />
        </div>
      </div>

      {/* 移动端：卡片列表 */}
      <div className="space-y-2 md:hidden">
        {list.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        {!list.isLoading && rows.length === 0 && (
          <div className="rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">没有符合条件的数据</div>
        )}
        {rows.map((row) => (
          <button key={String(row.fid)} onClick={() => setSelectedFid(String(row.fid))} className="w-full rounded-3xl border bg-white p-4 text-left shadow-sm active:bg-blue-50/50">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">{String(row.fid ?? "-")}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${stateTone(String(row.state ?? ""))}`}>{stateLabel(row.state)}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {restCols.slice(0, 6).map((col) => (
                <div key={col.key}>
                  <div className="text-[11px] text-slate-400">{col.label}</div>
                  <div className="mt-0.5 truncate text-[13px] font-medium text-slate-800">
                    <Cell value={getPathValue(row, col.key)} kind={col.kind} row={row} />
                  </div>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* 桌面端：表格 */}
      <div className="hidden overflow-hidden rounded-3xl border bg-white shadow-sm md:block">
        <div className="flex items-center justify-between border-b px-5 py-3 text-sm text-slate-500">
          <span>共 {total.toLocaleString()} 条 · 第 {list.data?.page ?? page}/{Math.max(totalPages, 1)} 页</span>
          <span className="text-xs text-slate-400">数据来自真实业务系统</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[...primaryCols, ...restCols].map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.fid)} className="cursor-pointer border-t transition hover:bg-blue-50/40" onClick={() => setSelectedFid(String(row.fid))}>
                  {def.columns.map((column) => (
                    <td key={column.key} className="max-w-[240px] truncate px-4 py-3">
                      <Cell value={getPathValue(row, column.key)} kind={column.kind} row={row} />
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={def.columns.length} className="px-4 py-16 text-center text-slate-400">{list.isLoading ? "正在查询..." : "没有符合查询条件的数据"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between rounded-3xl border bg-white px-4 py-3 shadow-sm">
        <span className="text-xs text-slate-400 md:text-sm">共 {total.toLocaleString()} 条</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page <= 1 || list.isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="mr-1 h-4 w-4" />上一页
          </Button>
          <span className="text-sm text-slate-500">{page}</span>
          <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page >= totalPages || list.isFetching} onClick={() => setPage((p) => p + 1)}>
            下一页<ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 详情抽屉（移动端全屏） */}
      <Sheet open={selectedFid !== undefined} onOpenChange={(open) => !open && setSelectedFid(undefined)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {detail.data ? (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SheetTitle className="font-mono text-lg">{String(detail.data.fid ?? "")}</SheetTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${stateTone(String(detail.data.state ?? ""))}`}>{stateLabel(detail.data.state)}</span>
                </div>
                <SheetDescription>{def.label} · 数据来自真实业务系统</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 py-5">
                {def.actions.filter((a) => !a.when || a.when.includes(String(detail.data!.state))).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {def.actions
                      .filter((a) => !a.when || a.when.includes(String(detail.data!.state)))
                      .map((a) => (
                        <Button
                          key={a.label}
                          variant={a.variant ?? "default"}
                          className={a.variant ? "rounded-xl" : "rounded-xl bg-blue-600 hover:bg-blue-700"}
                          onClick={() => { setActionMemo(""); setPendingAction({ action: a, fid: String(detail.data!.fid), state: String(detail.data!.state) }); }}
                        >
                          {a.critical && <AlertTriangle className="mr-2 h-4 w-4" />}{a.label}
                        </Button>
                      ))}
                  </div>
                )}

                <section className="rounded-3xl border bg-slate-50/70 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">单据信息</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
                    {def.detailFields.map((field) => (
                      <Info key={field.key} label={field.label} value={<Cell value={getPathValue(detail.data, field.key)} kind={field.kind} row={detail.data} plain />} />
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border bg-white p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">
                    商品明细（{Array.isArray(detail.data.details) ? detail.data.details.length : 0} 项）
                  </h3>
                  <LinesTable lines={Array.isArray(detail.data.details) ? (detail.data.details as DocRow[]) : []} columns={def.detailColumns} />
                </section>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-6">
              <Skeleton className="h-8 w-2/3 rounded-xl" />
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-56 rounded-3xl" />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* 写操作二次确认 */}
      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(undefined)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className={pendingAction?.action.critical ? "text-amber-500" : "text-blue-500"} />
              确认执行「{pendingAction?.action.label}」？
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>单据：<span className="font-mono">{pendingAction?.fid}</span>（当前状态：{stateLabel(pendingAction?.state)}）</p>
                {pendingAction?.action.hint && <p>{pendingAction.action.hint}。</p>}
                <p className="font-semibold text-rose-600">该操作将直接作用于真实业务系统，请谨慎确认。</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={actionMemo} onChange={(e) => setActionMemo(e.target.value)} placeholder="处理意见（可选）" className="min-h-20 rounded-xl" />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={runAction}
              className={pendingAction?.action.variant === "destructive" ? "rounded-xl bg-rose-600 hover:bg-rose-700" : "rounded-xl bg-blue-600 hover:bg-blue-700"}
              disabled={action.isPending}
            >
              {action.isPending ? "执行中..." : "确认执行"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Cell({ value, kind, row, plain }: { value: unknown; kind?: string; row?: DocRow; plain?: boolean }) {
  if (kind === "status") {
    const label = stateLabel(value);
    if (plain) return <span>{label}</span>;
    return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${stateTone(String(value ?? ""))}`}>{label}</span>;
  }
  if (kind === "statestr") return <span>{stateLabel(value)}</span>;
  if (kind === "amount") return <span className="font-semibold">{money(value)}</span>;
  if (kind === "qty") return <span>{num(value)}</span>;
  if (kind === "date") return <span>{dateText(value)}</span>;
  if (value === undefined || value === null || value === "") {
    if (row && kind === undefined) return <span>-</span>;
    return <span>-</span>;
  }
  return <span>{String(value)}</span>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-100">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function LinesTable({ lines, columns }: { lines: DocRow[]; columns: ColumnDef[] }) {
  if (lines.length === 0) return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-slate-400">暂无商品明细</div>;
  return (
    <>
      {/* 移动端明细卡片 */}
      <div className="space-y-2 md:hidden">
        {lines.map((line, index) => (
          <div key={index} className="rounded-2xl border bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-slate-900">{String(line.item_name ?? "-")}</span>
              <span className="shrink-0 font-mono text-xs text-slate-400">{String(line.item_code ?? "")}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {columns.slice(2).map((col) => (
                <div key={col.key}>
                  <div className="text-[11px] text-slate-400">{col.label}</div>
                  <div className="text-[13px] font-medium text-slate-800"><Cell value={getPathValue(line, col.key)} kind={col.kind} plain /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* 桌面端明细表格 */}
      <div className="hidden overflow-x-auto rounded-2xl border md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-3 py-2 text-left">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-t">
                {columns.map((col) => (
                  <td key={col.key} className="max-w-[220px] truncate px-3 py-2">
                    <Cell value={getPathValue(line, col.key)} kind={col.kind} plain />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
