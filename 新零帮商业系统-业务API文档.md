# 新零帮商业系统（gdp.xlbsoft.com）业务 API 文档

> 逆向来源：前端 JS bundle（`react_web/umi.a2ed243d.js`、`xlb_login_web/umi.58aa0716.js` 及异步 chunk）静态分析 + 测试账号（机构号 «机构号» / 账号 «账号»）只读实测。
> 合规说明：本文档所有"实测"均为只读调用；审核（audit）、保存（save）、删除（delete）等写接口仅做静态分析，**未发起任何写请求**。
> 采集时间：2026-07-25。前端版本：umi 3.5.42 / Api-Version 1.5.0。

---

## 1. 系统总览

| 项 | 值 |
|---|---|
| 登录门户 | `https://login-web.idaas.ali-prod.xlbsoft.com`（统一认证 IDaaS，支持密码/短信/飞书扫码） |
| 业务系统 | `https://gdp.xlbsoft.com`（新零帮商业系统，React + qiankun 微前端） |
| 业务 API 网关（实测可用） | `https://gdp.xlbsoft.com`（同源反代全部子系统 `/erp-mdm`、`/erp`、`/fss`、`/wms`、`/scm`…） |
| 其他网关（前端代码出现） | `https://mdm.mdm.ali-prod.xlbsoft.com`（生产前缀，直连 404，应为内网/导出专用）、`https://hxl-pay.xlbsoft.com`（支付域） |
| 子系统微前端 | oa / fss(bms) / wms / tms / scm / mdm / bi / kms / member / retail / sms / im 等独立站点 |

**API 风格**：统一 RPC-over-HTTP。

- 全部 `POST`（除 `/idaas/me` 为 GET）
- URL 形如 `/{服务域}/hxl.{模块}.{实体}.{动作}`，例：`POST /erp-mdm/hxl.erp.item.page`
- 请求体 JSON（登录换 token 接口为 form-urlencoded；文件上传为 multipart）
- 响应统一信封：`{"code":0,"msg":"success","data":...}`

**已识别服务域**（按端点数量排序，共 1417 个端点、约 665 个实体）：

| 服务域前缀 | 端点数 | 业务域 |
|---|---|---|
| `/erp-mdm` | 1083+ | 主数据（商品、客户、供应商、门店、组织、用户、价格、参数） |
| `/erp` | 383+ | ERP 业务（门店订单、配送出库、收货、退货、补货分析、报表） |
| `/erp-purchase` | 183+ | 采购（采购订单、采购收货、采购补货分析） |
| `/fss` | 149 | 财务共享（结算、费用、发票、门店资金账户、预收款） |
| `/wms` | 126 | 仓储（入库单、出库单、移库、车辆、波次） |
| `/scm` | 106 | 供应链协同（商品申请、配送单、首页待办） |
| `/erp-wholesale` | 74 | 批发（批发订单、批发退货、批发参数） |
| `/scm-mdm` | 73 | 供应商侧主数据 |
| `/kms` | 56 | 招商/加盟（线索、客户、合同模板、意向金） |
| `/erp-stock` | 55 | 库存（库存查询、盘点、调整、转换、成本调整） |
| `/bi` | 18 | 报表看板（首页卡片、POS 收款汇总） |
| `/oa` | 15 | 审批流（审批任务、常用语、文件） |
| `/tms` | 8 | 运输（车辆、承运商、司机、线路、签收认证） |
| `/member` | 10 | 会员（卡类型、券、抖音门店） |
| `/retail` | 6 | 零售（POS 订单、促销特价、零售价模板） |
| 其他 | 少量 | `/center`、`/bms`、`/erp-mall`、`/hrs`、`/user-portal`、`/sms`、`/export` |

完整 665 实体 × 动作清单见附录 A。

---

## 2. 认证与登录（完整链路，已实测跑通）

登录是三段式：**IDaaS 密码授权 → 设备数检查 → ERP 资料/会话令牌换取**。前端还会先走易盾验证码（风险触发时），密码登录实测未触发。

### 2.1 设备登录数量检查

`POST https://login-web.idaas.ali-prod.xlbsoft.com/erp-mdm/hxl.account.login.num.check`

请求头：`Content-Type: application/json`、`xlb_device_mac: <设备指纹>`、`company_id: "«机构号»"`

请求体（JSON）：

```json
{
  "username": "«账号»", "password": "«密码»", "grant_type": "password",
  "company_id": "«机构号»", "check_account": "«账号»", "auth_source": "password",
  "user_id": null, "account": "«账号»", "login_source": "WEB"
}
```

响应：`{"code":0,"msg":"success","data":true}` — `data:false` 时前端弹"强制下线最早设备"确认框。

### 2.2 密码授权换 IDaaS Token

`POST https://login-web.idaas.ali-prod.xlbsoft.com/idaas/oauth2/token`

请求头：`Content-Type: application/x-www-form-urlencoded`、`xlb_device_mac: <同上>`

表单字段：

| 字段 | 值 | 说明 |
|---|---|---|
| `username` | `«账号»` | 登录账号 |
| `password` | 明文 | HTTPS 传输，**前端不加密** |
| `grant_type` | `password` | 另有 `auth_ticket`（短信/扫码后换正式 token）、`refresh_token`（刷新） |
| `company_id` | `«机构号»` | 机构号（数字） |
| `check_account` | `«账号»` | 同 username |
| `auth_source` | `password` | `sms` / `qrcode` 等 |
| `client_id` | `erp` | 固定 |
| `client_secret` | `«client_secret»` | 前端硬编码（登录 web 与 gdp 均使用） |
| `login_source` | `WEB` | 固定 |

成功响应：

```json
{
  "code": 0, "msg": "success",
  "data": {
    "access_token": "eyJraWQiOiI4YTBh...（RS256 JWT，1小时）",
    "refresh_token": "e0ba4498b72a45d4a944f628d566ecbb",
    "token_type": "Bearer",
    "expires_in": 3599
  }
}
```

JWT payload 含：`sub/id`=用户ID、`company_id`、`store_id`、`account`、`aud=erp`、`iss=https://idaas.idaas.ali-prod.xlbsoft.com/idaas`。

失败响应：`{"code":1,"msg":"登录失败"}`；密码错误系列 `code=3011~3018`；`code=2058` 表示需强制重置密码（`data.params` 带回登录参数）。

前端随后把 `xlb_token="Bearer <jwt>"`、`xlb_refresh_token`、`xlb_client_secret`、`company_id`、`account` 写入 `.xlbsoft.com` 域 Cookie，跳转 `gdp.xlbsoft.com`。

### 2.3 换取 ERP 会话（关键一步）

`POST https://gdp.xlbsoft.com/erp-mdm/idaas.erp.user.profile`

请求头：`Authorization: Bearer <IDaaS JWT>`、`machine_desc: Windows 10/11`、`xlb_device_mac: <设备指纹>`
请求体：空 JSON `{}`

响应 `data` 即 ERP 用户档案（userInfo），关键字段：

| 字段 | 示例 | 用途 |
|---|---|---|
| `id` | `«业务ID»` | 用户 ID → `User-Id` 头 / `operator` 字段 |
| `company_id` | `«机构号»` | → `Company-Id` 头 / `company_id` 字段 |
| `store_id` | `«业务ID»` | 当前门店 → `operator_store_id` 字段 |
| `org_ids` | `[«业务ID»]` | 数据权限组织 → `Org-Ids` 头 |
| `access_token` | `71167c6517624490832c5320d1080481` | **ERP 会话令牌 → `Access-Token` 头**（与 JWT 的 jti 相同） |
| `refresh_token` | — | ERP 会话刷新令牌 |
| `account` / `name` / `store_name` / `role_name` | `«账号»` / `«门店名»` / `店长(PDA)-店务` | 身份信息 |
| `authorities[]` | `{app_type, name, action, path, category_path}` | 按钮级权限点（前端据此显隐） |
| `store{}` | 门店完整档案（编码、仓、上游中心仓、证照、税号） | 业务默认值 |
| `query_stores[]` / `query_orgs[]` | 可查询门店/组织范围 | 数据权限 |
| `enable_pwd_login`、`user_type`、`inner_user` 等 | — | 登录策略 |

> 前端缓存：`userInfo`、`access_token` 写 localStorage 与 Cookie；`Access-Token` 过期后由 `/idaas/idaas/oauth2/token`（gdp 同源，注意**双 idaas 前缀**）以 `grant_type=refresh_token` 刷新。

### 2.4 Token 刷新

`POST https://gdp.xlbsoft.com/idaas/idaas/oauth2/token`（form-urlencoded）

| 字段 | 值 |
|---|---|
| `grant_type` | `refresh_token` |
| `client_id` / `client_secret` | `erp` / Cookie `xlb_client_secret`（默认 `secret-erp`，实测为 2.2 的硬编码值） |
| `refresh_token` | `<xlb_refresh_token>` |
| `login_source` | `WEB` |

响应同 2.2。前端拦截器在业务请求返回 401/`code=1005` 时自动刷新并重放原请求（单例 + 队列）。

### 2.5 退出登录

`POST /erp-mdm/hxl.erp.user.logout`（业务头）→ 前端清空 `.xlbsoft.com` 域 Cookie。

### 2.6 登录辅助接口（登录门户同源，静态分析）

| 端点 | 用途 |
|---|---|
| `POST /idaas/login.sms.send` / `.v2` | 发送短信验证码 |
| `POST /idaas/login.sms` | 短信验证码登录（返回 `auth_ticket` + `user.accounts[]`，多账号跳选择公司） |
| `POST /idaas/login.qrcode.generate` / `.fetch.status` | 飞书扫码：生成二维码 / 轮询状态 |
| `POST /idaas/login.app.social` / `login.bound` | 第三方登录绑定 |
| `POST /idaas/login.verify.tel` / `.v2` | 手机号校验 |
| `POST /idaas/login.password.reset` | 重置密码（头可带 `Access-Token`） |
| `POST /idaas/login.captcha.verify` | 易盾验证码校验 |
| `POST /idaas/login.account.phone.find` | 查账号绑定手机号 |
| `POST /idaas/voice.code.send` / `.v2` | 语音验证码 |
| `GET  /idaas/me` | 当前会话信息（withCredentials） |
| `POST /erp-mdm/hxl.erp.user.pwd.reset.new` | 新重置密码（`Authorization`/`Access-Token` 头） |
| `POST /erp-mdm/hxl.erp.user.customerservice.phone.bind` | 客服手机号绑定 |

短信登录换正式 token 用 `grant_type=auth_ticket`，字段：`auth_state=auth_ticket, auth_ticket, account, account_id, user_id, store_id, company_id, auth_source=sms`。

---

## 3. 业务 API 通用约定

### 3.1 请求

`POST https://gdp.xlbsoft.com{endpoint}`

**公共请求头**：

| 头 | 值 | 说明 |
|---|---|---|
| `Access-Token` | ERP 会话令牌（2.3 所得） | 必填，缺失返回 `code=1007 缺少Access-Token` |
| `Authorization` | `Bearer <IDaaS JWT>` | 主 axios 实例携带（多数业务接口不强制，建议带上） |
| `Api-Version` | `1.5.0` | 部分实例携带 |
| `Company-Id` | `«机构号»` | 来自 userInfo |
| `User-Id` | `«业务ID»` | 来自 userInfo |
| `Org-Ids` | `«业务ID»` | userInfo.org_ids 逗号拼接 |
| `Content-Type` | `application/json` | |

**公共请求体**（前端拦截器自动合并，空值/ null/ undefined 字段会被剔除）：

```json
{
  "_u_id": null,
  "company_id": «机构号»,
  "operator_store_id": «业务ID»,
  "operator": «业务ID»,
  "source": "WEB",
  "...业务参数": "..."
}
```

- `operator`：未登录态取 access_token，登录后取 userInfo.id
- 采购域白名单端点在特定公司（Cookie `PurchaseOssConfig` 配置了 company_id）会被改写为 `/purchase/...`（`/erp/` → `/purchase/`），网关侧兼容。

### 3.2 响应

```json
{ "code": 0, "msg": "success", "data": ... }
```

| code | 含义（实测 + 前端文案） |
|---|---|
| `0` | 成功 |
| `1` | 通用失败（登录失败等） |
| `1003` | 服务器异常，请稍后 |
| `1005` | 未登录/需重新登录（触发跳转登录页） |
| `1007` | 缺少 Access-Token / **无权限**（业务接口空 msg 时多为数据权限不足，如门店账号调采购分页） |
| `2004` | 参数校验失败（msg 直出缺失字段，如"日期不能为空"） |
| `2005` | 登录已过期，请重新登录 |
| `2058` | 需强制重置密码 |
| `3011~3018` | 密码错误/账号锁定系列 |
| `401`（HTTP） | 触发 token 刷新重放 |

### 3.3 分页

请求：

```json
{ "page_number": 1, "page_size": 20,
  "orders": [{"property": "create_time", "direction": "DESC"}] }
```

响应（Spring Data Page 结构）：

```json
{ "code": 0, "data": {
    "content": [ ... ],
    "total_elements": 38091, "total_pages": 1905,
    "number": 0, "size": 20, "first": true, "last": false,
    "number_of_elements": 20, "empty": false,
    "pageable": {...}, "sort": {...} } }
```

> 部分列表页会在 `data` 同级附加汇总字段（如 `storeorder.page` 返回 `money/quantity/item_count` 等合计）。少数老接口用 `lists + total` 结构（如 `org.tree` 直出数组）。

### 3.4 单号与状态

- 单号 `fid` 规则：`{业务前缀}{company}{store}{序列}`，例：门店订单 `DD«单号»`、要货单 `YH«单号»`。
- 单据主状态 `state`：`INIT`（初始）→ `AUDIT`（已审核），另有 `INVALID`（作废）、中间态如 `CONFIRM/PART_RECEIVE` 等按单据类型扩展；`confirm_state`（确认状态）、`delivery_state`（配送状态）独立流转。
- 详情接口 `read` 入参统一为 `{"fid": "..."}`（部分支持 `id`）。

### 3.5 写操作命名规约（静态归纳，全部实体一致）

| 动作后缀 | 语义 | 典型入参 |
|---|---|---|
| `.page` / `.item.page` | 主单/明细分页 | 分页参数 + 查询条件 |
| `.read` | 单条详情（含 details[]） | `{fid}` |
| `.find` | 列表/树/下拉（不分页） | 查询条件 |
| `.short.page` | 精简字段分页 | 分页参数 |
| `.save` / `.update` | 新增 / 修改 | 与 read 结构相同的主单 + details[] |
| `.audit` / `.batchaudit` | 审核 / 批量审核 | `{fid}` 或 `{fids:[...]}`，部分带 `audit_memo` |
| `.reaudit` | 反审核 | `{fid}` |
| `.reverse` / `.batchreverse` | 红冲 | `{fid}` / `{fids}` |
| `.invalid` / `.batchinvalid` | 作废 | `{fid}` / `{fids}`，可带 `invalid_reason` |
| `.batchdelete` | 批量删除（仅 INIT 态） | `{fids:[...]}` |
| `.copy` / `.batchcopy` | 复制 | `{fid}` / `{fids}` |
| `.export` / `.detail.export` | 导出 | 同 page 参数 + `responseType:"blob"`，返回文件流（经 mdm 网关；门店账号实测 1007 无权限） |
| `.import` / `.order.import(.save)` | 导入 | 文件 fid/内容 |
| `.template.download` | 导入模板下载 | 文件流 |
| `.file.upload` | 附件上传 | multipart `file`，头带 `Access-Token` |
| `.print` / `.print.read` | 打印数据 | `{fid}` |
| `.check` / `.lock` / `.unlock` / `.finish` / `.merge` 等 | 业务专属动作 | 各异 |

> 审核/保存类接口本次一律未调用；入参结构来自前端调用点静态分析（如 `{fids: gt}`、`{id, audit_memo}`）与 read 响应的对称结构。

---

## 4. 主数据域 `/erp-mdm`（已实测）

### 4.1 组织树 `POST /erp-mdm/hxl.erp.org.tree` ✅实测

请求体：仅公共信封。响应 `data` 为组织数组（平铺，含 `parent_id` 自组树）：

```json
[{"id":100000000001,"code":"10","name":"万辰集团","type":"BUSINESS","parent_id":0,"level":1,
  "company_id":«机构号»,"store_id":«业务ID»,"has_auth":false,
  "create_by":"王 敏","create_time":"2024-09-27 09:49:56","update_time":"2026-07-02 13:34:02"}]
```

相关：`hxl.erp.org.all.find`、`hxl.erp.org.find`、`hxl.erp.org.page`（组织 CRUD 与权限组织过滤）。

### 4.2 商品档案 `hxl.erp.item.*` ✅实测

`POST /erp-mdm/hxl.erp.item.page` ✅ — 分页见 3.3。单条 `content[i]` 字段 170+，核心组：

- 标识：`id, code, bar_code, name, sale_name, finance_name, shorthand_code, toy_code`
- 分类：`category_id, item_category{...}, one/two/three_category_name, item_dept_id/name, item_brand_id/name, item_brand_level(_name)`
- 状态：`item_status`（如 `NEW_ITEM`）、`stop_purchase/stop_sale/stop_request/stop_wholesale`（布尔停售停购）、`eliminate, deleted, in_check`
- 价格：`sale_price, sale_min/max_price, sale_price_s/t/f, purchase_price, delivery_price, wholesale_price(_s/_t/_f), *_gross_profit`（成本价按权限掩码为 `"****"`）
- 单位换算：`unit, stock_unit/ratio, purchase_unit/ratio, wholesale_unit/ratio, delivery_unit/ratio, sale_unit_type/sale_unit/sale_ratio, retail_spec, weigh, weight_spec*`
- 配送/批发：`delivery_type(_ratio/_price), wholesale_type(_ratio/_price)（含 S/T/F 多级）, delivery_rule_type(_num/_ratio), direct_delivery, direct_supply, skip_warehouse`
- 效期：`period, expire_type(_num), date_in_type, center/store_expire_type(_ratio/_num), receive_rule_type(_num/_ratio)`
- 其他：`purchase_spec, origin_place, executive_standard, temperature, fragile, account_method（移动加权平均）, input/output_tax_rate, tax_no, pos_discount/pos_bargain, point, must_sell, business_scopes[], item_suppliers[], item_specs[], item_files[] 等`
- 审计：`create_by/time, update_by/time, submit_org_id, center_id, wms_id`

相关端点：`item.read / save / update / batchupdate(.count) / export / import / file.upload / item.barcode.page / itemcategory.find|save|update / itembrand.find / itemdept.find / itemlabel.* / customattribute.find|show.find / baseparam.read`。

### 4.3 客户 `hxl.erp.client.*` ✅实测分页可调

`client.page / read / save / update / delete / batchupdate(.count) / export / code.get / clientcategory.find / clienthistory.read / bms.merchantstatus / file.ocr`
`client.page` 查询条件常用：`keyword, clientcategory_id, org_id, store_id, enabled...`。

### 4.4 供应商 `hxl.erp.supplier.*` ✅实测分页可调

`supplier.page / read / save / update / delete / export / producerandexecutivestandard.find` 等。

### 4.5 门店 `hxl.erp.store.*`

`store.page / read / save / update / store.short.page / store.area.find / storehouse.find`（仓）等。

### 4.6 用户/账号

| 端点 | 说明 |
|---|---|
| `hxl.erp.user.read` | 用户详情（`{id}`，需 Access-Token） |
| `hxl.erp.user.account.login` | 账号切换登录（`{account, company_id, source, token}`，前端切账号用） |
| `hxl.erp.user.store.switch` | 切换门店 |
| `hxl.erp.user.logout` | 退出 |
| `hxl.erp.account.user.find` / `hxl.account.login.num.check` | 账号查询 / 设备数检查 |
| `hxl.erp.usercolumn.get` | 列表列配置（前端特判） |
| `hxl.erp.user.logincode.send / resetpwdcode.send / resetpwd.find / resetpwd.confirm / voicecode.send` | 旧密码登录/找回体系 |

---

## 5. ERP 业务域 `/erp`（已实测）

### 5.1 门店订单 `hxl.erp.storeorder.*` ✅实测全链路只读

- `POST /erp/hxl.erp.storeorder.page` ✅ — 分页结构见 3.3；`content[i]` 主单字段：

```json
{"fid":"DD«单号»","store_id":«业务ID»,"company_id":«机构号»,
 "store_name":"青岛即墨区中交公园店","store_address":"中交公元F区信义西街126号","store_contact":"郑云义",
 "org_id":«业务ID»,"org_name":"南京万好供应链管理有限公司",
 "state":"AUDIT","type":"STOREHOUSE_DELIVERY","confirm_state":"INIT",
 "money":840.0,"total_money":840.0,"quantity":2.0,"item_count":2,"volume":0.0468,
 "create_by":"«门店名»","create_time":"2026-...","audit_by":"«门店名»"}
```

`data` 同级附汇总：`money, logistics_fee, total_money, delivery_money, direct_money, no_tax_money, quantity, item_count, volume, actually_received_*` 等。

- `POST /erp/hxl.erp.storeorder.read` ✅ — 入参 `{"fid":"DD«单号»"}`；返回主单（60+ 字段，增 `details[]`、`ref_order_infos[]`、`shortage_details[]`、资金字段 `balance/credit_line/frozen_money/available_balance/enable_credit_line`、配送字段 `delivery_out_order_fids/delivery_state/delivery_money` 等）。`details[i]` 核心字段：

```json
{"fid":"DD...","detail_num":1,"item_id":«业务ID»,"item_code":"32060018",
 "item_name":"老厨炒牛肉干香辣味","item_bar_code":"6937549204030","weigh":true,
 "item_category_name":"散称牛肉干/粒","producing_date":"2026-06-30 00:00:00","period":"365天",
 "ref_order_type":"REQUEST","ref_order_fid":"YH«单号»",
 "out_store_id":«业务ID»,"out_store_name":"山东青岛仓",
 "out_storehouse_id":«业务ID»,"out_storehouse_name":"山东青岛分仓中心仓库",
 "unit":"...","quantity":...,"price":...,"money":545.0,
 "delivery_price, delivery_money, delivery_ratio, purchase_spec",
 "receive_quantity, receive_money, out_of_stock_quantity, delivery_quantity",
 "input_tax_rate, no_tax_price, no_tax_money, basic_unit, basic_quantity, basic_price",
 "stock_state, upper_limit, lower_limit, sale_price, image_urls[] ..."}
```

- 写接口（静态，未调用）：`save / update / audit / reaudit / invalid / batchdelete / copy / submit / export / detail.export / print(.read/.readdetail)`。
  审核入参约定 `{fid}`（批量 `{fids:[...]}`），保存体 = read 返回的主单+details 结构。

### 5.2 配送出库 `hxl.erp.deliveryoutorder.*` ✅分页实测

`page / read / audit / reaudit(.tmp.reaudit 特判) / invalid / batchdelete / export / detail.export / print / item.page`
查询条件常用：`fid, store_id, out_store_id, state, create_time_start/end, delivery_date_*`。

### 5.3 门店收货 `hxl.erp.receiveorder.*` ✅分页实测

`page / read / audit / reverse / save / update / copy / export / item.page / receive.summary` 等。

### 5.4 门店退货/要货/申请

- `hxl.erp.storereturnorder.*`（门店退货单全套）
- `hxl.erp.requestorder.*`（要货单，`/erp-mall` 域有 `requestorder.detail.batchexport`）
- `hxl.erp.storeapplyorder.*`（门店申请单）
- `hxl.erp.purchasereplenishanalysis.*`（补货分析：`.find / .read / .item.add / .export / .purchaseorder.create|batchcreate`——采购 OSS 白名单改写目标）

### 5.5 报表

`hxl.erp.purchasereport.*`（最新进价、按门店/供应商/品类汇总、量价分析、缺货预警等 `.page/.find/.export`）。

---

## 6. 库存域 `/erp-stock`（已实测）

### 6.1 库存查询 ✅实测

- `POST /erp-stock/hxl.erp.stock.page` ✅ — 汇总库存分页（门店/仓/商品维度）。
- `POST /erp-stock/hxl.erp.stockdetail.page` ✅ — **批次级**库存明细，`content[i]` 字段：

```json
{"store_code":"1716","store_name":"青岛即墨区中交公园店","storehouse_name":"«门店名»仓库",
 "item_code":"10010277","item_bar_code":"6954491300429","item_name":"正富祥香糯蛋糕草莓味138g",
 "item_type":"STANDARD","purchase_type":"COLLECTIVE_PURCHASE","item_spec":"1*24袋",
 "item_category_name":"烘焙蛋糕","batch_number":"","producing_date":"2023-12-06","expire_date":"2024-04-04",
 "unit":"箱","quantity":1.0417,"valid_quantity":...,"lock_quantity":...,"pre_occupy_quantity":...,
 "cost_price":"****","money":"****","valid_money":61.25196,"sale_money":...,"sale_price":...,
 "basic_unit":"...","basic_quantity":...,"ratio":...,"account_method":"移动加权平均",
 "latest_in_date":"...","latest_supplier_name":"...","main_supplier_name":"...",
 "valid_batch_key_quantity, valid_new_item_quantity, new_item_quantity, normal_quantity, ...",
 "store_id":..., "item_id":..., "storehouse_id":..., "batch_id":...}
```

（成本价/成本额按权限掩码 `"****"`；另有 `*_str` 展示字段成对出现。）

- `hxl.erp.itemstocklog.page` — 库存流水（出入库日志）。

### 6.2 盘点单 `hxl.erp.stockcheckorder.*` ✅分页实测

`page / read / save / update / audit / reaudit / reverse / invalid / finish / lock / unlock / merge / checkinitorder / snapshote.update / item.page / batchdelete / copy / export / file.upload / template.download / updatetemplate.download`

静态分析（前端页面流程）：创建（save，INIT）→ `checkinitorder` 生成盘点初始化 → 录入盘点数（item.page / import）→ `lock` 锁库 → `finish` 完成 → `audit` 审核过账（写操作，未调用）。

### 6.3 库存调整/转换/成本调整

- `stockadjustorder.*`（库存调整单全套，`stockadjustmentreason.find` 取调整原因）
- `stocktransformorder.*`（形态转换单）
- `stockcostadjustorder.*`（成本调整单）

---

## 7. 采购域 `/erp-purchase`（静态 + 权限实测）

> 门店账号实测 `purchaseorder.page` 返回 `1007`（无数据权限）——采购为总部职能，结构与门店订单对称。

- 采购订单 `hxl.erp.purchaseorder.*`：`page / read / save / update / audit / batchaudit / invalid / copy / batchdelete / onway（在途） / receivesummary / reportsummary / relationorder.find / item.page / export / detail.export / import / order.import(.save) / template.download / ordertemplate.download / file.upload / print(.read/.readdetail) / minimumdeliveryquantity.(batch)check / splitorder.check`
- 采购收货 `hxl.erp.receiveorder.*`：`page / read / save / update / audit / batchaudit / batchreverse / createbypurchaseorder / findbypurchaseorder / find.olderp / item.page / itemsummary.find / export / detail.export / import / file.upload / batchcopy / batchdelete / short.page`
- 采购参数 `purchaseparam.read / save`；补货分析 `purchasereplenishanalysis.find / read / item.page / itemstore.find / itemstore.export`；采购报表 `purchasereport.*`（latestprice.page、purchasesummary.supplier/store/category/item 组合 .page）。

---

## 8. 财务域 `/fss`（静态为主）

> 门店账号实测 `storeaccount.page` → 1007；`storeaccount.summary.find` → 2004「日期不能为空」（需 `date`/`create_time_start/end` 类参数）。

实体族（均含 page/read/save/update/audit/reaudit/batchdelete/export 标准动作）：

| 实体 | 业务 |
|---|---|
| `clientsettlementorder` | 客户结算单（含 `clientsummary / detail.page / file.upload`） |
| `clientfee` | 客户费用单 |
| `clientadvancecollect` | 客户预收款（`refund / clientsummary(.export)`） |
| `invoiceorder` | 发票单（`confirm / confirmbatch / batchaudit / detail.page`） |
| `labourfee` | 劳务费（`share / supplierfee.save / invoice.delete / file.upload`） |
| `storeaccount` | 门店资金账户（`page / open / close / detail.find / detail.export / summary.find`） |
| `storeadvancecollect` | 门店预收款 |
| `store.short.settlement.page` | 门店结算精简分页 |
| `supplierstatement / supplierfee / supplieradvancepay` 等 | 供应商对账/费用/预付 |

---

## 9. 仓储 `/wms` 与运输 `/tms`

- WMS 入库：`inorder.page / read / save / update / audit / check / batchdelete / export / detail.export / upload`；入库申请 `inapplicationorder.page / read / scm.find`
- WMS 出库：`outorder.page / read / audit ...`（门店账号实测 2004 需指定仓/组织参数）；出库申请 `outapplicationorder.pickorder.diff.create`
- 移库 `movestock.*`（`check / stockdetail.page / copy`）；流水 `itemstocklog.page / summary / change.find`
- 基础：`item.find / item.page / client.find / client.page / channel.find / car.page / carcategory.* / file.delete`
- TMS：`car.page / carrier.page / driver.page / route.page / store.find / storehouse.find / sign.certification(.check)`（电子签收认证，登录模块亦引用）

---

## 10. 供应链协同 `/scm`、批发 `/erp-wholesale`、招商 `/kms`、其他

- SCM：`homepage.card.find / homepage.order.find / homepage.waithandle.find / homepage.newstore.summary / homepage.receive.summary / homepage.purchase.rate`（首页看板，需日期/组织参数）；`itemapplyorder.*`（新品申请：`.save / .audit / .approve / .pass / .batch.pass / .deny / .refuse / .reaudit / .export` 及 `itemapplyorderreport.passrate/shelfrate/successrate.find|export` 报表）；`itemdeliveryorder.*`（配送协同，`receive` 确认收货）；`erp.role.page`。
- 批发：`wholesaleorder.*`（标准全套 + `receive / print / wholesaleprice / template.download`）、`wholesalebookorder.*`（批发订货，`merge / check / wholesaleorder.batchcreate`）、`wholesalereturnapply.*`（退货申请，`approve / approverefuse / handle / handlerefuse` 两级处理）、`wholesaleparam.read`、`wholesalecenterstore.find`。
- KMS 招商：`clientclew.* / clientcluepool.save / clientcluetemplate.* / client.contracttemplate.find / intentmoney.*（意向金 offset） / area.find / businessarea.find / buildtask.* / material.page / dictionary.page / clink.call.login（呼叫）/ fadada.user.find（法大大）/ file.upload`。
- BI：`homepage.card(.detail).find / membercard.find / pospayment.find / waithandle.find / org.psd.find / poscollection.{storesummary, storebizsummary, shiftsummary, operatorsummary, otherinout.detail}.find(|export) / store.category.forecast.find(.all)`。
- OA 审批：`approval.find.all / approvaltask.{send, complete, reject, cancel, transfer, urge, sign} / approvataskhistory.find / approvaltaskhistory.check / approval.commonphrase.find(.batch.save) / organization.child.find / user.page / file.upload`。
- 会员：`cardtype.find / coupontype.page / param.paymenttype.find / tiktok.store.{page,save,update,delete,import,export,template.download}`。
- 零售：`posorder.readbyserialnumber / promotionspecialprice.item.{page,all.choose} / retailpricetemplate.{page,all.choose} / store.ids.page`。
- 上传通用：`POST /{域}/hxl.*.file.upload`，multipart 字段名 `file`，头 `Access-Token`，≤200MB。

---

## 11. 最小可跑通业务流（按本文档可复现）

**流程 A：登录 → 拉取档案与权限 → 查商品/订单/库存**（全部只读，已实测）

1. `POST login-web.../erp-mdm/hxl.account.login.num.check`（2.1）
2. `POST login-web.../idaas/oauth2/token`（2.2）→ IDaaS JWT
3. `POST gdp.../erp-mdm/idaas.erp.user.profile`（2.3）→ ERP `access_token` + userInfo
4. `POST gdp.../erp-mdm/hxl.erp.item.page`（商品）/ `hxl.erp.org.tree`（组织）/ `hxl.erp.client.page`（客户）
5. `POST gdp.../erp/hxl.erp.storeorder.page` → 取 `fid` → `storeorder.read`（订单详情）
6. `POST gdp.../erp-stock/hxl.erp.stockdetail.page`（批次库存）

**流程 B：门店订货链路（结构推演，写步骤未执行）**
要货单 `requestorder` → 门店订单 `storeorder.save`（INIT）→ `storeorder.audit`（{fid}）→ 配送出库 `deliveryoutorder`（仓侧）→ 门店收货 `receiveorder.save/.audit` → 库存流水 `itemstocklog.page` / 库存 `stock.page` 可查回写。

**流程 C：盘点链路（结构推演）**
`stockcheckorder.save` → `checkinitorder` → 明细录入/`import` → `lock` → `finish` → `audit` → `itemstocklog.page` 验证。

---

## 12. Python 最小接入示例（只读）

```python
import requests, uuid

LOGIN = "https://login-web.idaas.ali-prod.xlbsoft.com"
GDP   = "https://gdp.xlbsoft.com"
COMPANY, ACCOUNT, PASSWORD = «机构号», "«账号»", "«密码»"
mac = uuid.uuid4().hex[:16]
s = requests.Session()
s.headers["User-Agent"] = "Mozilla/5.0"

# 1) 设备数检查
s.post(f"{LOGIN}/erp-mdm/hxl.account.login.num.check",
       json={"username": ACCOUNT, "password": PASSWORD, "grant_type": "password",
             "company_id": str(COMPANY), "check_account": ACCOUNT,
             "auth_source": "password", "account": ACCOUNT, "login_source": "WEB"},
       headers={"xlb_device_mac": mac, "company_id": str(COMPANY)}).json()

# 2) IDaaS token
tok = s.post(f"{LOGIN}/idaas/oauth2/token",
       data={"username": ACCOUNT, "password": PASSWORD, "grant_type": "password",
             "company_id": COMPANY, "check_account": ACCOUNT, "auth_source": "password",
             "client_id": "erp", "client_secret": "«client_secret»",
             "login_source": "WEB"},
       headers={"xlb_device_mac": mac}).json()["data"]
jwt_full = f'{tok["token_type"]} {tok["access_token"]}'

# 3) ERP 会话
prof = s.post(f"{GDP}/erp-mdm/idaas.erp.user.profile", json={},
       headers={"Authorization": jwt_full, "xlb_device_mac": mac,
                "machine_desc": "Windows 10/11"}).json()["data"]

H = {"Access-Token": prof["access_token"], "Authorization": jwt_full,
     "Api-Version": "1.5.0", "Company-Id": str(prof["company_id"]),
     "User-Id": str(prof["id"]), "Org-Ids": ",".join(map(str, prof["org_ids"]))}
ENV = {"company_id": prof["company_id"], "operator_store_id": prof["store_id"],
       "operator": prof["id"], "source": "WEB"}

def call(ep, **params):
    return s.post(GDP + ep, json={**ENV, **params}, headers=H, timeout=40).json()

items = call("/erp-mdm/hxl.erp.item.page", page_number=1, page_size=20)
orders = call("/erp/hxl.erp.storeorder.page", page_number=1, page_size=10)
fid = orders["data"]["content"][0]["fid"]
detail = call("/erp/hxl.erp.storeorder.read", fid=fid)
stock = call("/erp-stock/hxl.erp.stockdetail.page", page_number=1, page_size=20)
```

---

## 附录 A：端点总清单（1417 端点 → 665 实体 × 动作）

见同目录附表 `新零帮商业系统-API端点总表.md`（按服务域 × 实体聚合全部动作）。

## 附录 B：已知边界与备注

1. `https://mdm.mdm.ali-prod.xlbsoft.com` 为前端生产 prefix，但公网直连 404；实际可用网关为 `https://gdp.xlbsoft.com` 同源反代。导出类接口前端固定走 mdm 网关 + `responseType:"blob"`，门店账号实测返回 `1007`。
2. 价格类字段按权限掩码：`purchase_price/cost_price/money` 等对无权限账号返回 `"****"`。
3. 测试账号为**门店店长角色**（`店长(PDA)-店务`），总部职能接口（采购、财务、批发、SCM 看板等）返回 `1007`（空 msg）属预期权限行为，并非接口不存在。
4. 前端另有多套历史请求实例（`prefix=""` / hxl-pay / mdm），鉴权头组合略有差异；本文档给出的头组合对所有实测接口有效。
5. 部分响应含 `*_str` 冗余展示字段、审计四件套（create/update_by/time）与 `wms_id` 外部映射 ID。
