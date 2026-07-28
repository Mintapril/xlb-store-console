export type ColumnDef = {
  key: string;
  label: string;
  kind?: "text" | "status" | "amount" | "date" | "qty" | "statestr";
};

export type ActionDef = {
  label: string;
  action: "audit" | "reaudit" | "invalid" | "finish" | "lock" | "unlock" | "reverse" | "confirm";
  critical?: boolean;
  variant?: "default" | "secondary" | "outline" | "destructive";
  when?: string[];
  hint?: string;
};

export type EntityDef = {
  key: string;
  label: string;
  description: string;
  fidHint: string;
  columns: ColumnDef[];
  detailFields: ColumnDef[];
  detailColumns: ColumnDef[];
  states: string[];
  actions: ActionDef[];
};

const docDetailColumns: ColumnDef[] = [
  { key: "item_code", label: "商品代码" },
  { key: "item_name", label: "商品名称" },
  { key: "unit", label: "单位" },
  { key: "quantity", label: "数量", kind: "qty" },
  { key: "price", label: "单价", kind: "amount" },
  { key: "money", label: "金额", kind: "amount" },
];

const receiveDetailColumns: ColumnDef[] = [
  { key: "item_code", label: "商品代码" },
  { key: "item_name", label: "商品名称" },
  { key: "unit", label: "单位" },
  { key: "quantity", label: "数量", kind: "qty" },
  { key: "receive_quantity", label: "实收", kind: "qty" },
  { key: "money", label: "金额", kind: "amount" },
];

export const entities: Record<string, EntityDef> = {
  storeOrder: {
    key: "storeOrder",
    label: "门店订单",
    description: "门店向中心仓/供应商发起的要货订单（真实系统数据）。",
    fidHint: "DD…",
    columns: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "type", label: "类型", kind: "statestr" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项", kind: "qty" },
      { key: "confirm_state", label: "确认状态", kind: "statestr" },
      { key: "create_time", label: "创建时间", kind: "date" },
    ],
    detailFields: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "type", label: "订单类型", kind: "statestr" },
      { key: "store_name", label: "门店" },
      { key: "org_name", label: "配送组织" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项数", kind: "qty" },
      { key: "confirm_state", label: "确认状态", kind: "statestr" },
      { key: "estimated_arrival_date", label: "预计到货", kind: "date" },
      { key: "memo", label: "备注" },
      { key: "create_by", label: "创建人" },
      { key: "create_time", label: "创建时间" },
      { key: "audit_by", label: "审核人" },
      { key: "audit_time", label: "审核时间" },
    ],
    detailColumns: [
      { key: "item_code", label: "商品代码" },
      { key: "item_name", label: "商品名称" },
      { key: "unit", label: "单位" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "delivery_price", label: "配送价", kind: "amount" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "delivery_quantity", label: "已配送", kind: "qty" },
      { key: "receive_quantity", label: "已收货", kind: "qty" },
    ],
    states: ["INIT", "PENDING", "AUDIT", "PAID", "INVALID"],
    actions: [
      { label: "审核", action: "audit", critical: true, when: ["INIT", "PENDING"], hint: "审核后订单生效并进入配送流程" },
      { label: "作废", action: "invalid", variant: "destructive", critical: true, when: ["AUDIT"], hint: "仅未确认实收的已审核订单可作废" },
    ],
  },
  requestOrder: {
    key: "requestOrder",
    label: "要货单",
    description: "门店叫货/补货申请单（真实系统数据）。",
    fidHint: "YH…",
    columns: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "order_type_str", label: "类型" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "actual_quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项", kind: "qty" },
      { key: "delivery_state_str", label: "配送状态" },
      { key: "delivery_date", label: "要求到货", kind: "date" },
    ],
    detailFields: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "order_type_str", label: "类型" },
      { key: "store_name", label: "门店" },
      { key: "out_store_name", label: "出货仓" },
      { key: "storehouse_name", label: "出货仓库" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "actual_quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项数", kind: "qty" },
      { key: "delivery_state_str", label: "配送状态" },
      { key: "delivery_date", label: "要求到货", kind: "date" },
      { key: "valid_date", label: "有效期至", kind: "date" },
      { key: "create_by", label: "创建人" },
      { key: "create_time", label: "创建时间" },
      { key: "audit_by", label: "审核人" },
    ],
    detailColumns: docDetailColumns,
    states: ["INIT", "AUDIT", "INVALID"],
    actions: [
      { label: "审核", action: "audit", critical: true, when: ["INIT"], hint: "审核后进入配送流程" },
      { label: "作废", action: "invalid", variant: "destructive", critical: true, when: ["INIT"], hint: "作废后不可恢复" },
    ],
  },
  deliveryOut: {
    key: "deliveryOut",
    label: "配送出库单",
    description: "中心仓向门店配送的出库单据（真实系统数据）。",
    fidHint: "MO…",
    columns: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "in_state", label: "入库状态", kind: "statestr" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项", kind: "qty" },
      { key: "operate_date", label: "业务日期", kind: "date" },
      { key: "receive_time", label: "收货时间" },
    ],
    detailFields: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "in_state", label: "入库状态", kind: "statestr" },
      { key: "store_name", label: "门店" },
      { key: "storehouse_name", label: "入库仓" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项数", kind: "qty" },
      { key: "operate_date", label: "业务日期", kind: "date" },
      { key: "receive_time", label: "收货时间" },
      { key: "memo", label: "备注" },
    ],
    detailColumns: receiveDetailColumns,
    states: ["INIT", "AUDIT", "INVALID"],
    actions: [
      { label: "审核", action: "audit", critical: true, when: ["INIT"], hint: "确认出库" },
      { label: "反审核", action: "reaudit", variant: "outline", critical: true, when: ["AUDIT"], hint: "回退出库确认" },
    ],
  },
  receiveOrder: {
    key: "receiveOrder",
    label: "门店收货单",
    description: "门店到货验收/采购收货单据（真实系统数据）。",
    fidHint: "PI…",
    columns: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "supplier_name", label: "供应商/来货单位" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项", kind: "qty" },
      { key: "settlement_state", label: "结算状态", kind: "statestr" },
      { key: "operate_date", label: "业务日期", kind: "date" },
    ],
    detailFields: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "supplier_name", label: "供应商/来货单位" },
      { key: "org_name", label: "组织" },
      { key: "storehouse_name", label: "收货仓" },
      { key: "money", label: "金额", kind: "amount" },
      { key: "no_tax_money", label: "不含税金额", kind: "amount" },
      { key: "quantity", label: "数量", kind: "qty" },
      { key: "item_count", label: "品项数", kind: "qty" },
      { key: "settlement_state", label: "结算状态", kind: "statestr" },
      { key: "purchase_order_fid", label: "来源采购单" },
      { key: "memo", label: "备注" },
      { key: "operate_date", label: "业务日期", kind: "date" },
      { key: "create_by", label: "创建人" },
      { key: "create_time", label: "创建时间" },
      { key: "audit_by", label: "审核人" },
      { key: "audit_time", label: "审核时间" },
    ],
    detailColumns: receiveDetailColumns,
    states: ["INIT", "AUDIT", "INVALID"],
    actions: [
      { label: "审核", action: "audit", critical: true, when: ["INIT"], hint: "确认收货并记账" },
      { label: "红冲", action: "reverse", variant: "destructive", critical: true, when: ["AUDIT"], hint: "对已审核单据做红字冲销" },
    ],
  },
  stockCount: {
    key: "stockCount",
    label: "库存盘点单",
    description: "门店周期盘点与差异处理（真实系统数据）。",
    fidHint: "CR…",
    columns: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "check_type", label: "盘点类型", kind: "statestr" },
      { key: "storehouse_name", label: "仓库" },
      { key: "item_count", label: "品项", kind: "qty" },
      { key: "basic_quantity", label: "差异数量", kind: "qty" },
      { key: "diff_money", label: "差异金额", kind: "amount" },
      { key: "operate_date", label: "盘点时间" },
    ],
    detailFields: [
      { key: "fid", label: "单号" },
      { key: "state", label: "状态", kind: "status" },
      { key: "check_type", label: "盘点类型", kind: "statestr" },
      { key: "storehouse_name", label: "仓库" },
      { key: "item_count", label: "品项数", kind: "qty" },
      { key: "basic_quantity", label: "差异数量", kind: "qty" },
      { key: "diff_money", label: "差异金额", kind: "amount" },
      { key: "money", label: "账面金额", kind: "amount" },
      { key: "memo", label: "备注" },
      { key: "operate_date", label: "盘点时间" },
      { key: "create_by", label: "创建人" },
      { key: "create_time", label: "创建时间" },
      { key: "audit_time", label: "审核时间" },
    ],
    detailColumns: [
      { key: "item_code", label: "商品代码" },
      { key: "item_name", label: "商品名称" },
      { key: "unit", label: "单位" },
      { key: "stock_quantity", label: "账面数", kind: "qty" },
      { key: "quantity", label: "实盘数", kind: "qty" },
      { key: "diff_quantity", label: "差异", kind: "qty" },
      { key: "diff_money", label: "差异额", kind: "amount" },
    ],
    states: ["INIT", "FINISH", "AUDIT", "INVALID"],
    actions: [
      { label: "完成盘点", action: "finish", critical: true, when: ["INIT"], hint: "结束录入并锁定盘点结果" },
      { label: "审核", action: "audit", critical: true, when: ["FINISH"], hint: "审核后按差异调整库存" },
      { label: "反审核", action: "reaudit", variant: "outline", critical: true, when: ["AUDIT"], hint: "回退审核，盘点差异将回滚" },
      { label: "作废", action: "invalid", variant: "destructive", critical: true, when: ["INIT"], hint: "作废后不可恢复" },
    ],
  },
};

export type MenuItem = {
  key: string;
  label: string;
  kind: "dashboard" | "entity" | "inventory" | "price" | "catalog" | "cart" | "orders" | "bills" | "replenishment" | "expiry" | "sales" | "stockdiff";
  entity?: string;
  badge?: string;
};

export type MenuGroup = { label: string; items: MenuItem[] };

const entityItem = (key: string, badge?: string): MenuItem => ({
  key,
  label: entities[key].label,
  kind: "entity",
  entity: key,
  badge,
});

export const menuGroups: MenuGroup[] = [
  {
    label: "总览",
    items: [
      { key: "dashboard", label: "经营看板", kind: "dashboard" },
      { key: "sales", label: "销售看板", kind: "sales" },
    ],
  },
  {
    label: "门店订货",
    items: [
      { key: "catalog", label: "分类选品", kind: "catalog" },
      { key: "cart", label: "采购车", kind: "cart" },
      { key: "orders", label: "门店订单", kind: "orders" },
    ],
  },
  {
    label: "订货配送",
    items: [entityItem("requestOrder"), entityItem("deliveryOut"), entityItem("receiveOrder")],
  },
  {
    label: "库存管理",
    items: [{ key: "inventory", label: "库存查询", kind: "inventory" }, entityItem("stockCount")],
  },
  {
    label: "商品",
    items: [{ key: "price", label: "商品价格查询", kind: "price" }],
  },
  {
    label: "资金",
    items: [{ key: "bills", label: "月度对账单", kind: "bills" }],
  },
  {
    label: "智能助手",
    items: [
      { key: "replenishment", label: "智能补货建议", kind: "replenishment" },
      { key: "expiry", label: "效期预警", kind: "expiry" },
      { key: "stockdiff", label: "库存差异识别", kind: "stockdiff" },
    ],
  },
];

export const defaultPath = "/m/dashboard";

export function pathOf(item: MenuItem) {
  if (item.kind === "entity") return `/m/doc/${item.entity}`;
  if (item.kind === "catalog") return "/m/order/catalog";
  if (item.kind === "cart") return "/m/order/cart";
  if (item.kind === "orders") return "/m/order/list";
  if (item.kind === "bills") return "/m/bills";
  if (item.kind === "replenishment") return "/m/smart/replenishment";
  if (item.kind === "expiry") return "/m/smart/expiry";
  if (item.kind === "sales") return "/m/sales";
  if (item.kind === "stockdiff") return "/m/smart/stockdiff";
  return `/m/${item.kind}`;
}

export function findMenuByPath(path: string): MenuItem | undefined {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (pathOf(item) === path) return item;
    }
  }
  return undefined;
}
