import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { AlertOctagon, BarChart3, Boxes, Clock3, ClipboardList, Grid3X3, Landmark, LayoutDashboard, LogOut, Menu, ScrollText, ShoppingCart, Store, Tag, TrendingDown, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { APP_SHORT_NAME } from "@/const";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { defaultPath, findMenuByPath, menuGroups, pathOf, type MenuItem } from "@/lib/registry";
import { trpc } from "@/providers/trpc";
import DashboardPage from "@/pages/DashboardPage";
import EntityPage from "@/pages/EntityPage";
import InventoryPage, { PricePage } from "@/pages/InventoryPage";
import CatalogPage from "@/pages/order/CatalogPage";
import CartPage from "@/pages/order/CartPage";
import OrderListPage from "@/pages/order/OrderListPage";
import MonthBillsPage from "@/pages/MonthBillsPage";
import ReplenishmentPage from "@/pages/smart/ReplenishmentPage";
import ExpiryPage from "@/pages/smart/ExpiryPage";
import StockDiffPage from "@/pages/smart/StockDiffPage";
import SalesBoardPage from "@/pages/SalesBoardPage";

function itemIcon(item?: MenuItem) {
  if (!item) return ScrollText;
  if (item.kind === "dashboard") return LayoutDashboard;
  if (item.kind === "inventory") return Boxes;
  if (item.kind === "price") return Tag;
  if (item.kind === "catalog") return Grid3X3;
  if (item.kind === "cart") return ShoppingCart;
  if (item.kind === "bills") return Landmark;
  if (item.kind === "replenishment") return TrendingDown;
  if (item.kind === "expiry") return Clock3;
  if (item.kind === "sales") return BarChart3;
  if (item.kind === "stockdiff") return AlertOctagon;
  if (item.entity === "requestOrder") return ClipboardList;
  return ScrollText;
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { count: cartCount } = useCart();
  const me = trpc.auth.me.useQuery(undefined, { retry: false });
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("已退出登录");
      navigate("/login", { replace: true });
    },
  });

  useEffect(() => {
    if (me.error) navigate("/login", { replace: true });
  }, [me.error, navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (me.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef3fb]">
        <div className="rounded-3xl border bg-white px-8 py-6 text-sm text-slate-500 shadow-sm">正在恢复会话...</div>
      </div>
    );
  }
  if (me.error) return <Navigate to="/login" replace />;

  const currentItem = findMenuByPath(location.pathname);
  const CurrentIcon = itemIcon(currentItem);

  const menuContent = (
    <div className="space-y-5">
      {menuGroups.map((group) => (
        <div key={group.label}>
          <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</div>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = itemIcon(item);
              const active = pathOf(item) === location.pathname;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(pathOf(item))}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition md:py-2.5",
                    active ? "bg-blue-600 font-semibold text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef3fb] text-slate-900">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40 border-b border-blue-500/20 bg-[linear-gradient(90deg,#1d4ed8,#2563eb_48%,#0ea5e9)] text-white shadow-[0_10px_30px_-18px_rgba(37,99,235,0.8)]">
        <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-4">
          <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10 md:hidden" aria-label="打开菜单">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate(defaultPath)} className="flex items-center gap-2 rounded-xl px-1.5 py-1 font-black tracking-tight hover:bg-white/10 md:px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-700"><Store className="h-4 w-4" /></span>
            <span className="hidden sm:inline">{APP_SHORT_NAME}</span>
          </button>
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-white/12 px-2.5 py-1.5 text-sm">
            <CurrentIcon className="h-4 w-4 shrink-0" />
            <span className="truncate font-semibold">{currentItem?.label ?? "经营看板"}</span>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="hidden text-right leading-tight sm:block">
              <div className="max-w-[220px] truncate text-sm font-semibold">{me.data?.storeName}</div>
              <div className="text-[11px] text-blue-100">{me.data?.companyName}</div>
            </div>
            <Badge variant="secondary" className="hidden rounded-lg bg-white/15 text-white hover:bg-white/15 md:inline-flex">{me.data?.role || "门店"}</Badge>
            <button
              onClick={() => logout.mutate()}
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
              aria-label="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* 桌面侧边栏 */}
        <aside className="hidden w-[230px] shrink-0 border-r bg-white/88 backdrop-blur md:block">
          <div className="flex h-12 items-center justify-between px-4">
            <div className="text-sm font-bold text-slate-900">业务菜单</div>
            <Badge variant="secondary" className="rounded-lg">门店端</Badge>
          </div>
          <Separator />
          <div className="h-[calc(100vh-104px)] overflow-y-auto p-3">{menuContent}</div>
        </aside>

        {/* 内容区：移动端留出底部导航高度 */}
        <main className="min-w-0 flex-1 pb-20 md:pb-6">
          <div className="p-3 md:p-4 lg:p-6">
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="price" element={<PricePage />} />
              <Route path="order/catalog" element={<CatalogPage />} />
              <Route path="order/cart" element={<CartPage />} />
              <Route path="order/list" element={<OrderListPage />} />
              <Route path="bills" element={<MonthBillsPage />} />
              <Route path="smart/replenishment" element={<ReplenishmentPage />} />
              <Route path="smart/expiry" element={<ExpiryPage />} />
              <Route path="smart/stockdiff" element={<StockDiffPage />} />
              <Route path="sales" element={<SalesBoardPage />} />
              <Route path="doc/:entityKey" element={<EntityPageWrapper />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* 移动端底部导航 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.3)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          <BottomTab label="看板" icon={LayoutDashboard} active={location.pathname === "/m/dashboard"} onClick={() => navigate("/m/dashboard")} />
          <BottomTab label="分类" icon={Grid3X3} active={location.pathname === "/m/order/catalog"} onClick={() => navigate("/m/order/catalog")} />
          <BottomTab label="采购车" icon={ShoppingCart} active={location.pathname === "/m/order/cart"} onClick={() => navigate("/m/order/cart")} badge={cartCount || undefined} />
          <BottomTab label="订单" icon={ScrollText} active={location.pathname === "/m/order/list"} onClick={() => navigate("/m/order/list")} />
          <BottomTab label="菜单" icon={Menu} active={menuOpen} onClick={() => setMenuOpen(true)} />
        </div>
      </nav>

      {/* 移动端菜单抽屉 */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto p-4">
          <SheetHeader className="pb-3 text-left">
            <SheetTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white"><Store className="h-4 w-4" /></span>
              {APP_SHORT_NAME}·门店端
            </SheetTitle>
          </SheetHeader>
          <div className="mb-4 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserRound className="h-4 w-4 text-slate-400" />
              {me.data?.displayName}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {me.data?.storeName} · {me.data?.role}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">机构 {me.data?.orgCode} · 账号 {me.data?.account}</div>
          </div>
          {menuContent}
          <button
            onClick={() => logout.mutate()}
            className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> 退出登录
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function BottomTab({ label, icon: Icon, active, onClick, badge }: { label: string; icon: typeof Menu; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={cn("relative flex flex-col items-center gap-0.5 py-2", active ? "text-blue-600" : "text-slate-400")}>
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badge ? (
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{badge > 99 ? "99+" : badge}</span>
        ) : null}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

import { useParams } from "react-router";
function EntityPageWrapper() {
  const { entityKey } = useParams();
  return <EntityPage entityKey={entityKey ?? ""} />;
}
