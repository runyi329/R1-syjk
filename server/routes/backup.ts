import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  pointTransactions, 
  products, 
  orders, 
  deposits, 
  withdrawals, 
  walletAddresses,
  stockUsers,
  stockBalances,
  stockUserPermissions,
  staffStockPermissions
} from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

export const backupRouter = router({
  // 导出所有数据
  exportBackup: adminProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // 导出所有表的数据
        const [
          usersData,
          pointTransactionsData,
          productsData,
          ordersData,
          depositsData,
          withdrawalsData,
          walletAddressesData,
          stockUsersData,
          stockBalancesData,
          stockUserPermissionsData,
          staffStockPermissionsData
        ] = await Promise.all([
          db.select().from(users),
          db.select().from(pointTransactions),
          db.select().from(products),
          db.select().from(orders),
          db.select().from(deposits),
          db.select().from(withdrawals),
          db.select().from(walletAddresses),
          db.select().from(stockUsers),
          db.select().from(stockBalances),
          db.select().from(stockUserPermissions),
          db.select().from(staffStockPermissions)
        ]);

        // 构建备份数据对象
        const backup = {
          version: "1.0",
          timestamp: new Date().toISOString(),
          exportedBy: ctx.user.username,
          data: {
            users: usersData,
            pointTransactions: pointTransactionsData,
            products: productsData,
            orders: ordersData,
            deposits: depositsData,
            withdrawals: withdrawalsData,
            walletAddresses: walletAddressesData,
            stockUsers: stockUsersData,
            stockBalances: stockBalancesData,
            stockUserPermissions: stockUserPermissionsData,
            staffStockPermissions: staffStockPermissionsData
          }
        };

        return backup;
      } catch (error) {
        console.error("导出数据失败:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "导出数据失败",
        });
      }
    }),

  // 导入备份数据
  importBackup: adminProcedure
    .input(z.object({
      backup: z.any(), // 接受任意JSON数据
      overwrite: z.boolean().default(false) // 是否覆盖现有数据
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const { backup, overwrite } = input;

        // 验证备份数据格式
        if (!backup.version || !backup.data) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "备份文件格式不正确",
          });
        }

        // 注意：已禁用覆盖模式以保护生产数据
        // 所有导入都采用合并模式，不会删除现有数据
        if (overwrite) {
          console.warn(
            "[Backup] 覆盖模式已禁用，以保护生产数据安全。" +
            "所有数据将以合并模式导入。"
          );
          // 不执行任何删除操作，仅进行合并导入
        }

        // 导入数据
        const { data } = backup;

        // 按依赖顺序导入数据
        if (data.users && data.users.length > 0) {
          for (const user of data.users) {
            // 跳过当前登录用户，避免冲突
            if (user.id === ctx.user.id) continue;
            
            try {
              await db.insert(users).values(user);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.pointTransactions && data.pointTransactions.length > 0) {
          for (const transaction of data.pointTransactions) {
            try {
              await db.insert(pointTransactions).values(transaction);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.products && data.products.length > 0) {
          for (const product of data.products) {
            try {
              await db.insert(products).values(product);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.orders && data.orders.length > 0) {
          for (const order of data.orders) {
            try {
              await db.insert(orders).values(order);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.deposits && data.deposits.length > 0) {
          for (const deposit of data.deposits) {
            try {
              await db.insert(deposits).values(deposit);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.withdrawals && data.withdrawals.length > 0) {
          for (const withdrawal of data.withdrawals) {
            try {
              await db.insert(withdrawals).values(withdrawal);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.walletAddresses && data.walletAddresses.length > 0) {
          for (const address of data.walletAddresses) {
            try {
              await db.insert(walletAddresses).values(address);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.stockUsers && data.stockUsers.length > 0) {
          for (const stockUser of data.stockUsers) {
            try {
              await db.insert(stockUsers).values(stockUser);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.stockBalances && data.stockBalances.length > 0) {
          for (const balance of data.stockBalances) {
            try {
              await db.insert(stockBalances).values(balance);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.stockUserPermissions && data.stockUserPermissions.length > 0) {
          for (const permission of data.stockUserPermissions) {
            try {
              await db.insert(stockUserPermissions).values(permission);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        if (data.staffStockPermissions && data.staffStockPermissions.length > 0) {
          for (const permission of data.staffStockPermissions) {
            try {
              await db.insert(staffStockPermissions).values(permission);
            } catch (e) {
              // 如果ID冲突，跳过
            }
          }
        }

        return {
          success: true,
          message: "数据导入成功",
          importedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error("导入数据失败:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "导入数据失败",
        });
      }
    })
});
