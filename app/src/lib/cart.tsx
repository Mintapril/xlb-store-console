import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** 目录商品快照（仅下单所需字段） */
export type CatalogItem = {
  id: number;
  code: string;
  bar_code?: string | null;
  name: string;
  unit?: string | null;
  delivery_unit?: string | null;
  delivery_ratio?: number | null;
  basic_price?: number | null;
  sale_price?: number | null;
  purchase_spec?: string | null;
  default_image_url?: string | null;
  period?: string | null;
  daily_sale_quantity?: number | null;
  stock_quantity?: number | null;
  basic_stock_quantity?: number | null;
  stock_unit?: string | null;
  on_way_quantity?: number | null;
  on_order_quantity?: number | null;
  today_sale_quantity?: number | null;
  must_sell?: boolean | null;
  end_cap?: boolean | null;
  days?: number | null;
  item_type?: string | null;
  weigh?: boolean | null;
  volume?: number | null;
  logistics_fee?: number | null;
};

export type CartLine = { item: CatalogItem; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  memo: string;
  setMemo: (v: string) => void;
  add: (item: CatalogItem, qty?: number) => void;
  setQty: (itemId: number, qty: number) => void;
  remove: (itemId: number) => void;
  clear: () => void;
  count: number;
  totalMoney: number;
  totalVolume: number;
  totalLogistics: number;
  unitPrice: (item: CatalogItem) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "xlb_order_cart_v1";

export function unitPriceOf(item: CatalogItem) {
  const ratio = item.delivery_ratio && item.delivery_ratio > 0 ? item.delivery_ratio : 1;
  return Math.round((item.basic_price ?? 0) * ratio * 100) / 100;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return (JSON.parse(raw) as { lines?: CartLine[] }).lines ?? [];
    } catch { /* ignore */ }
    return [];
  });
  const [memo, setMemo] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return (JSON.parse(raw) as { memo?: string }).memo ?? "";
    } catch { /* ignore */ }
    return "";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, memo }));
    } catch { /* ignore */ }
  }, [lines, memo]);

  const value = useMemo<CartContextValue>(() => {
    const add = (item: CatalogItem, qty = 1) => {
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.item.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        }
        return [...prev, { item, quantity: qty }];
      });
    };
    const setQty = (itemId: number, qty: number) => {
      setLines((prev) =>
        qty <= 0 ? prev.filter((l) => l.item.id !== itemId) : prev.map((l) => (l.item.id === itemId ? { ...l, quantity: qty } : l)),
      );
    };
    const remove = (itemId: number) => setLines((prev) => prev.filter((l) => l.item.id !== itemId));
    const clear = () => { setLines([]); setMemo(""); };
    const totalMoney = lines.reduce((acc, l) => acc + unitPriceOf(l.item) * l.quantity, 0);
    const totalVolume = lines.reduce((acc, l) => acc + (Number(l.item.volume) || 0) * l.quantity, 0) / 1e6;
    const totalLogistics = lines.reduce((acc, l) => acc + (Number(l.item.logistics_fee) || 0) * l.quantity, 0);
    return {
      lines, memo, setMemo, add, setQty, remove, clear,
      count: lines.length,
      totalMoney: Math.round(totalMoney * 100) / 100,
      totalVolume: Math.round(totalVolume * 1e4) / 1e4,
      totalLogistics: Math.round(totalLogistics * 100) / 100,
      unitPrice: unitPriceOf,
    };
  }, [lines, memo]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
