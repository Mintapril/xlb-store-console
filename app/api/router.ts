import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./authRouter";
import { bizRouter } from "./bizRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  biz: bizRouter,
});

export type AppRouter = typeof appRouter;
