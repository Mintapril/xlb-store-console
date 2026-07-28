# 新零帮商业系统·门店端（真实 API 直连版）

> ⚠️ 非官方第三方项目，直连真实生产系统，写操作不可逆。使用前请阅读仓库根的 [DISCLAIMER.md](../DISCLAIMER.md)。

基于 React + TypeScript + Vite + Tailwind + shadcn/ui（前端）与 Hono + tRPC（后端）构建的门店端业务系统，**通过官方 IDaaS 网关直连新零帮真实业务系统**，移动端优先设计。

## 功能

- **真实登录**：机构号 + 账号 + 密码 → IDaaS 密码授权 → ERP 会话（三段式，见 `api/xlb/client.ts`）
- **经营看板**：要货单/门店订单/配送出库/门店收货/盘点单实时汇总、待办与最新单据
- **单据中心**：门店订单、要货单、配送出库单、门店收货单、库存盘点单
  - 分页列表（状态/日期/单号筛选）、详情（主单 + 商品明细）
  - 写操作（审核/反审核/作废/红冲/完成盘点）**直接作用于真实系统**，二次确认后生效
- **库存查询**：批次级现货/可用/锁定/预占与效期
- **商品价格查询**：商品档案零售价/配送价/批发价（成本价按权限掩码）
- **会话**：无状态签名 Cookie（HMAC-SHA256），令牌过期自动刷新重放，无任何本地数据库

## 移动端优化

- 底部快捷导航（看板/订单/库存/菜单）、抽屉式菜单
- 列表页移动端卡片化、详情抽屉全屏化、安全区适配（env(safe-area-inset-bottom)）
- 触控目标 ≥ 40px、骨架屏加载、每分钟自动刷新看板

## 开发

```bash
npm install
npm run dev      # vite + hono dev-server（端口 3000）
npm run build    # 产物 dist/public + dist/boot.js
npm start        # 生产运行（端口 3000）
```

环境变量（见 `.env.example`）：`APP_SECRET`（会话签名密钥，生产必配）、`XLB_CLIENT_SECRET`（IDaaS 网关 client_secret，不设则登录失败）。

## 接口依据

全部接口来自对官方前端的逆向分析（《新零帮商业系统-业务API文档》）：

- 登录：`login-web.idaas.ali-prod.xlbsoft.com/idaas/oauth2/token`（grant_type=password）
- 会话：`gdp.xlbsoft.com/erp-mdm/idaas.erp.user.profile`
- 业务：`gdp.xlbsoft.com/{erp,erp-stock,erp-mdm}/hxl.*.{page,read,audit,...}`（RPC-over-HTTP）
