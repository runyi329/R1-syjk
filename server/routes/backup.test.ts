import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import { createContext } from '../_core/context';

describe('Backup API', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // 创建一个超级管理员上下文
    const ctx = await createContext({
      req: {
        headers: {},
        cookies: {},
      } as any,
      res: {} as any,
    });

    // 模拟超级管理员用户
    ctx.user = {
      openId: 'test-admin',
      username: 'test-admin',
      role: 'super_admin',
    } as any;

    caller = appRouter.createCaller(ctx);
  });

  it('should export backup data successfully', async () => {
    const backup = await caller.backup.exportBackup();

    expect(backup).toBeDefined();
    expect(backup.version).toBe('1.0');
    expect(backup.timestamp).toBeDefined();
    expect(backup.exportedBy).toBe('test-admin');
    expect(backup.data).toBeDefined();
    
    // 检查所有表的数据
    expect(backup.data.users).toBeInstanceOf(Array);
    expect(backup.data.pointTransactions).toBeInstanceOf(Array);
    expect(backup.data.products).toBeInstanceOf(Array);
    expect(backup.data.orders).toBeInstanceOf(Array);
    expect(backup.data.deposits).toBeInstanceOf(Array);
    expect(backup.data.withdrawals).toBeInstanceOf(Array);
    expect(backup.data.walletAddresses).toBeInstanceOf(Array);
    expect(backup.data.stockUsers).toBeInstanceOf(Array);
    expect(backup.data.stockBalances).toBeInstanceOf(Array);
    expect(backup.data.stockUserPermissions).toBeInstanceOf(Array);
    expect(backup.data.staffStockPermissions).toBeInstanceOf(Array);

    console.log('Backup data counts:');
    console.log('- users:', backup.data.users.length);
    console.log('- stockUsers:', backup.data.stockUsers.length);
    console.log('- stockBalances:', backup.data.stockBalances.length);
    console.log('- stockUserPermissions:', backup.data.stockUserPermissions.length);
  });

  it('should import backup data successfully', async () => {
    // 先导出当前数据
    const originalBackup = await caller.backup.exportBackup();

    // 创建一个测试备份（只包含少量数据）
    const testBackup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      exportedBy: 'test',
      data: {
        users: [],
        pointTransactions: [],
        products: [],
        orders: [],
        deposits: [],
        withdrawals: [],
        walletAddresses: [],
        stockUsers: originalBackup.data.stockUsers, // 使用现有的股票用户数据
        stockBalances: originalBackup.data.stockBalances,
        stockUserPermissions: originalBackup.data.stockUserPermissions,
        staffStockPermissions: originalBackup.data.staffStockPermissions,
      },
    };

    // 导入备份
    const result = await caller.backup.importBackup({
      backup: testBackup,
      overwrite: false,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('成功');
    
    console.log('Import result:', result);
  });
});
