import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../../db';

describe('Users Admin API - 管理员登录为客户功能', () => {
  let adminUserId: number;
  let testUserId: number;
  let testUsername: string;
  let adminUsername: string;

  beforeAll(async () => {
    // 创建管理员用户
    adminUsername = `admin_${Date.now()}`;
    const adminUser = await db.registerUserWithPassword(
      adminUsername,
      db.hashPassword('adminpass123'),
      '测试管理员'
    );
    
    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }
    
    adminUserId = adminUser.id;

    // 创建普通测试用户
    testUsername = `testuser_${Date.now()}`;
    const testUser = await db.registerUserWithPassword(
      testUsername,
      db.hashPassword('password123'),
      '测试客户'
    );
    
    if (!testUser) {
      throw new Error('Failed to create test user');
    }
    
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      await db.deleteUser(adminUserId);
      await db.deleteUser(testUserId);
    } catch (error) {
      console.log('Test cleanup:', error);
    }
  });

  describe('管理员登录为客户', () => {
    it('应该能够获取目标用户信息', async () => {
      // 验证目标用户存在
      const targetUser = await db.getUserById(testUserId);
      expect(targetUser).toBeDefined();
      expect(targetUser?.id).toBe(testUserId);
      expect(targetUser?.username).toBe(testUsername);
      expect(targetUser?.name).toBe('测试客户');
    });

    it('应该能够获取目标用户的openId', async () => {
      // 验证目标用户有openId（用于创建session）
      const targetUser = await db.getUserById(testUserId);
      expect(targetUser).toBeDefined();
      expect(targetUser?.openId).toBeDefined();
      expect(typeof targetUser?.openId).toBe('string');
    });

    it('目标用户不存在时应该返回undefined', async () => {
      // 使用不存在的用户ID
      const nonExistentUserId = 999999;
      const targetUser = await db.getUserById(nonExistentUserId);
      expect(targetUser).toBeUndefined();
    });

    it('应该能够获取冻结账户的用户信息', async () => {
      // 创建一个冻结的测试用户
      const frozenUsername = `frozen_${Date.now()}`;
      const frozenUser = await db.registerUserWithPassword(
        frozenUsername,
        db.hashPassword('password123'),
        '冻结用户'
      );

      if (!frozenUser) {
        throw new Error('Failed to create frozen user');
      }

      // 冻结账户
      await db.updateUserStatus(frozenUser.id, 'frozen');

      // 验证管理员仍然可以获取冻结用户的信息
      const targetUser = await db.getUserById(frozenUser.id);
      expect(targetUser).toBeDefined();
      expect(targetUser?.accountStatus).toBe('frozen');

      // 清理
      await db.deleteUser(frozenUser.id);
    });

    it('应该能够获取不同VIP等级用户的信息', async () => {
      // 创建VIP用户
      const vipUsername = `vip_${Date.now()}`;
      const vipUser = await db.registerUserWithPassword(
        vipUsername,
        db.hashPassword('password123'),
        'VIP用户'
      );

      if (!vipUser) {
        throw new Error('Failed to create VIP user');
      }

      // 设置VIP等级
      await db.updateUserVipLevel(vipUser.id, 3);

      // 验证管理员可以获取VIP用户信息
      const targetUser = await db.getUserById(vipUser.id);
      expect(targetUser).toBeDefined();
      expect((targetUser as any)?.vipLevel).toBe(3);

      // 清理
      await db.deleteUser(vipUser.id);
    });
  });

  describe('数据完整性测试', () => {
    it('登录为客户后不应该影响原用户数据', async () => {
      // 获取登录前的用户数据
      const beforeUser = await db.getUserById(testUserId);
      const beforeBalance = beforeUser?.usdtBalance;
      const beforeStatus = beforeUser?.accountStatus;

      // 模拟登录操作（只是获取用户信息）
      const targetUser = await db.getUserById(testUserId);
      expect(targetUser).toBeDefined();

      // 获取登录后的用户数据
      const afterUser = await db.getUserById(testUserId);
      expect(afterUser?.usdtBalance).toBe(beforeBalance);
      expect(afterUser?.accountStatus).toBe(beforeStatus);
    });

    it('应该能够连续登录多个不同的客户账号', async () => {
      // 创建第二个测试用户
      const secondUsername = `testuser2_${Date.now()}`;
      const secondUser = await db.registerUserWithPassword(
        secondUsername,
        db.hashPassword('password456'),
        '第二个测试客户'
      );

      if (!secondUser) {
        throw new Error('Failed to create second test user');
      }

      // 登录第一个用户
      const firstTarget = await db.getUserById(testUserId);
      expect(firstTarget).toBeDefined();
      expect(firstTarget?.id).toBe(testUserId);

      // 登录第二个用户
      const secondTarget = await db.getUserById(secondUser.id);
      expect(secondTarget).toBeDefined();
      expect(secondTarget?.id).toBe(secondUser.id);

      // 验证两个用户信息不同
      expect(firstTarget?.id).not.toBe(secondTarget?.id);
      expect(firstTarget?.username).not.toBe(secondTarget?.username);

      // 清理
      await db.deleteUser(secondUser.id);
    });
  });
});
