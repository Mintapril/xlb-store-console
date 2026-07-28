import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, Flame, Package, Plus, ScanLine, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCart, type CatalogItem } from "@/lib/cart";
import { ItemKindBadge } from "@/lib/itemKind";
import { trpc } from "@/providers/trpc";

type CatNode = { id: number; parent_id: number | null; name: string; level: number | null };

const REF_OPTIONS = [
  { key: "daily_sale_quantity", label: "14日均销" },
  { key: "stock_quantity", label: "库存" },
  { key: "on_way_quantity", label: "在途数量" },
  { key: "on_order_quantity", label: "在订数量" },
  { key: "today_sale_quantity", label: "今日销量" },
  { key: "period", label: "保质期" },
  { key: "available_days", label: "可用天数" },
  { key: "sale_price", label: "零售价" },
  { key: "gross_profit_rate", label: "毛利率" },
  { key: "producing_date", label: "商品日期" },
  { key: "distribution_rate7_days", label: "7日配销比" },
  { key: "volume", label: "商品体积" },
] as const;

type Group =
  | { kind: "all"; label: string }
  | { kind: "new"; days: number; label: string }
  | { kind: "must"; label: string }
  | { kind: "cat"; id: number; label: string };

export default function CatalogPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [keyword, setKeyword] = useState("");
  const [group, setGroup] = useState<Group>({ kind: "all", label: "全部商品" });
  const [newOpen, setNewOpen] = useState(true);
  const [openCat, setOpenCat] = useState<number | null>(null);
  const [sort, setSort] = useState<"sale" | "price_asc" | "price_desc" | "stock" | "new">("sale");
  const [page, setPage] = useState(1);
  const [refOpen, setRefOpen] = useState(false);
  const [refKeys, setRefKeys] = useState<string[]>(["daily_sale_quantity", "stock_quantity", "on_way_quantity", "today_sale_quantity", "period", "producing_date"]);

  const cats = trpc.biz.categories.useQuery(undefined, { staleTime: 10 * 60_000 });
  const catTree = useMemo(() => {
    const nodes = (cats.data ?? []) as unknown as CatNode[];
    const level1 = nodes.filter((n) => n.level === 1);
    const childrenOf = (id: number) => nodes.filter((n) => n.parent_id === id);
    const leafIdsOf = (id: number): number[] => {
      const children = childrenOf(id);
      if (children.length === 0) return [id];
      return children.flatMap((c) => leafIdsOf(c.id));
    };
    return { level1, childrenOf, leafIdsOf };
  }, [cats.data]);

  function pickCat(node: CatNode) {
    // 有一级子分类时，点击展开/收起；同时按该分支过滤
    const children = catTree.childrenOf(node.id);
    if (node.level === 1 && children.length > 0) {
      setOpenCat((prev) => (prev === node.id ? null : node.id));
    }
    pickGroup({ kind: "cat", id: node.id, label: node.name });
  }

  const queryInput = {
    keyword: keyword.trim() || undefined,
    categoryIds: group.kind === "cat" ? catTree.leafIdsOf(group.id) : undefined,
    mustSell: group.kind === "must" ? true : undefined,
    // 新品分组强制按上架时间排序，再按 days<=N 过滤，保证最新商品优先出现
    sort: group.kind === "new" ? ("new" as const) : sort,
    page,
    pageSize: 20,
  };
  const list = trpc.biz.catalog.useQuery(queryInput, { placeholderData: (prev) => prev });

  const rawItems = (list.data?.items ?? []) as unknown as CatalogItem[];
  const items = group.kind === "new" ? rawItems.filter((it) => (it.days ?? 9999) <= group.days) : rawItems;
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  function pickGroup(g: Group) {
    setGroup(g);
    setPage(1);
  }

  function toggleRef(key: string) {
    setRefKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 6) return prev;
      return [...prev, key];
    });
  }

  return (
    <div className="-mx-3 -mt-3 flex h-[calc(100dvh-136px)] flex-col md:-mx-4 md:-mt-4 md:h-[calc(100dvh-80px)] lg:-mx-6 lg:-mt-6">
      {/* 顶部：标题 + 搜索（固定不滚动） */}
      <div className="shrink-0 border-b bg-white px-3 pb-2 pt-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <span className="text-base font-bold">门店订货</span>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setRefOpen(true)} className="flex flex-col items-center rounded-lg px-2 py-1 text-slate-500 active:bg-slate-100">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-[10px]">参考</span>
            </button>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="商品名称/代码/条码/供应商"
            className="h-10 rounded-xl bg-slate-100 pl-9 pr-10"
          />
          <ScanLine className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* 主体：左右独立滚动 */}
      <div className="flex min-h-0 flex-1">
        {/* 左侧分组（自身滚动，不随右侧滑动） */}
        <aside className="h-full w-[86px] shrink-0 overflow-y-auto border-r bg-slate-50/80">
          <button onClick={() => pickGroup({ kind: "all", label: "全部商品" })} className={sideCls(group.kind === "all")}>全部商品</button>
          {/* 新品上市（可折叠，含 7/15/30 天三个子分类） */}
          <button onClick={() => setNewOpen((v) => !v)} className={sideCls(group.kind === "new")}>
            <Badge className="mb-0.5 h-4 bg-emerald-500 px-1 text-[9px] hover:bg-emerald-500">新</Badge>
            <span className="flex items-center gap-0.5">
              新品上市
              {newOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </span>
          </button>
          {newOpen && (
            <>
              <button onClick={() => pickGroup({ kind: "new", days: 7, label: "7天新品" })} className={subCls(group.kind === "new" && group.days === 7)}>7天新品</button>
              <button onClick={() => pickGroup({ kind: "new", days: 15, label: "15天新品" })} className={subCls(group.kind === "new" && group.days === 15)}>15天新品</button>
              <button onClick={() => pickGroup({ kind: "new", days: 30, label: "30天新品" })} className={subCls(group.kind === "new" && group.days === 30)}>30天新品</button>
            </>
          )}
          <button onClick={() => pickGroup({ kind: "must", label: "必卖商品" })} className={sideCls(group.kind === "must")}>
            <Flame className="mb-0.5 h-3.5 w-3.5 text-rose-500" />必卖商品
          </button>
          <div className="mx-2 my-2 border-t" />
          {catTree.level1.map((c) => {
            const children = catTree.childrenOf(c.id);
            const expanded = openCat === c.id;
            const activeSelf = group.kind === "cat" && group.id === c.id;
            return (
              <div key={c.id}>
                <button onClick={() => pickCat(c)} className={sideCls(activeSelf)}>
                  <span className="flex items-center gap-0.5">
                    {c.name.replace(/^(定量|散称)/, "")}
                    {children.length > 0 &&
                      (expanded ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />)}
                  </span>
                </button>
                {expanded &&
                  children.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => pickGroup({ kind: "cat", id: sub.id, label: sub.name })}
                      className={subCls(group.kind === "cat" && group.id === sub.id)}
                    >
                      {sub.name.replace(/^(定量|散称)/, "")}
                    </button>
                  ))}
              </div>
            );
          })}
        </aside>

        {/* 右侧：排序条固定 + 商品列表独立滚动 + 分页固定 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b bg-white px-3 py-2 text-[13px]">
            <SortBtn label="销量" active={sort === "sale"} onClick={() => setSort("sale")} />
            <SortBtn label="价格" active={sort === "price_asc" || sort === "price_desc"} onClick={() => setSort((s) => (s === "price_asc" ? "price_desc" : "price_asc"))} arrow={sort === "price_asc" ? "up" : sort === "price_desc" ? "down" : undefined} />
            <SortBtn label="门店库存" active={sort === "stock"} onClick={() => setSort("stock")} />
            <SortBtn label="上架时间" active={sort === "new"} onClick={() => setSort("new")} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="divide-y bg-white">
              {list.isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="m-3 h-36 rounded-2xl" />)}
              {!list.isLoading && items.length === 0 && (
                <div className="px-4 py-16 text-center text-sm text-slate-400">该分组暂无商品</div>
              )}
              {items.map((item) => (
                <ProductCard key={item.id} item={item} refKeys={refKeys} onAdd={() => cart.add(item)} />
              ))}
            </div>
          </div>

          {/* 分页（固定底部） */}
          <div className="flex shrink-0 items-center justify-between border-t bg-white px-4 py-2.5">
            <span className="text-xs text-slate-400">
              {group.label} · {group.kind === "new" ? `${items.length} 种（本页）` : `共 ${total.toLocaleString()} 种`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page <= 1 || list.isFetching} onClick={() => setPage((p) => p - 1)}>上一页</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={page >= totalPages || list.isFetching} onClick={() => setPage((p) => p + 1)}>下一页</Button>
            </div>
          </div>
        </div>
      </div>

      {/* 采购车悬浮入口（移动端，底部导航之上） */}
      {cart.count > 0 && (
        <button
          onClick={() => navigate("/m/order/cart")}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 md:hidden"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold">{cart.count}</span>
        </button>
      )}

      {/* 参考数据选择（截图2） */}
      <Sheet open={refOpen} onOpenChange={setRefOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-left text-sm text-slate-500">最多展示6个参考数据</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-2 py-4">
            {REF_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleRef(opt.key)}
                className={cn(
                  "relative rounded-xl border px-2 py-3 text-[13px]",
                  refKeys.includes(opt.key) ? "border-blue-500 bg-blue-50 font-semibold text-blue-700" : "bg-white text-slate-400",
                )}
              >
                {opt.label}
                {refKeys.includes(opt.key) && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-500" />}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pb-2">
            <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => setRefKeys([])}>
              <X className="mr-1 h-4 w-4" />重置
            </Button>
            <Button className="h-11 flex-[2] rounded-xl bg-blue-600 hover:bg-blue-700" onClick={() => setRefOpen(false)}>确定</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function sideCls(active: boolean) {
  return cn(
    "flex w-full flex-col items-center justify-center gap-0.5 border-l-2 px-1 py-3 text-[12px] leading-tight",
    active ? "border-blue-600 bg-white font-semibold text-blue-700" : "border-transparent text-slate-500",
  );
}

function subCls(active: boolean) {
  return cn(
    "flex w-full items-center justify-center border-l-2 py-2.5 pl-3 pr-1 text-[12px] leading-tight",
    active ? "border-blue-600 bg-white font-semibold text-blue-700" : "border-transparent text-slate-400",
  );
}

function SortBtn({ label, active, onClick, arrow }: { label: string; active: boolean; onClick: () => void; arrow?: "up" | "down" }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-0.5", active ? "font-semibold text-blue-700" : "text-slate-500")}>
      {label}
      {arrow === "up" ? (
        <ArrowUp className="h-3 w-3 text-blue-600" />
      ) : arrow === "down" ? (
        <ArrowDown className="h-3 w-3 text-blue-600" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-slate-300" />
      )}
    </button>
  );
}

function ProductCard({ item, refKeys, onAdd }: { item: CatalogItem; refKeys: string[]; onAdd: () => void }) {
  const cart = useCart();
  const line = cart.lines.find((l) => l.item.id === item.id);
  const price = cart.unitPrice(item);
  const isNew = (item.days ?? 9999) <= 30;
  const split = (item.delivery_ratio ?? 1) > 1;

  return (
    <div className="flex gap-3 px-3 py-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {item.default_image_url ? (
          <img src={item.default_image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1">
          {isNew && <Badge className="h-4 shrink-0 bg-emerald-500 px-1 text-[9px] hover:bg-emerald-500">30天新品</Badge>}
          <ItemKindBadge item={item} />
          <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-slate-900">{item.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1">
          {split && <Badge variant="outline" className="h-4 border-orange-300 px-1 text-[9px] text-orange-500">拆零</Badge>}
          {item.must_sell ? <Badge variant="outline" className="h-4 border-rose-300 px-1 text-[9px] text-rose-500">必卖</Badge> : null}
        </div>
        <div className="mt-1 font-mono text-[11px] text-slate-400">条码：{item.bar_code || "-"}</div>
        <div className="font-mono text-[11px] text-slate-400">规格：{item.purchase_spec || "-"}</div>
        <div className="mt-1 flex items-end justify-between">
          <span className="text-[17px] font-black text-rose-600">
            ¥{price.toFixed(2)}
            <span className="text-[11px] font-normal text-slate-400"> /{item.delivery_unit || item.unit || "个"}</span>
          </span>
          {line ? (
            <div className="flex items-center gap-2 rounded-full border border-blue-200 px-1 py-0.5">
              <button onClick={() => cart.setQty(item.id, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-blue-600 active:bg-blue-50">−</button>
              <span className="min-w-6 text-center text-sm font-bold">{line.quantity}</span>
              <button onClick={() => cart.setQty(item.id, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white active:bg-blue-700">+</button>
            </div>
          ) : (
            <button onClick={onAdd} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/30 active:bg-blue-700">
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
        {/* 参考数据 */}
        {refKeys.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-xl bg-slate-50 p-2 text-[11px] text-slate-500">
            {refKeys.map((key) => (
              <div key={key}>
                {REF_OPTIONS.find((o) => o.key === key)?.label}{" "}
                <span className="font-medium text-slate-700">{refValue(item, key)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function refValue(item: CatalogItem, key: string): string {
  // 库存/均销/今日销量按最小销售单位（基本单位）展示；在途按配送单位
  if (key === "stock_quantity") {
    const v = item.basic_stock_quantity ?? item.stock_quantity;
    return v === null || v === undefined ? "--" : `${fmtQty(v)}${item.unit ?? ""}`;
  }
  if (key === "daily_sale_quantity" || key === "today_sale_quantity") {
    const v = (item as unknown as Record<string, unknown>)[key];
    return v === null || v === undefined ? "--" : `${fmtQty(v)}${item.unit ?? ""}`;
  }
  if (key === "on_way_quantity" || key === "on_order_quantity") {
    const v = (item as unknown as Record<string, unknown>)[key];
    return v === null || v === undefined ? "--" : `${fmtQty(v)}${item.delivery_unit ?? item.stock_unit ?? ""}`;
  }
  const v = (item as unknown as Record<string, unknown>)[key];
  if (v === null || v === undefined || v === "") return "--";
  if (key === "sale_price") return `¥${Number(v).toFixed(2)}`;
  if (key === "gross_profit_rate") return `${v}%`;
  if (key === "volume") return `${v}mm³`;
  return String(v);
}

function fmtQty(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n % 1 === 0 ? String(n) : String(Math.round(n * 1000) / 1000);
}
