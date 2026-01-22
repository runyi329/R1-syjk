import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { usersRouter } from "./routes/users";
import { pointsRouter } from "./routes/points";
import { productsRouter } from "./routes/products";
import { ordersRouter } from "./routes/orders";
import { depositsRouter } from "./routes/deposits";
import { withdrawalsRouter } from "./routes/withdrawals";
import { walletAddressesRouter } from "./routes/walletAddresses";
import { cryptoRouter } from "./routes/crypto";
import { cumulativeProfitRouter } from "./routes/cumulativeProfit";
import { stocksRouter } from "./routes/stocks";
import { adminPermissionsRouterWithStockPermissions } from "./routes/adminPermissions";
import { backupRouter } from "./routes/backup";
import { siteConfigRouter } from "./routes/siteConfig";
import { quantitativeRouter } from "./routes/quantitative";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  users: usersRouter,
  points: pointsRouter,
  products: productsRouter,
  orders: ordersRouter,
  deposits: depositsRouter,
  withdrawals: withdrawalsRouter,
  walletAddresses: walletAddressesRouter,
  crypto: cryptoRouter,
  cumulativeProfit: cumulativeProfitRouter,
  stocks: stocksRouter,
  adminPermissions: adminPermissionsRouterWithStockPermissions,
  backup: backupRouter,
  siteConfig: siteConfigRouter,
  market: quantitativeRouter.market,
  backtest: quantitativeRouter.backtest,
});

export type AppRouter = typeof appRouter;
