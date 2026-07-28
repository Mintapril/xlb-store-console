import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { signPayload, verifyPayload } from "./security";
import type { XlbSession } from "./xlb/client";

/**
 * 无状态会话：新零帮真实系统的令牌与档案打包签名后写入 HttpOnly Cookie。
 * 不依赖任何本地数据库。
 */
export const SESSION_COOKIE = "xlb_real_session";
const SESSION_MAX_AGE = 60 * 60 * 12; // 12h，与 ERP 会话寿命匹配

function readCookie(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function writeSession(ctx: TrpcContext, session: XlbSession) {
  const packed = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const value = `${packed}.${signPayload(packed)}`;
  ctx.resHeaders.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`,
  );
}

export function destroySession(ctx: TrpcContext) {
  ctx.resHeaders.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

export function getSession(ctx: TrpcContext): XlbSession | undefined {
  const raw = readCookie(ctx.req, SESSION_COOKIE);
  if (!raw) return undefined;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return undefined;
  const packed = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!verifyPayload(packed, sig)) return undefined;
  try {
    return JSON.parse(Buffer.from(packed, "base64url").toString("utf8")) as XlbSession;
  } catch {
    return undefined;
  }
}

export function requireSession(ctx: TrpcContext): XlbSession {
  const session = getSession(ctx);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录" });
  }
  return session;
}
