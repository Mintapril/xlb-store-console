---
name: probe-endpoint
description: 逆向定位新零帮（gdp.xlbsoft.com）的某个业务 API 端点，确认参数与响应形状，并按现有写法接入 xlbCall 与 tRPC。当需要新增一个后端未覆盖的业务接口时使用。
---

目标端点：$ARGUMENTS

## 1. 定位端点

按顺序查，先查到先用：

1. `新零帮商业系统-API端点总表.md`（仓库根）—— 665 个实体按 `/域`（`/erp`、`/erp-stock`、`/erp-mdm`、`/bi`、`/fss`…）分节，列出 RPC 前缀与支持的动作（find / page / read / audit / save …）。确认端点存在以及**它支持哪些动作**。
2. `新零帮商业系统-业务API文档.md`（仓库根）—— 已有实测记录的端点会给出请求参数、响应字段与坑。
3. 以上都没有 → 在 `api_recon/js/` 里 grep RPC 名。文件按子系统前缀命名（`erpweb_`、`gdp_`、`bmsz_`、`bi_`、`login_`），在官方 bundle 的调用点附近能看到实际传参与字段解构。

完整端点路径形如 `/{域}/hxl.{模块}.{实体}.{动作}`，例如 `/erp/hxl.erp.storeorder.page`。

## 2. 确认形状（只读）

- **只调用只读动作**：`.page` / `.read` / `.find`。写动作（`audit` / `reaudit` / `invalid` / `batchdelete` / `finish` / `confirm` / `save`）作用于真实生产数据，本流程一律不调用；需要接写接口时只写代码，由用户手动在 UI 上验证。
- 探测走 `xlbCall`，不要自己 fetch。`xlbCall` 已自动注入 `company_id` / `operator_store_id` / `operator` / `source`，参数里不要重复传。
- 记下：分页字段（`page_number` / `page_size`，响应 `content` / `total_elements` / `total_pages` / `number` / `size`）、筛选字段的真实名字、以及响应里实际用得上的字段。

## 3. 接入

- 在 `api/bizRouter.ts` 新增 procedure，一律经 `callBiz(ctx, endpoint, params)` —— 它负责 `requireSession`、令牌刷新回写、以及 `XlbError` → `TRPCError` 的映射。
- 入参用 zod 校验；分页类接口复用现成的 `pageInput` / `pageParams`。
- 如果是单据类实体（有列表 + 详情 + 审核动作），加进 `DOC_ENTITIES`，并在 `src/lib/registry.ts` 的 `entities` 里补列定义/状态/动作 —— 页面由 `src/pages/EntityPage.tsx` 复用，**不要新建页面**。
- 非单据类（看板、统计、库存查询等）在 `bizRouter` 里单独开 procedure，前端自己写页面。

## 4. 记录怪癖

真实接口经常与文档不符（空 content、筛选字段无效、要用 `fid` 而非 `keyword` 等）。把绕过写法**就近注释在调用点**，写明触发条件和实测结论，不要抽象成通用兜底逻辑。

## 5. 验证

在 `app/` 下跑 `npm run check` 和 `npm run lint`，全绿才算完成。
