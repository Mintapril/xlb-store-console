# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库布局

- `app/` —— 全部应用代码。**所有 npm 命令都在 `app/` 下执行**，仓库根目录没有 package.json。
- `api_recon/` —— 官方前端 bundle 与抓包产物，只读参考资料，不参与构建。
- 根目录 `新零帮商业系统-业务API文档.md` / `新零帮商业系统-API端点总表.md` —— 端点逆向文档，新增业务接口前先查这两份。

当前目录不是 git 仓库，改动没有版本回滚兜底。

## 命令（均在 `app/` 下）

```bash
npm install        # node_modules 未提交，首次必须先装
npm run dev        # vite + hono dev-server，前后端同为 3000 端口
npm run check      # tsc -b（app / node / server 三个 project reference）
npm run lint
npm test           # vitest 只匹配 api/**/*.test.ts，src 下的测试不会被执行
```

`npm run format` 是 `prettier --write .`，会重写整棵树；只格式化自己改过的文件用 `npx prettier --write <file>`。

## 真实生产系统约束

后端直连真实业务系统 `gdp.xlbsoft.com`，不是沙箱环境。

- 写动作（`audit` / `reaudit` / `invalid` / `batchdelete` / `finish` / `confirm` / `save`）会真实修改客户数据。**发起任何写调用前，先说明具体单据号与动作并等待用户确认。**
- 探测和调试只用只读端点（`.page` / `.read` / `.find`）。
- 前端写操作一律保留二次确认弹窗。

## 后端约定

- 业务调用的唯一出口是 `api/xlb/client.ts` 的 `xlbCall(session, endpoint, params)`。它负责公共 envelope（`company_id` / `operator_store_id` / `operator` / `source`）、鉴权头、以及 code 2005/1005 时自动刷新令牌并重放一次。不要在 router 里直接 fetch `gdp.xlbsoft.com`。
- `xlbCall` 可能返回刷新过的 session，调用方必须 `writeSession` 回写 —— 照 `api/bizRouter.ts` 的 `callBiz` 写。
- 会话是无状态签名 Cookie（`api/session.ts`），没有本地数据库。package.json 里的 drizzle/mysql2 是模板残留、未接线，不要据此假设有 DB。
- 登录需要 `XLB_CLIENT_SECRET`（IDaaS 网关的 client_secret，官方前端公开硬编码值，见 `.env.example`），不设则登录失败。
- 生产环境必须设 `APP_SECRET`，否则会用硬编码 dev 密钥签名会话。
- `api/middleware.ts` 导出的 `publicQuery` 就是基础 procedure，mutation 也用它（名字有误导性）。

## 前端约定

- 单据类的列表/详情/动作是数据驱动的：后端端点映射在 `api/bizRouter.ts` 的 `DOC_ENTITIES`，前端列/状态/动作在 `src/lib/registry.ts` 的 `entities`，页面复用 `src/pages/EntityPage.tsx`。新增单据类型改这两处，不要新建页面。
- `src/components/ui/**` 是 shadcn 生成物，不手改。
- 路径别名 `@/` → `src/`；`@contracts` / `@db` 别名在 vite/tsconfig 里有配置但目录不存在。
- 移动端优先（底部导航、卡片化列表、触控目标 ≥ 40px、安全区适配）。

## 真实接口的已知怪癖

接口实际行为与文档不一致的地方，在调用点就近注释记录 —— 例如门店订单 `state=INIT` 在 `page_size>=5` 时 content 恒为空（须按 `page_size=2` 聚合后内存分页）、完整单号要走 `fid` 精确匹配而非 `keyword`。遇到新怪癖照此处理，不要抽象成通用兜底逻辑。
