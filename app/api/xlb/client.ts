/**
 * 新零帮真实业务系统 API 客户端
 * 依据《新零帮商业系统-业务API文档》实现：
 *  - 登录三段式：设备数检查 → IDaaS 密码授权 → ERP 会话换取
 *  - 业务调用：RPC-over-HTTP，POST /{域}/hxl.{模块}.{实体}.{动作}
 *  - Token 刷新：grant_type=refresh_token 后重新换取 ERP 会话
 */

export const LOGIN_BASE = "https://login-web.idaas.ali-prod.xlbsoft.com";
export const GDP_BASE = "https://gdp.xlbsoft.com";
const CLIENT_ID = "erp";
// IDaaS 网关的 client_secret。官方前端硬编码的公开值，从环境变量注入以避免入库。
// 取值方式见 .env.example。
const CLIENT_SECRET = process.env.XLB_CLIENT_SECRET ?? "";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export class XlbError extends Error {
  code: number;
  constructor(code: number, msg: string) {
    super(msg || `业务系统返回错误码 ${code}`);
    this.code = code;
  }
}

/** ERP 用户档案（userInfo）的子集，随会话保存 */
export type XlbProfile = {
  id: number;
  company_id: number;
  account: string;
  name: string;
  tel?: string;
  store_id: number;
  store_name: string;
  company_name: string;
  role_name?: string;
  org_ids: number[];
  store?: { store_code?: string; org_name?: string; city_code?: string };
};

export type XlbSession = {
  idaasAccessToken: string;
  idaasRefreshToken: string;
  idaasTokenType: string;
  idaasExpiresAt: number; // epoch ms
  erpAccessToken: string;
  erpRefreshToken?: string;
  deviceMac: string;
  profile: XlbProfile;
};

type TokenResponse = {
  code: number;
  msg: string;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
};

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA, ...headers },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new XlbError(res.status, `网关响应异常（HTTP ${res.status}）`);
  }
}

async function postForm(url: string, form: Record<string, string | number>, headers: Record<string, string> = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) body.append(k, String(v));
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, ...headers },
    body: body.toString(),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new XlbError(res.status, `网关响应异常（HTTP ${res.status}）`);
  }
}

function randomMac() {
  return Array.from({ length: 16 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
}

/** 用 IDaaS JWT 换取 ERP 会话与档案 */
async function fetchProfile(idaasTokenType: string, idaasAccessToken: string, deviceMac: string) {
  const resp = await postJson(
    `${GDP_BASE}/erp-mdm/idaas.erp.user.profile`,
    {},
    {
      Authorization: `${idaasTokenType} ${idaasAccessToken}`,
      machine_desc: "Windows 10/11",
      xlb_device_mac: deviceMac,
    },
  );
  if (resp.code !== 0 || !resp.data?.access_token) {
    throw new XlbError(resp.code ?? -1, resp.msg || "换取 ERP 会话失败");
  }
  const d = resp.data;
  const profile: XlbProfile = {
    id: d.id,
    company_id: d.company_id,
    account: d.account,
    name: d.name,
    tel: d.tel,
    store_id: d.store_id,
    store_name: d.store_name,
    company_name: d.company_name,
    role_name: d.role_name,
    org_ids: Array.isArray(d.org_ids) ? d.org_ids : [],
    store: d.store ? { store_code: d.store.store_code, org_name: d.store.org_name, city_code: d.store.city_code } : undefined,
  };
  return { erpAccessToken: d.access_token as string, erpRefreshToken: d.refresh_token as string | undefined, profile };
}

/** 发送短信验证码（v1 通道，无需图形验证码） */
export async function xlbSendSmsCode(phone: string): Promise<void> {
  // 1) 校验手机号是否存在
  const verify = await postJson(`${LOGIN_BASE}/idaas/login.verify.tel.v2`, {
    phone_number: phone,
    auth_scene: "SMS_CODE",
  });
  if (verify.code !== 0 || verify.data !== true) {
    throw new XlbError(verify.code ?? -1, verify.msg || "该手机号未注册或未绑定账号");
  }
  // 2) 发送验证码
  const resp = await postJson(`${LOGIN_BASE}/idaas/login.sms.send`, {
    phone: { phone_number: phone },
    auth_scene: "SMS_CODE",
  });
  if (resp.code !== 0) {
    throw new XlbError(resp.code ?? -1, resp.msg || "验证码发送失败");
  }
}

/** 短信验证码登录：login.sms → auth_ticket → oauth2/token → ERP 会话 */
export async function xlbSmsLogin(phone: string, code: string): Promise<XlbSession> {
  const deviceMac = randomMac();
  const resp = await postJson(`${LOGIN_BASE}/idaas/login.sms`, {
    phone: { phone_number: phone },
    login_source: "WEB",
    login_type: "SMS_CODE",
    captcha: code,
    auth_scene: "SMS_CODE",
  });
  if (resp.code !== 0 || !resp.data?.auth_ticket) {
    throw new XlbError(resp.code ?? -1, resp.msg === "验证码不一致" ? "验证码不正确或已过期" : resp.msg || "登录失败");
  }
  const data = resp.data;
  const accounts = data.user?.accounts ?? [];
  if (accounts.length === 0) throw new XlbError(-1, "该手机号下没有可用账号");
  // 与官方一致：单账号直接换 token；多账号取第一个（如需选择公司可扩展）
  const acct = accounts[0];
  const tokenResp: TokenResponse = await postForm(
    `${LOGIN_BASE}/idaas/oauth2/token`,
    {
      auth_state: "auth_ticket",
      grant_type: "auth_ticket",
      auth_ticket: data.auth_ticket,
      account: acct.account,
      account_id: acct.id,
      user_id: data.user.id,
      store_id: acct.store_id,
      company_id: Number(acct.company_id),
      auth_source: "sms",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      login_source: "WEB",
    },
    { "xlb_device_mac": deviceMac },
  );
  if (tokenResp.code !== 0 || !tokenResp.data?.access_token) {
    throw new XlbError(tokenResp.code ?? -1, tokenResp.msg || "换取登录令牌失败");
  }
  const t = tokenResp.data;
  const { erpAccessToken, erpRefreshToken, profile } = await fetchProfile(t.token_type, t.access_token, deviceMac);
  return {
    idaasAccessToken: t.access_token,
    idaasRefreshToken: t.refresh_token,
    idaasTokenType: t.token_type,
    idaasExpiresAt: Date.now() + (t.expires_in ?? 3600) * 1000,
    erpAccessToken,
    erpRefreshToken,
    deviceMac,
    profile,
  };
}

/** 完整登录：机构号 + 账号 + 密码 */
export async function xlbLogin(orgCode: string, username: string, password: string): Promise<XlbSession> {
  const deviceMac = randomMac();
  const baseParams = {
    username,
    password,
    grant_type: "password",
    company_id: Number(orgCode),
    check_account: username,
    auth_source: "password",
  };
  // 1) 设备数检查（失败不阻断，与原站一致仅做多端提示）
  try {
    await postJson(
      `${LOGIN_BASE}/erp-mdm/hxl.account.login.num.check`,
      { ...baseParams, company_id: String(orgCode), account: username, login_source: "WEB" },
      { "xlb_device_mac": deviceMac, company_id: String(orgCode) },
    );
  } catch {
    /* 忽略设备检查异常，继续授权 */
  }
  // 2) IDaaS 密码授权
  const tokenResp: TokenResponse = await postForm(
    `${LOGIN_BASE}/idaas/oauth2/token`,
    { ...baseParams, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, login_source: "WEB" },
    { "xlb_device_mac": deviceMac },
  );
  if (tokenResp.code !== 0 || !tokenResp.data?.access_token) {
    const msg = tokenResp.msg || "机构号、账号或密码不正确";
    throw new XlbError(tokenResp.code ?? -1, msg === "登录失败" ? "机构号、账号或密码不正确" : msg);
  }
  const t = tokenResp.data;
  // 3) ERP 会话
  const { erpAccessToken, erpRefreshToken, profile } = await fetchProfile(t.token_type, t.access_token, deviceMac);
  return {
    idaasAccessToken: t.access_token,
    idaasRefreshToken: t.refresh_token,
    idaasTokenType: t.token_type,
    idaasExpiresAt: Date.now() + (t.expires_in ?? 3600) * 1000,
    erpAccessToken,
    erpRefreshToken,
    deviceMac,
    profile,
  };
}

/** 刷新 IDaaS token 并重新换取 ERP 会话 */
export async function xlbRefresh(session: XlbSession): Promise<XlbSession> {
  const tokenResp: TokenResponse = await postForm(
    `${GDP_BASE}/idaas/idaas/oauth2/token`,
    {
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: session.idaasRefreshToken,
      login_source: "WEB",
    },
    { "xlb_device_mac": session.deviceMac },
  );
  if (tokenResp.code !== 0 || !tokenResp.data?.access_token) {
    throw new XlbError(tokenResp.code ?? -1, tokenResp.msg || "登录已过期，请重新登录");
  }
  const t = tokenResp.data;
  const { erpAccessToken, erpRefreshToken, profile } = await fetchProfile(t.token_type, t.access_token, session.deviceMac);
  return {
    ...session,
    idaasAccessToken: t.access_token,
    idaasRefreshToken: t.refresh_token ?? session.idaasRefreshToken,
    idaasTokenType: t.token_type,
    idaasExpiresAt: Date.now() + (t.expires_in ?? 3600) * 1000,
    erpAccessToken,
    erpRefreshToken: erpRefreshToken ?? session.erpRefreshToken,
    profile,
  };
}

export type XlbPage<T = Record<string, unknown>> = {
  content: T[];
  total_elements: number;
  total_pages: number;
  number: number;
  size: number;
  [key: string]: unknown;
};

function bizHeaders(session: XlbSession) {
  const p = session.profile;
  return {
    "Access-Token": session.erpAccessToken,
    Authorization: `${session.idaasTokenType} ${session.idaasAccessToken}`,
    "Api-Version": "1.5.0",
    "Company-Id": String(p.company_id),
    "User-Id": String(p.id),
    "Org-Ids": p.org_ids.join(","),
  };
}

function envelope(session: XlbSession, params: Record<string, unknown>) {
  const p = session.profile;
  const body: Record<string, unknown> = {
    company_id: p.company_id,
    operator_store_id: p.store_id,
    operator: p.id,
    source: "WEB",
  };
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") body[k] = v;
  }
  return body;
}

/**
 * 调用业务 RPC。会话过期（2005/1005）时自动刷新并重放一次。
 * 返回 { data, session } —— session 可能已被刷新，调用方需回写 Cookie。
 */
export async function xlbCall<T = unknown>(
  session: XlbSession,
  endpoint: string,
  params: Record<string, unknown> = {},
): Promise<{ data: T; session: XlbSession; raw: Record<string, unknown> }> {
  let current = session;
  const doCall = async () => {
    const resp = await postJson(`${GDP_BASE}${endpoint}`, envelope(current, params), bizHeaders(current));
    return resp as { code: number; msg: string; data: T };
  };
  let resp = await doCall();
  if ((resp.code === 2005 || resp.code === 1005) && current.idaasRefreshToken) {
    current = await xlbRefresh(current);
    resp = await doCall();
  }
  if (resp.code !== 0) {
    throw new XlbError(resp.code, resp.msg || `业务接口返回错误（code=${resp.code}）`);
  }
  return { data: resp.data, session: current, raw: resp as unknown as Record<string, unknown> };
}
