import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { destroySession, requireSession, writeSession } from "./session";
import { xlbLogin, xlbSendSmsCode, xlbSmsLogin, XlbError } from "./xlb/client";

export const authRouter = createRouter({
  /** 发送短信验证码（官方 v1 通道） */
  sendSmsCode: publicQuery
    .input(z.object({ phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "手机号格式不正确") }))
    .mutation(async ({ input }) => {
      try {
        await xlbSendSmsCode(input.phone);
        return { ok: true };
      } catch (error) {
        if (error instanceof XlbError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "发送失败，请稍后重试" });
      }
    }),

  /** 短信验证码登录 */
  smsLogin: publicQuery
    .input(
      z.object({
        phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
        code: z.string().trim().min(4, "请输入验证码"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await xlbSmsLogin(input.phone, input.code);
        writeSession(ctx, session);
        const p = session.profile;
        return {
          account: p.account,
          displayName: p.name,
          storeName: p.store_name,
          companyName: p.company_name,
          role: p.role_name ?? "",
          orgCode: String(p.company_id),
          storeCode: p.store?.store_code ?? "",
        };
      } catch (error) {
        if (error instanceof XlbError) throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "登录网关异常，请稍后重试" });
      }
    }),

  /** 真实登录：机构号 + 账号 + 密码 → 新零帮 IDaaS → ERP 会话 */
  login: publicQuery
    .input(
      z.object({
        orgCode: z.string().trim().min(1, "请输入机构号"),
        username: z.string().trim().min(1, "请输入账号"),
        password: z.string().min(1, "请输入密码"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await xlbLogin(input.orgCode, input.username, input.password);
        writeSession(ctx, session);
        const p = session.profile;
        return {
          account: p.account,
          displayName: p.name,
          storeName: p.store_name,
          companyName: p.company_name,
          role: p.role_name ?? "",
          orgCode: String(p.company_id),
          storeCode: p.store?.store_code ?? "",
        };
      } catch (error) {
        if (error instanceof XlbError) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "登录网关异常，请稍后重试" });
      }
    }),

  me: publicQuery.query(({ ctx }) => {
    const session = requireSession(ctx);
    const p = session.profile;
    return {
      account: p.account,
      displayName: p.name,
      storeName: p.store_name,
      companyName: p.company_name,
      role: p.role_name ?? "",
      orgCode: String(p.company_id),
      storeCode: p.store?.store_code ?? "",
    };
  }),

  logout: publicQuery.mutation(({ ctx }) => {
    destroySession(ctx);
    return { ok: true };
  }),
});
