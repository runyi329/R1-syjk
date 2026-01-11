import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../db';

describe('Users Admin API - 用户管理功能', () => {
  let testUserId: number;
  let testUsername: string;

  beforeAll(async () => {
    // 创建测试用户
    testUsername = `testuser_${Date.now()}`;
    const testUser = await db.registerUserWithPassword(
      testUsername,
      db.hashPassword('password123'),
      '测试用户'
    );
    
    if (!testUser) {
      throw new Error('Failed to create test user');
    }
    
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      await db.deleteUser(testUserId);
    } catch (error) {
      // 用户可能已被删除
      console.log('Test user cleanup:', error);
    }
  });

  describe('修改用户名功能', () => {
    it('应该成功修改用户名', async () => {
      const newName = '新用户名';
      
      await db.updateUserName(testUserId, newName);

      // 验证用户名已更新
      const user = await db.getUserById(testUserId);
      expect(user?.name).toBe(newName);
    });

    it('应该能够多次修改用户名', async () => {
      const firstName = '第一个名字';
      const secondName = '第二个名字';
      
      await db.updateUserName(testUserId, firstName);
      let user = await db.getUserById(testUserId);
      expect(user?.name).toBe(firstName);

      await db.updateUserName(testUserId, secondName);
      user = await db.getUserById(testUserId);
      expect(user?.name).toBe(secondName);
    });
  });

  describe('删除用户功能', () => {
    it('应该成功删除用户及其所有相关数据', async () => {
      // 创建一个新的测试用户用于删除
      const deleteUsername = `deleteme_${Date.now()}`;
      const userToDelete = await db.registerUserWithPassword(
        deleteUsername,
        db.hashPassword('password123'),
        '待删除用户'
      );

      if (!userToDelete) {
        throw new Error('Failed to create user to delete');
      }

      const deleteUserId = userToDelete.id;

      // 为用户添加一些数据
      await db.createPointTransaction({
        userId: deleteUserId,
        amount: '100',
        type: 'credit',
        balanceAfter: '100',
        notes: '测试充值',
      });

      // 删除用户
      await db.deleteUser(deleteUserId);

      // 验证用户已被删除
      const deletedUser = await db.getUserById(deleteUserId);
      expect(deletedUser).toBeUndefined();

      // 验证积分流水也被删除
      const transactions = await db.getPointTransactionsByUserId(deleteUserId);
      expect(transactions.length).toBe(0);
    });

    it('应该能够删除没有任何相关数据的用户', async () => {
      // 创建一个新用户
      const simpleUsername = `simple_${Date.now()}`;
      const simpleUser = await db.registerUserWithPassword(
        simpleUsername,
        db.hashPassword('password123'),
        '简单用户'
      );

      if (!simpleUser) {
        throw new Error('Failed to create simple user');
      }

      const simpleUserId = simpleUser.id;

      // 直接删除，不添加任何数据
      await db.deleteUser(simpleUserId);

      // 验证用户已被删除
      const deletedUser = await db.getUserById(simpleUserId);
      expect(deletedUser).toBeUndefined();
    });
  });

  describe('数据完整性测试', () => {
    it('删除用户后，用户名应该可以被重新注册', async () => {
      // 创建用户
      const reusableUsername = `reusable_${Date.now()}`;
      const firstUser = await db.registerUserWithPassword(
        reusableUsername,
        db.hashPassword('password123'),
        '第一个用户'
      );

      if (!firstUser) {
        throw new Error('Failed to create first user');
      }

      const firstUserId = firstUser.id;

      // 删除用户
      await db.deleteUser(firstUserId);

      // 使用相同用户名重新注册
      const secondUser = await db.registerUserWithPassword(
        reusableUsername,
        db.hashPassword('password456'),
        '第二个用户'
      );

      expect(secondUser).toBeDefined();
      expect(secondUser?.username).toBe(reusableUsername);
      expect(secondUser?.id).not.toBe(firstUserId); // 应该是新的ID

      // 清理
      if (secondUser) {
        await db.deleteUser(secondUser.id);
      }
    });
  });

  describe('管理员重设用户密码功能', () => {
    it('应该成功重设用户密码', async () => {
      const oldPassword = 'oldPassword123';
      const newPassword = 'newPassword456';
      
      // 创建测试用户
      const resetUsername = `resetpwd_${Date.now()}`;
      const testUser = await db.registerUserWithPassword(
        resetUsername,
        db.hashPassword(oldPassword),
        '密码重设测试用户'
      );

      if (!testUser) {
        throw new Error('Failed to create test user');
      }

      const userId = testUser.id;

      // 验证旧密码可以登录
      const userBeforeReset = await db.getUserByUsername(resetUsername);
      expect(userBeforeReset).toBeDefined();
      expect(db.verifyPassword(oldPassword, userBeforeReset!.passwordHash!)).toBe(true);

      // 管理员重设密码
      const newPasswordHash = db.hashPassword(newPassword);
      await db.updateUserPassword(userId, newPasswordHash);

      // 验证新密码可以登录
      const userAfterReset = await db.getUserByUsername(resetUsername);
      expect(userAfterReset).toBeDefined();
      expect(db.verifyPassword(newPassword, userAfterReset!.passwordHash!)).toBe(true);

      // 验证旧密码不能登录
      expect(db.verifyPassword(oldPassword, userAfterReset!.passwordHash!)).toBe(false);

      // 清理
      await db.deleteUser(userId);
    });

    it('应该能够重设多个用户的密码', async () => {
      const password1 = 'password1';
      const password2 = 'password2';
      const newPassword = 'newCommonPassword';

      // 创建两个测试用户
      const user1Username = `user1_${Date.now()}`;
      const user2Username = `user2_${Date.now()}`;

      const user1 = await db.registerUserWithPassword(
        user1Username,
        db.hashPassword(password1),
        '用户1'
      );

      const user2 = await db.registerUserWithPassword(
        user2Username,
        db.hashPassword(password2),
        '用户2'
      );

      if (!user1 || !user2) {
        throw new Error('Failed to create test users');
      }

      // 重设两个用户的密码
      const newPasswordHash = db.hashPassword(newPassword);
      await db.updateUserPassword(user1.id, newPasswordHash);
      await db.updateUserPassword(user2.id, newPasswordHash);

      // 验证两个用户都可以用新密码登录
      const user1AfterReset = await db.getUserByUsername(user1Username);
      const user2AfterReset = await db.getUserByUsername(user2Username);

      expect(db.verifyPassword(newPassword, user1AfterReset!.passwordHash!)).toBe(true);
      expect(db.verifyPassword(newPassword, user2AfterReset!.passwordHash!)).toBe(true);

      // 验证旧密码不能登录
      expect(db.verifyPassword(password1, user1AfterReset!.passwordHash!)).toBe(false);
      expect(db.verifyPassword(password2, user2AfterReset!.passwordHash!)).toBe(false);

      // 清理
      await db.deleteUser(user1.id);
      await db.deleteUser(user2.id);
    });

    it('重设密码后用户应该能够正常登录', async () => {
      const oldPassword = 'oldPass123';
      const newPassword = 'newPass456';

      // 创建测试用户
      const loginTestUsername = `logintest_${Date.now()}`;
      const testUser = await db.registerUserWithPassword(
        loginTestUsername,
        db.hashPassword(oldPassword),
        '登录测试用户'
      );

      if (!testUser) {
        throw new Error('Failed to create test user');
      }

      // 管理员重设密码
      const newPasswordHash = db.hashPassword(newPassword);
      await db.updateUserPassword(testUser.id, newPasswordHash);

      // 模拟用户登录（验证密码）
      const userAfterReset = await db.getUserByUsername(loginTestUsername);
      expect(userAfterReset).toBeDefined();
      
      // 验证新密码可以通过验证
      const isPasswordValid = db.verifyPassword(newPassword, userAfterReset!.passwordHash!);
      expect(isPasswordValid).toBe(true);

      // 清理
      await db.deleteUser(testUser.id);
    });
  });
});
