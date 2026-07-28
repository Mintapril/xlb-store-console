# xlb-store-console

新零帮商业系统·门店端的**非官方**移动端 Web 客户端。React 19 + Vite + Tailwind + shadcn/ui（前端）与 Hono + tRPC（后端），通过官方 IDaaS 网关直连业务系统，无本地数据库。

> ⚠️ **免责声明（务必先读）**
>
> 本项目为**非官方、独立第三方作品，仅供技术学习研究**，与新零帮 / xlbsoft 无任何隶属或授权关系。
> 后端**直连真实生产系统**，审核 / 作废 / 删除等写操作会**真实且不可逆地**修改数据，使用者自负其责，且须仅操作**已获授权**的账号与数据。
> 仓库不含任何官方代码或真实凭据。完整条款见 [DISCLAIMER.md](./DISCLAIMER.md)。

## 结构

- [`app/`](./app) — 应用代码（前端 `src/` + 后端 `api/`）。所有命令在此目录下执行，详见 [`app/README.md`](./app/README.md)。
- `新零帮商业系统-业务API文档.md` / `新零帮商业系统-API端点总表.md` — 接口逆向分析记录（凭据已脱敏）。
- `CLAUDE.md` — 面向 Claude Code 的仓库指引。

## 快速开始

```bash
cd app
cp .env.example .env      # 填入 APP_SECRET 与 XLB_CLIENT_SECRET
npm install
npm run dev               # http://localhost:3000
```

许可与使用限制见 [DISCLAIMER.md](./DISCLAIMER.md)。
