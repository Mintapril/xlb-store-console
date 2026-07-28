import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { requireSession, writeSession } from "./session";
import { xlbCall, XlbError, type XlbPage, type XlbSession } from "./xlb/client";
import type { TrpcContext } from "./context";

/** 单据实体 → 真实 RPC 端点映射（见 API 文档第 5/6 章） */
const DOC_ENTITIES: Record<string, { base: string; label: string }> = {
  storeOrder: { base: "/erp/hxl.erp.storeorder", label: "门店订单" },
  requestOrder: { base: "/erp/hxl.erp.requestorder", label: "要货单" },
  deliveryOut: { base: "/erp/hxl.erp.deliveryoutorder", label: "配送出库单" },
  receiveOrder: { base: "/erp/hxl.erp.receiveorder", label: "门店收货单" },
  stockCount: { base: "/erp-stock/hxl.erp.stockcheckorder", label: "库存盘点单" },
};

/**
 * 写动作 → RPC 后缀（按实体区分；实测探测结果）：
 * - storeOrder: 支持 audit/invalid/confirm，无 reaudit
 * - deliveryOut/receiveOrder: 反审核为 tmp.reaudit
 * - stockCount: 支持 audit/reaudit/invalid/finish/lock/unlock
 */
function actionSuffix(entity: string, action: string): string {
  if (action === "reaudit") {
    if (entity === "deliveryOut" || entity === "receiveOrder") return "tmp.reaudit";
    if (entity === "storeOrder" || entity === "requestOrder") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "该单据类型不支持反审核" });
    }
  }
  if (action === "delete") {
    // 制单（INIT）只能删除，不能作废（网页版逻辑一致）
    return "batchdelete";
  }
  const map: Record<string, string> = {
    audit: "audit",
    reaudit: "reaudit",
    invalid: "invalid",
    finish: "finish",
    lock: "lock",
    unlock: "unlock",
    reverse: "reverse",
    confirm: "confirm",
  };
  return map[action] ?? action;
}

async function callBiz<T>(
  ctx: TrpcContext,
  endpoint: string,
  params: Record<string, unknown>,
): Promise<T> {
  const session = requireSession(ctx);
  try {
    const { data, session: refreshed } = await xlbCall<T>(session, endpoint, params);
    if (refreshed.erpAccessToken !== session.erpAccessToken) writeSession(ctx, refreshed);
    return data;
  } catch (error) {
    if (error instanceof XlbError) {
      if (error.code === 2005 || error.code === 1005) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "登录已过期，请重新登录" });
      }
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "业务网关异常，请稍后重试" });
  }
}

const pageInput = z.object({
  entity: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
  state: z.string().optional(),
  keyword: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

function pageParams(input: z.infer<typeof pageInput>) {
  const params: Record<string, unknown> = {
    page_number: input.page,
    page_size: input.pageSize,
  };
  if (input.state && input.state !== "全部") params.state = input.state;
  const keyword = input.keyword?.trim();
  if (keyword) {
    // 完整单号走 fid 精确匹配（实测模糊 keyword 对单据接口无效）；
    // 非单号关键字仅对库存/商品接口有效，单据接口会忽略。
    if (/^[A-Za-z]{2}\d{6,}$/.test(keyword)) params.fid = keyword;
    else params.keyword = keyword;
  }
  if (input.dateFrom) params.create_time_start = `${input.dateFrom} 00:00:00`;
  if (input.dateTo) params.create_time_end = `${input.dateTo} 23:59:59`;
  return params;
}

export const bizRouter = createRouter({
  /** 单据分页（真实） */
  docList: publicQuery.input(pageInput).query(async ({ ctx, input }) => {
    const def = DOC_ENTITIES[input.entity];
    if (!def) throw new TRPCError({ code: "BAD_REQUEST", message: "未知单据类型" });
    // 真实接口怪异行为：门店订单 state=INIT（制单）在 page_size>=5 时 content 恒为空，
    // page_size=2 可稳定分页（详见 API 探测记录）。此处按 ps=2 聚合并做内存分页。
    if (input.entity === "storeOrder" && input.state === "INIT") {
      const collected: Record<string, unknown>[] = [];
      const seen = new Set<string>();
      for (let pn = 1; pn <= 10; pn += 1) {
        const page = await callBiz<XlbPage>(ctx, `${def.base}.page`, {
          ...pageParams(input),
          page_number: pn,
          page_size: 2,
        });
        const rows = page.content ?? [];
        if (rows.length === 0) break;
        for (const row of rows) {
          const fid = String((row as Record<string, unknown>).fid ?? "");
          if (fid && !seen.has(fid)) {
            seen.add(fid);
            collected.push(row as Record<string, unknown>);
          }
        }
        if (rows.length < 2) break;
      }
      const start = (input.page - 1) * input.pageSize;
      return {
        items: collected.slice(start, start + input.pageSize),
        total: collected.length,
        totalPages: Math.max(1, Math.ceil(collected.length / input.pageSize)),
        page: input.page,
        pageSize: input.pageSize,
      };
    }
    const page = await callBiz<XlbPage>(ctx, `${def.base}.page`, pageParams(input));
    return {
      items: page.content ?? [],
      total: page.total_elements ?? 0,
      totalPages: page.total_pages ?? 0,
      page: (page.number ?? 0) + 1,
      pageSize: page.size ?? input.pageSize,
    };
  }),

  /** 单据详情（真实，含 details[] 明细） */
  docDetail: publicQuery
    .input(z.object({ entity: z.string().min(1), fid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const def = DOC_ENTITIES[input.entity];
      if (!def) throw new TRPCError({ code: "BAD_REQUEST", message: "未知单据类型" });
      return callBiz<Record<string, unknown>>(ctx, `${def.base}.read`, { fid: input.fid });
    }),

  /**
   * 单据写操作（真实系统生效）：审核 / 反审核 / 作废 / 完成 / 锁库 / 解锁 / 红冲
   * 前端必须二次确认后调用。
   */
  docAction: publicQuery
    .input(
      z.object({
        entity: z.string().min(1),
        action: z.enum(["audit", "reaudit", "invalid", "finish", "lock", "unlock", "reverse", "confirm", "delete"]),
        fid: z.string().min(1),
        memo: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const def = DOC_ENTITIES[input.entity];
      if (!def) throw new TRPCError({ code: "BAD_REQUEST", message: "未知单据类型" });
      const suffix = actionSuffix(input.entity, input.action);
      let params: Record<string, unknown> = { fid: input.fid };
      if (input.action === "delete") {
        // batchdelete: {fids, delete_reason}
        params = { fids: [input.fid], delete_reason: input.memo ?? "" };
      } else if (input.memo) {
        params.audit_memo = input.memo;
        params.invalid_reason = input.memo;
      }
      await callBiz(ctx, `${def.base}.${suffix}`, params);
      return { ok: true };
    }),

  /**
   * 门店订单确认实收（真实 storeorder.confirm）
   * 网页版规则：state=AUDIT 且 confirm_state=SUPPLIER_CONFIRM 时可执行；
   * 整单提交，逐行带 receive_quantity，服务端换算 basic_receive_quantity=ratio×receive_quantity。
   */
  confirmStoreOrder: publicQuery
    .input(
      z.object({
        fid: z.string().min(1),
        lines: z
          .array(
            z.object({
              detail_num: z.number().optional(),
              item_id: z.number(),
              receive_quantity: z.number().min(0),
            }),
          )
          .min(1, "明细不能为空"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await callBiz<Record<string, unknown>>(ctx, "/erp/hxl.erp.storeorder.read", { fid: input.fid });
      if (!order || order.state !== "AUDIT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "仅已审核订单可确认实收" });
      }
      if (order.confirm_state !== "SUPPLIER_CONFIRM") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "仅供应商已确认的直供订单可确认实收" });
      }
      const receiveMap = new Map(input.lines.map((l) => [l.item_id, l.receive_quantity]));
      const details = ((order.details as Record<string, unknown>[]) ?? []).map((d) => {
        const itemId = Number(d.item_id);
        const ratio = Number(d.ratio) || 1;
        const receiveQuantity = receiveMap.has(itemId)
          ? Number(receiveMap.get(itemId))
          : Number(d.receive_quantity ?? d.quantity ?? 0);
        return {
          ...d,
          receive_quantity: receiveQuantity,
          basic_receive_quantity: receiveQuantity * ratio,
        };
      });
      const data = await callBiz<Record<string, unknown>>(ctx, "/erp/hxl.erp.storeorder.confirm", {
        ...order,
        details,
      });
      return data;
    }),

  /** 库存查询（真实批次库存） */
  inventory: publicQuery
    .input(
      z.object({
        keyword: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(10).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params: Record<string, unknown> = { page_number: input.page, page_size: input.pageSize };
      if (input.keyword?.trim()) params.keyword = input.keyword.trim();
      const page = await callBiz<XlbPage>(ctx, "/erp-stock/hxl.erp.stockdetail.page", params);
      return {
        items: page.content ?? [],
        total: page.total_elements ?? 0,
        page: (page.number ?? 0) + 1,
        pageSize: page.size ?? input.pageSize,
      };
    }),

  /** 商品档案/零售价查询（真实） */
  items: publicQuery
    .input(
      z.object({
        keyword: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(10).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params: Record<string, unknown> = { page_number: input.page, page_size: input.pageSize };
      if (input.keyword?.trim()) params.keyword = input.keyword.trim();
      const page = await callBiz<XlbPage>(ctx, "/erp-mdm/hxl.erp.item.page", params);
      return {
        items: page.content ?? [],
        total: page.total_elements ?? 0,
        page: (page.number ?? 0) + 1,
        pageSize: page.size ?? input.pageSize,
      };
    }),

  /** 选品目录（App 门店订货选品，真实） */
  catalog: publicQuery
    .input(
      z.object({
        keyword: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
        mustSell: z.boolean().optional(),
        sort: z.enum(["sale", "price_asc", "price_desc", "stock", "new"]).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params: Record<string, unknown> = {
        page_number: input.page,
        page_size: input.pageSize,
      };
      if (input.keyword?.trim()) params.keyword = input.keyword.trim();
      if (input.categoryIds?.length) params.category_ids = input.categoryIds;
      if (input.mustSell) params.must_sell = true;
      const sortMap: Record<string, { property: string; direction: string }> = {
        sale: { property: "daily_sale_quantity", direction: "DESC" },
        price_asc: { property: "basic_price", direction: "ASC" },
        price_desc: { property: "basic_price", direction: "DESC" },
        stock: { property: "stock_quantity", direction: "DESC" },
        new: { property: "id", direction: "DESC" },
      };
      if (input.sort && sortMap[input.sort]) params.orders = [sortMap[input.sort]];
      const session = requireSession(ctx);
      const page = await callBiz<XlbPage>(ctx, "/erp/hxl.erp.storeorder.item.page", {
        ...params,
        store_id: session.profile.store_id,
      });
      return {
        items: page.content ?? [],
        total: page.total_elements ?? 0,
        page: (page.number ?? 0) + 1,
        pageSize: page.size ?? input.pageSize,
      };
    }),

  /** 订货类目树（真实，平铺含 parent_id/level） */
  categories: publicQuery.query(async ({ ctx }) => {
    const data = await callBiz<Array<Record<string, unknown>>>(ctx, "/erp-mdm/hxl.erp.category.find", {});
    return (data ?? []).filter((c) => c.allow_request === true || c.id === 0);
  }),

  /** 创建门店订单（真实 save，制单状态） */
  createOrder: publicQuery
    .input(
      z.object({
        memo: z.string().optional(),
        details: z
          .array(
            z.object({
              quantity: z.number().positive(),
              item: z.object({
                id: z.number(),
                code: z.string(),
                bar_code: z.string().nullish(),
                name: z.string(),
                unit: z.string().nullish(),
                delivery_unit: z.string().nullish(),
                delivery_ratio: z.number().nullish(),
                basic_price: z.number().nullish(),
              }),
            }),
          )
          .min(1, "请至少添加一个商品"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = requireSession(ctx);
      const round2 = (n: number) => Math.round(n * 100) / 100;
      const details = input.details.map(({ item, quantity }) => {
        const ratio = item.delivery_ratio && item.delivery_ratio > 0 ? item.delivery_ratio : 1;
        const price = round2((item.basic_price ?? 0) * ratio);
        return {
          item_id: item.id,
          item_code: item.code,
          item_bar_code: item.bar_code ?? "",
          item_name: item.name,
          unit: item.delivery_unit || item.unit || "个",
          price,
          ratio,
          basic_unit: item.unit || "个",
          basic_price: item.basic_price ?? 0,
          basic_quantity: quantity * ratio,
          quantity,
          money: round2(quantity * price),
        };
      });
      const data = await callBiz<Record<string, unknown>>(ctx, "/erp/hxl.erp.storeorder.save", {
        store_id: session.profile.store_id,
        type: "STOREHOUSE_DELIVERY",
        memo: input.memo ?? "",
        details,
      });
      return data;
    }),

  /** 更新制单中的门店订单（真实 update） */
  updateOrder: publicQuery
    .input(
      z.object({
        fid: z.string().min(1),
        memo: z.string().optional(),
        details: z
          .array(
            z.object({
              quantity: z.number().positive(),
              item: z.object({
                id: z.number(),
                code: z.string(),
                bar_code: z.string().nullish(),
                name: z.string(),
                unit: z.string().nullish(),
                delivery_unit: z.string().nullish(),
                delivery_ratio: z.number().nullish(),
                basic_price: z.number().nullish(),
              }),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = requireSession(ctx);
      const round2 = (n: number) => Math.round(n * 100) / 100;
      const details = input.details.map(({ item, quantity }) => {
        const ratio = item.delivery_ratio && item.delivery_ratio > 0 ? item.delivery_ratio : 1;
        const price = round2((item.basic_price ?? 0) * ratio);
        return {
          item_id: item.id,
          item_code: item.code,
          item_bar_code: item.bar_code ?? "",
          item_name: item.name,
          unit: item.delivery_unit || item.unit || "个",
          price,
          ratio,
          basic_unit: item.unit || "个",
          basic_price: item.basic_price ?? 0,
          basic_quantity: quantity * ratio,
          quantity,
          money: round2(quantity * price),
        };
      });
      const data = await callBiz<Record<string, unknown>>(ctx, "/erp/hxl.erp.storeorder.update", {
        store_id: session.profile.store_id,
        fid: input.fid,
        memo: input.memo ?? "",
        details,
      });
      return data;
    }),

  /** 月度对账单（BMS 资金分账，需相应角色权限） */
  monthBills: publicQuery
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(50).default(10),
        year: z.number().int().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const params: Record<string, unknown> = { page_number: input.page, page_size: input.pageSize };
      if (input.year) params.statistical_year = input.year;
      const page = await callBiz<XlbPage>(ctx, "/bms/bms.monthbill.page", params);
      return {
        items: page.content ?? [],
        total: page.total_elements ?? 0,
        page: (page.number ?? 0) + 1,
        pageSize: page.size ?? input.pageSize,
      };
    }),

  /** 月度对账单签名确认（写操作，前端二次确认后调用） */
  signMonthBill: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await callBiz(ctx, "/bms/bms.monthbill.batch.audit", { ids: [input.id] });
      return { ok: true };
    }),

  /**
   * 智能补货建议（原版没有的增值功能）
   * 规则：可售天数 = (基本库存 + 在途×配送比) / 14日均销；
   * 可售天数 < 覆盖天数 → 建议补货，建议量按配送倍数/起订量/上限取整。
   * 异常识别：
   *  - 负库存 → 账面异常（不建议按账面补货，应先盘点/核对），单独归类不参与建议
   *  - 可售天数 > 60 天 → 库存积压（超大库存），单独归类
   *  - 制单组合（MAKEBILL）库存为组合口径非单品口径，且不在门店订货目录，标注但不参与计算
   *  - 多规格（MULTIPLESPEC/MAINSPEC）统一按基本单位计算并展示配送单位换算
   */
  replenishment: publicQuery
    .input(
      z.object({
        cycleDays: z.number().min(1).max(30).default(2), // 来货周期（默认2天一次，可调）
        safetyVolumeM3: z.number().min(0.001).max(10).default(0.012), // 安全体积(m³)：库存体积低于该值则补货（可调）
        urgentDays: z.number().min(1).max(30).default(7),
        overstockDays: z.number().min(15).max(365).default(60),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = requireSession(ctx);
      const coverDays = input.cycleDays;
      const safetyVolumeCm3 = input.safetyVolumeM3 * 1e6; // m³ → cm³（接口 volume 字段为 cm³/配送单位）
      const urgentDays = input.urgentDays;
      const overstockDays = input.overstockDays;
      const rows: Record<string, unknown>[] = [];
      for (let pn = 1; pn <= 3; pn += 1) {
        const page = await callBiz<XlbPage>(ctx, "/erp/hxl.erp.storeorder.item.page", {
          store_id: session.profile.store_id,
          page_number: pn,
          page_size: 100,
          orders: [{ property: "daily_sale_quantity", direction: "DESC" }],
        });
        rows.push(...((page.content ?? []) as Record<string, unknown>[]));
        if ((page.content ?? []).length < 100) break;
      }
      const suggestions: Record<string, unknown>[] = [];
      const negatives: Record<string, unknown>[] = [];
      const overstocks: Record<string, unknown>[] = [];
      let stagnant = 0;
      let makebillSkipped = 0;
      for (const r of rows) {
        const dailySale = Number(r.daily_sale_quantity) || 0;
        const stock = Number(r.basic_stock_quantity ?? r.stock_quantity) || 0;
        const ratio = Number(r.delivery_ratio) || 1;
        const onWay = (Number(r.on_way_quantity) || 0) * ratio;
        // 制单组合：库存为组合口径，不属单品库存，跳过并计数
        if (r.item_type === "MAKEBILL") {
          makebillSkipped += 1;
          continue;
        }
        // 负库存：账面异常，不参与补货建议
        if (stock < 0) {
          negatives.push({
            item: r,
            stock_basic: stock,
            daily_sale_quantity: dailySale,
          });
          continue;
        }
        if (dailySale <= 0) {
          if (stock > 0) {
            stagnant += 1;
            overstocks.push({
              item: r,
              stock_basic: stock,
              daily_sale_quantity: 0,
              available_days: null,
              overstock: true,
            });
          }
          continue;
        }
        const availableDays = (stock + onWay) / dailySale;
        // 超大库存（积压）
        if (availableDays > overstockDays) {
          overstocks.push({
            item: r,
            stock_basic: stock,
            daily_sale_quantity: dailySale,
            available_days: Math.round(availableDays),
            overstock: true,
          });
          continue;
        }
        const volume = Number(r.volume) || 0; // 每配送单位体积(cm³)
        // 安全库存：安全体积折算（配送单位向上取整）；无体积数据兜底 1 个配送单位
        const safetyBasic = volume > 0 ? Math.ceil(safetyVolumeCm3 / volume) * ratio : ratio;
        // 补货量 = 来货周期销量 + 安全库存 − 当前库存 − 在途
        const needBasic = Math.ceil(coverDays * dailySale + safetyBasic - stock - onWay);
        if (needBasic <= 0) continue;
        let qty = Math.ceil(needBasic / ratio);
        const lower = Number(r.lower_limit) || 0;
        const multiple = Number(r.multiple) || 1;
        const upper = Number(r.upper_limit) || 0;
        if (lower > 0 && qty < lower) qty = lower;
        if (multiple > 1) qty = Math.ceil(qty / multiple) * multiple;
        if (upper > 0 && qty > upper) qty = upper;
        if (qty <= 0) continue;
        suggestions.push({
          item: r,
          daily_sale_quantity: dailySale,
          stock_basic: stock,
          on_way_basic: onWay,
          available_days: Math.round(availableDays * 10) / 10,
          out_of_stock: stock + onWay <= 0,
          safety_basic: safetyBasic,
          suggest_quantity: qty,
          suggest_basic_quantity: qty * ratio,
          volume_m3: Math.round(((qty * volume) / 1e6) * 1e4) / 1e4,
          urgency: availableDays < coverDays ? "urgent" : availableDays < urgentDays ? "low" : "normal",
        });
      }
      const rank = { urgent: 0, low: 1, normal: 2 } as Record<string, number>;
      suggestions.sort(
        (a, b) =>
          rank[String(a.urgency)] - rank[String(b.urgency)] ||
          Number(a.available_days) - Number(b.available_days) ||
          Number(b.daily_sale_quantity) - Number(a.daily_sale_quantity),
      );
      negatives.sort((a, b) => Number(a.stock_basic) - Number(b.stock_basic));
      overstocks.sort((a, b) => Number(b.stock_basic) - Number(a.stock_basic));
      return {
        cycleDays: input.cycleDays,
        safetyVolumeM3: input.safetyVolumeM3,
        coverDays,
        urgentDays,
        overstockDays,
        total: suggestions.length,
        urgent: suggestions.filter((s) => s.urgency === "urgent").length,
        low: suggestions.filter((s) => s.urgency === "low").length,
        stagnant,
        negativeCount: negatives.length,
        overstockCount: overstocks.length,
        makebillSkipped,
        items: suggestions,
        negatives,
        overstocks,
      };
    }),

  /**
   * 效期预警（原版没有的增值功能）
   * 批次库存按到期日分桶：已过期 / 7天内 / 30天内 / 90天内；敞口按 基本数量×零售价 估算。
   */
  expiryAlerts: publicQuery.query(async ({ ctx }) => {
    const rows: Record<string, unknown>[] = [];
    for (let pn = 1; pn <= 3; pn += 1) {
      const page = await callBiz<XlbPage>(ctx, "/erp-stock/hxl.erp.stockdetail.page", {
        page_number: pn,
        page_size: 100,
      });
      rows.push(...((page.content ?? []) as Record<string, unknown>[]));
      if ((page.content ?? []).length < 100) break;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets: Record<string, { items: Record<string, unknown>[]; value: number }> = {
      expired: { items: [], value: 0 },
      d7: { items: [], value: 0 },
      d30: { items: [], value: 0 },
      d90: { items: [], value: 0 },
    };
    for (const r of rows) {
      const exp = r.expire_date ? new Date(String(r.expire_date)) : null;
      if (!exp || Number.isNaN(exp.getTime())) continue;
      const daysLeft = Math.floor((exp.getTime() - today.getTime()) / 86400000);
      if (daysLeft > 90) continue;
      const qty = Number(r.basic_quantity ?? r.quantity) || 0;
      if (qty <= 0) continue;
      const value = qty * (Number(r.sale_price) || 0);
      const key = daysLeft < 0 ? "expired" : daysLeft <= 7 ? "d7" : daysLeft <= 30 ? "d30" : "d90";
      buckets[key].value += value;
      buckets[key].items.push({
        item_code: r.item_code,
        item_name: r.item_name,
        batch_number: r.batch_number || "",
        producing_date: r.producing_date,
        expire_date: r.expire_date,
        period: r.period,
        days_left: daysLeft,
        basic_quantity: qty,
        basic_unit: r.basic_unit ?? r.unit,
        sale_price: r.sale_price,
        value: Math.round(value * 100) / 100,
        storehouse_name: r.storehouse_name,
      });
    }
    for (const b of Object.values(buckets)) {
      b.items.sort((a, c) => Number(a.days_left) - Number(c.days_left) || Number(c.value) - Number(a.value));
      b.value = Math.round(b.value * 100) / 100;
    }
    return {
      expired: { count: buckets.expired.items.length, ...buckets.expired },
      d7: { count: buckets.d7.items.length, ...buckets.d7 },
      d30: { count: buckets.d30.items.length, ...buckets.d30 },
      d90: { count: buckets.d90.items.length, ...buckets.d90 },
    };
  }),

  /** 销售看板（真实 BI 接口聚合） */
  salesBoard: publicQuery
    .input(
      z.object({
        dateFrom: z.string(),
        dateTo: z.string(),
        compareFrom: z.string(),
        compareTo: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const session = requireSession(ctx);
      const storeIds = [session.profile.store_id];
      const cardResp = await callBiz<Record<string, unknown>[]>(ctx, "/bi/hxl.bi.homepage.card.find", {
        store_ids: storeIds,
        date: [input.dateFrom, input.dateTo],
        compare_date: [input.compareFrom, input.compareTo],
        date_range: "DAY",
      }).catch(() => [] as Record<string, unknown>[]);
      const memberResp = await callBiz<Record<string, unknown>[]>(ctx, "/bi/hxl.bi.homepage.membercard.find", {
        store_ids: storeIds,
        date: [input.dateFrom, input.dateTo],
        compare_date: [input.compareFrom, input.compareTo],
        date_range: "DAY",
      }).catch(() => [] as Record<string, unknown>[]);
      const paymentResp = await callBiz<Record<string, unknown>[]>(ctx, "/bi/hxl.bi.homepage.pospayment.find", {
        store_ids: storeIds,
        bizday: [input.dateFrom, input.dateTo],
      }).catch(() => [] as Record<string, unknown>[]);
      return { cards: cardResp, members: memberResp, payments: paymentResp };
    }),

  /** 销售日趋势（近 N 天逐日卡片，权限不足字段为 ****） */
  salesTrend: publicQuery
    .input(z.object({ days: z.number().min(3).max(14).default(7) }))
    .query(async ({ ctx, input }) => {
      const session = requireSession(ctx);
      const storeIds = [session.profile.store_id];
      const out: Record<string, unknown>[] = [];
      const today = new Date();
      for (let i = input.days - 1; i >= 0; i -= 1) {
        const d = new Date(today.getTime() - i * 86400000);
        const ymd = d.toISOString().slice(0, 10);
        const ymdPrev = new Date(d.getTime() - 86400000).toISOString().slice(0, 10);
        try {
          const cards = await callBiz<Record<string, unknown>[]>(ctx, "/bi/hxl.bi.homepage.card.find", {
            store_ids: storeIds,
            date: [ymd, ymd],
            compare_date: [ymdPrev, ymdPrev],
            date_range: "DAY",
          });
          const pick = (name: string) => cards.find((c) => c.name === name);
          out.push({
            date: ymd.slice(5),
            sales: pick("销售额")?.comparator_value ?? pick("销售额")?.compare_value1 ?? null,
            salesMask: pick("销售额")?.value ?? null,
            orders: pick("客单量")?.comparator_value ?? pick("客单量")?.compare_value1 ?? null,
            ordersMask: pick("客单量")?.value ?? null,
            memberSales: pick("会员销售额")?.comparator_value ?? pick("会员销售额")?.compare_value1 ?? null,
          });
        } catch {
          out.push({ date: ymd.slice(5), sales: null, orders: null, memberSales: null });
        }
      }
      return out;
    }),

  /**
   * 库存差异识别（原版没有的增值功能）：
   * 1) 负库存清单（账面必然异常）
   * 2) 零库存但仍有销量（数据异常）
   * 3) 最近盘点差异明细（账面 vs 实盘）
   */
  stockDiff: publicQuery.query(async ({ ctx }) => {
    const session = requireSession(ctx);
    // 1) 负库存
    const negatives: Record<string, unknown>[] = [];
    for (let pn = 1; pn <= 3; pn += 1) {
      const page = await callBiz<XlbPage>(ctx, "/erp-stock/hxl.erp.stockdetail.page", {
        page_number: pn,
        page_size: 100,
      });
      for (const r of (page.content ?? []) as Record<string, unknown>[]) {
        const qty = Number(r.basic_quantity ?? r.quantity) || 0;
        if (qty < 0) {
          negatives.push({
            item_code: r.item_code,
            item_name: r.item_name,
            item_type: r.item_type,
            basic_quantity: qty,
            basic_unit: r.basic_unit ?? r.unit,
            storehouse_name: r.storehouse_name,
            latest_in_date: r.latest_in_date,
          });
        }
      }
      if ((page.content ?? []).length < 100) break;
    }
    negatives.sort((a, b) => Number(a.basic_quantity) - Number(b.basic_quantity));
    // 2) 零库存有销量（数据异常）
    const zeroSales: Record<string, unknown>[] = [];
    for (let pn = 1; pn <= 2; pn += 1) {
      const page = await callBiz<XlbPage>(ctx, "/erp/hxl.erp.storeorder.item.page", {
        store_id: session.profile.store_id,
        page_number: pn,
        page_size: 100,
        orders: [{ property: "daily_sale_quantity", direction: "DESC" }],
      });
      for (const r of (page.content ?? []) as Record<string, unknown>[]) {
        const dailySale = Number(r.daily_sale_quantity) || 0;
        const stock = Number(r.basic_stock_quantity ?? r.stock_quantity) || 0;
        if (dailySale > 0 && stock <= 0) {
          zeroSales.push({
            item: r,
            daily_sale_quantity: dailySale,
            stock_basic: stock,
          });
        }
      }
      if ((page.content ?? []).length < 100) break;
    }
    zeroSales.sort((a, b) => Number(b.daily_sale_quantity) - Number(a.daily_sale_quantity));
    // 3) 最近盘点差异
    const checkPage = await callBiz<XlbPage>(ctx, "/erp-stock/hxl.erp.stockcheckorder.page", {
      page_number: 1,
      page_size: 5,
    });
    let checkDiff: Record<string, unknown> | null = null;
    for (const o of (checkPage.content ?? []) as Record<string, unknown>[]) {
      if (!["FINISH", "AUDIT"].includes(String(o.state))) continue;
      const detail = await callBiz<Record<string, unknown>>(ctx, "/erp-stock/hxl.erp.stockcheckorder.read", {
        fid: o.fid,
      });
      const items = ((detail.details as Record<string, unknown>[]) ?? [])
        .filter((d) => Number(d.diff_quantity) !== 0 || Number(d.diff_money) !== 0)
        .sort((a, b) => Math.abs(Number(b.diff_money) || 0) - Math.abs(Number(a.diff_money) || 0));
      checkDiff = {
        fid: o.fid,
        state: o.state,
        operate_date: o.operate_date,
        storehouse_name: o.storehouse_name,
        diff_money: o.diff_money,
        create_by: o.create_by,
        items,
      };
      break;
    }
    return {
      negatives: { count: negatives.length, items: negatives.slice(0, 50) },
      zeroSales: { count: zeroSales.length, items: zeroSales.slice(0, 50) },
      checkDiff,
    };
  }),

  /** 看板：用真实单据接口聚合 */
  dashboard: publicQuery.query(async ({ ctx }) => {
    const fetchPage = async (entity: string, extra: Record<string, unknown> = {}) => {
      const def = DOC_ENTITIES[entity];
      try {
        return await callBiz<XlbPage>(ctx, `${def.base}.page`, {
          page_number: 1,
          page_size: 50,
          ...extra,
        });
      } catch {
        return { content: [], total_elements: 0, total_pages: 0, number: 0, size: 50 } as XlbPage;
      }
    };
    const [orders, requests, deliveries, receives, counts] = await Promise.all([
      fetchPage("storeOrder"),
      fetchPage("requestOrder"),
      fetchPage("deliveryOut"),
      fetchPage("receiveOrder"),
      fetchPage("stockCount"),
    ]);
    const sum = (rows: Record<string, unknown>[], key = "money") =>
      rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);
    const pendingOf = (rows: Record<string, unknown>[]) =>
      rows.filter((r) => r.state === "INIT").length;
    const recent = (rows: Record<string, unknown>[], entity: string, label: string) =>
      rows.slice(0, 6).map((r) => ({
        entity,
        entityLabel: label,
        fid: String(r.fid ?? ""),
        state: String(r.state ?? ""),
        money: Number(r.money ?? r.total_money ?? 0) || 0,
        itemCount: Number(r.item_count ?? 0) || 0,
        quantity: Number(r.quantity ?? r.actual_quantity ?? 0) || 0,
        createTime: String(r.create_time ?? r.operate_date ?? ""),
        createBy: String(r.create_by ?? ""),
        storeName: String(r.store_name ?? r.out_store_name ?? ""),
      }));
    return {
      totals: {
        storeOrder: { count: orders.total_elements ?? 0, pending: pendingOf(orders.content ?? []), money: sum(orders.content ?? []) },
        requestOrder: { count: requests.total_elements ?? 0, pending: pendingOf(requests.content ?? []), money: sum(requests.content ?? []) },
        deliveryOut: { count: deliveries.total_elements ?? 0, pending: pendingOf(deliveries.content ?? []), money: sum(deliveries.content ?? []) },
        receiveOrder: { count: receives.total_elements ?? 0, pending: pendingOf(receives.content ?? []), money: sum(receives.content ?? []) },
        stockCount: { count: counts.total_elements ?? 0, pending: pendingOf(counts.content ?? []), money: sum(counts.content ?? []) },
      },
      recent: [
        ...recent(orders.content ?? [], "storeOrder", DOC_ENTITIES.storeOrder.label),
        ...recent(requests.content ?? [], "requestOrder", DOC_ENTITIES.requestOrder.label),
        ...recent(receives.content ?? [], "receiveOrder", DOC_ENTITIES.receiveOrder.label),
      ]
        .sort((a, b) => (a.createTime < b.createTime ? 1 : -1))
        .slice(0, 10),
      todos: [
        ...recent((orders.content ?? []).filter((r) => r.state === "INIT"), "storeOrder", DOC_ENTITIES.storeOrder.label),
        ...recent((requests.content ?? []).filter((r) => r.state === "INIT"), "requestOrder", DOC_ENTITIES.requestOrder.label),
        ...recent((counts.content ?? []).filter((r) => r.state === "INIT"), "stockCount", DOC_ENTITIES.stockCount.label),
      ].slice(0, 8),
    };
  }),
});

export type { XlbSession };
