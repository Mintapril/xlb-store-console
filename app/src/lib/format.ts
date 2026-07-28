export function money(value: unknown) {
  const n = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "¥0.00";
  return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function num(value: unknown) {
  const n = Number(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

export function dateText(value: unknown) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

export function getPathValue(obj: unknown, path: string) {
  let current: any = obj;
  for (const part of path.split(".")) {
    current = current?.[part];
  }
  return current;
}

/** 真实系统状态码 → 中文 */
const STATE_LABELS: Record<string, string> = {
  INIT: "初始",
  AUDIT: "已审核",
  PENDING: "审核中",
  PAID: "待支付",
  EXPIRE: "已失效",
  INVALID: "已作废",
  FINISH: "已完成",
  CONFIRM: "已确认",
  PART: "部分完成",
  ALLIN: "全部入库",
  PARTIN: "部分入库",
  NOTIN: "未入库",
  ALLPAY: "已结清",
  PARTPAY: "部分结算",
  NOPAY: "未结算",
  SUPPLIER_CONFIRM: "供应商已确认",
  STORE_CONFIRM: "门店已确认",
  STOREHOUSE_DELIVERY: "统仓配送",
  DIRECT_SUPPLY: "直供",
  DIRECT_SUPPLY_CAR_SALE: "直供车销",
  MANUAL_FORCE_DELIVERY: "手工强制配送",
  REQUEST: "要货",
  MAKEBILL: "组合商品",
  STANDARD: "标准商品",
  COMPONENT: "组件商品",
  COLLECTIVE_PURCHASE: "集采",
  DIRECT_ADD: "手工新增",
  NORMAL: "普通",
  ITEM: "按商品",
  STORE: "按门店",
  CATEGORY: "按品类",
};

export function stateLabel(value: unknown) {
  if (value === undefined || value === null || value === "") return "-";
  const raw = String(value);
  return STATE_LABELS[raw] ?? raw;
}

export function stateTone(state: string) {
  if (["AUDIT", "FINISH", "CONFIRM", "ALLIN", "ALLPAY", "SUPPLIER_CONFIRM", "STORE_CONFIRM"].includes(state)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (["INVALID"].includes(state)) {
    return "bg-slate-100 text-slate-500 ring-slate-200 line-through";
  }
  if (["INIT", "PART", "PARTIN", "PARTPAY", "NOTIN", "NOPAY"].includes(state)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}
