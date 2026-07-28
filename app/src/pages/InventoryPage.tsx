import { useState } from "react";
import { ChevronLeft, ChevronRight, PackageSearch, RefreshCcw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { money, num } from "@/lib/format";
import { trpc } from "@/providers/trpc";
import { ItemKindBadge } from "@/lib/itemKind";

type Row = Record<string, any>;

/** 库存查询（真实批次库存） */
export function InventoryPage() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const list = trpc.biz.inventory.useQuery(
    { keyword, page, pageSize: 20 },
    { placeholderData: (prev) => prev },
  );
  const rows: Row[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (list.data?.pageSize ?? 20)));

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="rounded-3xl border bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">库存查询</h1>
              <Badge variant="secondary" className="rounded-lg">真实数据</Badge>
            </div>
            <p className="mt-1 hidden text-sm text-slate-500 md:block">门店批次级库存：现货、锁定、预占与效期（真实系统）。</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => list.refetch()} disabled={list.isFetching} aria-label="刷新">
            <RefreshCcw className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="商品名称 / 编码 / 条码 模糊查询"
            className="h-10 w-full rounded-xl pl-9 md:w-[320px]"
          />
        </div>
      </div>

      {/* 移动端卡片 */}
      <div className="space-y-2 md:hidden">
        {list.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        {!list.isLoading && rows.length === 0 && (
          <div className="rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">
            <PackageSearch className="mx-auto mb-2 h-8 w-8 text-slate-300" />未查询到库存
          </div>
        )}
        {rows.map((row, i) => (
          <div key={`${row.item_id}-${row.batch_id}-${i}`} className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-slate-900">{row.item_name}</span>
                  <ItemKindBadge item={row} />
                </div>
                <div className="mt-0.5 font-mono text-xs text-slate-400">{row.item_code} · {row.item_spec ?? "-"}</div>
              </div>
              {row.batch_number ? <Badge variant="outline" className="shrink-0 rounded-lg text-[11px]">批次 {row.batch_number}</Badge> : null}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <StockCell label="现货" value={num(row.quantity)} strong />
              <StockCell label="可用" value={num(row.valid_quantity)} />
              <StockCell label="锁定" value={num(row.lock_quantity)} />
              <StockCell label="预占" value={num(row.pre_occupy_quantity)} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{row.unit} · {row.storehouse_name ?? "-"}</span>
              <span>{row.producing_date ? `生产日期 ${row.producing_date}` : ""}{row.expire_date ? ` · 到期 ${row.expire_date}` : ""}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 桌面端表格 */}
      <div className="hidden overflow-hidden rounded-3xl border bg-white shadow-sm md:block">
        <div className="flex items-center justify-between border-b px-5 py-3 text-sm text-slate-500">
          <span>共 {total.toLocaleString()} 条</span>
          <span className="text-xs text-slate-400">成本价按权限显示</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["商品编码", "商品名称", "规格", "单位", "批次", "现货", "可用", "锁定", "预占", "生产日期", "到期日", "仓库", "最近入库"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.item_id}-${row.batch_id}-${i}`} className="border-t hover:bg-blue-50/40">
                  <td className="px-4 py-3 font-mono text-xs">{row.item_code}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-medium">{row.item_name}</td>
                  <td className="px-4 py-3 text-slate-500">{row.item_spec ?? "-"}</td>
                  <td className="px-4 py-3">{row.unit}</td>
                  <td className="px-4 py-3 text-slate-500">{row.batch_number || "-"}</td>
                  <td className="px-4 py-3 font-semibold">{num(row.quantity)}</td>
                  <td className="px-4 py-3">{num(row.valid_quantity)}</td>
                  <td className="px-4 py-3">{num(row.lock_quantity)}</td>
                  <td className="px-4 py-3">{num(row.pre_occupy_quantity)}</td>
                  <td className="px-4 py-3 text-slate-500">{row.producing_date ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{row.expire_date ?? "-"}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-slate-500">{row.storehouse_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-500">{row.latest_in_date ?? "-"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={13} className="px-4 py-16 text-center text-slate-400">{list.isLoading ? "正在查询..." : "未查询到库存"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pager page={page} totalPages={totalPages} total={total} fetching={list.isFetching} onChange={setPage} />
    </div>
  );
}

/** 商品价格查询（真实商品档案） */
export function PricePage() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const list = trpc.biz.items.useQuery(
    { keyword, page, pageSize: 20 },
    { placeholderData: (prev) => prev },
  );
  const rows: Row[] = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (list.data?.pageSize ?? 20)));

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="rounded-3xl border bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-950 md:text-xl">商品价格查询</h1>
              <Badge variant="secondary" className="rounded-lg">真实数据</Badge>
            </div>
            <p className="mt-1 hidden text-sm text-slate-500 md:block">商品档案零售价/配送价/批发价（真实系统）。</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => list.refetch()} disabled={list.isFetching} aria-label="刷新">
            <RefreshCcw className={`h-4 w-4 ${list.isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="商品名称 / 编码 / 条码 模糊查询"
            className="h-10 w-full rounded-xl pl-9 md:w-[320px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {list.isLoading && [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
        {!list.isLoading && rows.length === 0 && (
          <div className="col-span-full rounded-3xl border bg-white px-4 py-14 text-center text-sm text-slate-400">未查询到商品</div>
        )}
        {rows.map((row) => (
          <div key={row.id} className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">{row.name}</div>
                <div className="mt-0.5 font-mono text-xs text-slate-400">{row.code} · {row.unit}</div>
              </div>
              <Badge variant={row.stop_sale ? "destructive" : "secondary"} className="shrink-0 rounded-lg text-[11px]">
                {row.stop_sale ? "停售" : row.item_status === "NEW_ITEM" ? "新品" : "在售"}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <PriceCell label="零售价" value={row.sale_price} strong />
              <PriceCell label="配送价" value={row.delivery_price} />
              <PriceCell label="批发价" value={row.wholesale_price} />
            </div>
            <div className="mt-2 truncate text-xs text-slate-400">
              {row.item_category?.name ?? row.three_category_name ?? "-"} · {row.purchase_spec ?? "-"}
            </div>
          </div>
        ))}
      </div>

      <Pager page={page} totalPages={totalPages} total={total} fetching={list.isFetching} onChange={setPage} />
    </div>
  );
}

function StockCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-1 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-0.5 text-sm ${strong ? "font-black text-slate-950" : "font-medium text-slate-700"}`}>{value}</div>
    </div>
  );
}

function PriceCell({ label, value, strong }: { label: string; value: unknown; strong?: boolean }) {
  const masked = value === "****" || value === undefined || value === null;
  return (
    <div className="rounded-2xl bg-slate-50 px-1 py-2">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-0.5 text-sm ${strong ? "font-black text-slate-950" : "font-medium text-slate-700"}`}>
        {masked ? "无权限" : money(value)}
      </div>
    </div>
  );
}

function Pager({ page, totalPages, total, fetching, onChange }: { page: number; totalPages: number; total: number; fetching: boolean; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border bg-white px-4 py-3 shadow-sm">
      <span className="text-xs text-slate-400 md:text-sm">共 {total.toLocaleString()} 条</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page <= 1 || fetching} onClick={() => onChange(Math.max(1, page - 1))}>
          <ChevronLeft className="mr-1 h-4 w-4" />上一页
        </Button>
        <span className="text-sm text-slate-500">{page}/{totalPages}</span>
        <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page >= totalPages || fetching} onClick={() => onChange(page + 1)}>
          下一页<ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default InventoryPage;
