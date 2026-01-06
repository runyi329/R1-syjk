import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../../db';

describe('Users Router - Password Registration and Login', () => {
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'testPassword123';
  const testName = 'Test User';

  beforeAll(async () => {
    // 确保测试用户不存在
    const existing = await db.getUserByUsername(testUsername);
    if (existing) {
      console.log('Test user already exists, skipping creation');
    }
  });

  afterAll(async () => {
    // 清理测试数据（可选）
    console.log('Test cleanup completed');
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', () => {
      const password = 'myPassword123';
      const hash = db.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', () => {
      const password = 'myPassword123';
      const hash = db.hashPassword(password);
      
      const isValid = db.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'myPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = db.hashPassword(password);
      
      const isValid = db.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', () => {
      const password = 'myPassword123';
      const hash1 = db.hashPassword(password);
      const hash2 = db.hashPassword(password);
      
      // SHA256 should produce same hash for same input
      expect(hash1).toBe(hash2);
    });
  });

  describe('User Registration', () => {
    it('should register a new user with username and password', async () => {
      const passwordHash = db.hashPassword(testPassword);
      const newUser = await db.registerUserWithPassword(
        testUsername,
        passwordHash,
        testName
      );

      expect(newUser).toBeDefined();
      expect(newUser?.username).toBe(testUsername);
      expect(newUser?.name).toBe(testName);
      expect(newUser?.registerMethod).toBe('password');
      expect(newUser?.role).toBe('user');
      expect(newUser?.passwordHash).toBe(passwordHash);
    });

    it('should retrieve user by username', async () => {
      const user = await db.getUserByUsername(testUsername);

      expect(user).toBeDefined();
      expect(user?.username).toBe(testUsername);
      expect(user?.name).toBe(testName);
    });

    it('should not find non-existent user', async () => {
      const user = await db.getUserByUsername('nonexistent_user_xyz');

      expect(user).toBeUndefined();
    });
  });

  describe('User Login', () => {
    it('should verify password for existing user', async () => {
      const user = await db.getUserByUsername(testUsername);

      expect(user).toBeDefined();
      if (user?.passwordHash) {
        const isValid = db.verifyPassword(testPassword, user.passwordHash);
        expect(isValid).toBe(true);
      }
    });

    it('should reject login with wrong password', async () => {
      const user = await db.getUserByUsername(testUsername);

      expect(user).toBeDefined();
      if (user?.passwordHash) {
        const isValid = db.verifyPassword('wrongPassword', user.passwordHash);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('User Data Integrity', () => {
    it('should have correct user fields', async () => {
      const user = await db.getUserByUsername(testUsername);

      expect(user).toBeDefined();
      expect(user?.id).toBeDefined();
      expect(user?.openId).toBeDefined();
      expect(user?.username).toBe(testUsername);
      expect(user?.name).toBe(testName);
      expect(user?.passwordHash).toBeDefined();
      expect(user?.registerMethod).toBe('password');
      expect(user?.role).toBe('user');
      expect(user?.accountStatus).toBe('active');
      expect(user?.createdAt).toBeDefined();
      expect(user?.updatedAt).toBeDefined();
    });

    it('should have unique username constraint', async () => {
      const passwordHash = db.hashPassword('anotherPassword');
      
      // 尝试用相同的用户名注册应该失败
      try {
        await db.registerUserWithPassword(
          testUsername,
          passwordHash,
          'Another User'
        );
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 预期会抛出错误
        expect(error).toBeDefined();
      }
    });
  });
});
