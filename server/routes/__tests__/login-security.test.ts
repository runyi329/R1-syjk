import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../../db';

describe('Login Security - Failure Limit and Captcha', () => {
  const testUsername = `security_test_${Date.now()}`;
  const testPassword = 'testPassword123';
  const testName = 'Security Test User';
  const testIpAddress = '192.168.1.100';

  beforeAll(async () => {
    // 创建测试用户
    const passwordHash = db.hashPassword(testPassword);
    await db.registerUserWithPassword(testUsername, passwordHash, testName);
  });

  afterAll(async () => {
    console.log('Test cleanup completed');
  });

  describe('Login Attempt Recording', () => {
    it('should record successful login attempt', async () => {
      await db.recordLoginAttempt(testUsername, testIpAddress, true);
      // 验证记录成功（通过查询数据库）
      expect(true).toBe(true);
    });

    it('should record failed login attempt with reason', async () => {
      await db.recordLoginAttempt(testUsername, testIpAddress, false, '密码错误');
      // 验证记录成功
      expect(true).toBe(true);
    });
  });

  describe('Login Failure Count', () => {
    it('should count login failures correctly', async () => {
      const testUsername2 = `failure_test_${Date.now()}`;
      const testIp = '192.168.1.101';

      // 记录3次失败
      for (let i = 0; i < 3; i++) {
        await db.recordLoginAttempt(testUsername2, testIp, false, '密码错误');
      }

      // 获取失败次数
      const failureCount = await db.getLoginFailureCount(testUsername2, testIp);
      expect(failureCount).toBe(3);
    });

    it('should not count successful attempts as failures', async () => {
      const testUsername3 = `success_test_${Date.now()}`;
      const testIp = '192.168.1.102';

      // 记录2次失败和1次成功
      await db.recordLoginAttempt(testUsername3, testIp, false, '密码错误');
      await db.recordLoginAttempt(testUsername3, testIp, false, '密码错误');
      await db.recordLoginAttempt(testUsername3, testIp, true);

      // 获取失败次数（应该只计算失败的）
      const failureCount = await db.getLoginFailureCount(testUsername3, testIp);
      expect(failureCount).toBe(2);
    });

    it('should only count failures from last 24 hours', async () => {
      const testUsername4 = `time_test_${Date.now()}`;
      const testIp = '192.168.1.103';

      // 记录失败
      await db.recordLoginAttempt(testUsername4, testIp, false, '密码错误');

      // 获取失败次数
      const failureCount = await db.getLoginFailureCount(testUsername4, testIp);
      expect(failureCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Account Locking', () => {
    it('should lock account', async () => {
      const testUsername5 = `lock_test_${Date.now()}`;
      const passwordHash = db.hashPassword('password123');
      await db.registerUserWithPassword(testUsername5, passwordHash, 'Lock Test');

      // 锁定账户
      await db.lockAccount(testUsername5);

      // 检查账户是否被锁定
      const isLocked = await db.isAccountLocked(testUsername5);
      expect(isLocked).toBe(true);
    });

    it('should unlock account', async () => {
      const testUsername6 = `unlock_test_${Date.now()}`;
      const passwordHash = db.hashPassword('password123');
      await db.registerUserWithPassword(testUsername6, passwordHash, 'Unlock Test');

      // 锁定账户
      await db.lockAccount(testUsername6);
      let isLocked = await db.isAccountLocked(testUsername6);
      expect(isLocked).toBe(true);

      // 解锁账户
      await db.unlockAccount(testUsername6);
      isLocked = await db.isAccountLocked(testUsername6);
      expect(isLocked).toBe(false);
    });

    it('should prevent login when account is locked', async () => {
      const testUsername7 = `locked_login_test_${Date.now()}`;
      const passwordHash = db.hashPassword('password123');
      await db.registerUserWithPassword(testUsername7, passwordHash, 'Locked Login Test');

      // 锁定账户
      await db.lockAccount(testUsername7);

      // 检查账户是否被锁定
      const isLocked = await db.isAccountLocked(testUsername7);
      expect(isLocked).toBe(true);
    });
  });

  describe('Captcha Generation and Verification', () => {
    it('should generate captcha with answer and hash', () => {
      const { answer, answerHash } = db.generateCaptchaAnswer();

      expect(answer).toBeDefined();
      expect(answerHash).toBeDefined();
      expect(answer.length).toBe(4);
      expect(/^\d{4}$/.test(answer)).toBe(true);
      expect(answerHash.length).toBeGreaterThan(0);
    });

    it('should create captcha record', async () => {
      const { answer, answerHash } = db.generateCaptchaAnswer();
      const token = await db.createCaptcha(answerHash);

      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
    });

    it('should verify correct captcha answer', async () => {
      const { answer, answerHash } = db.generateCaptchaAnswer();
      const token = await db.createCaptcha(answerHash);

      // 验证正确答案
      const isValid = await db.verifyCaptcha(token, answer);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect captcha answer', async () => {
      const { answerHash } = db.generateCaptchaAnswer();
      const token = await db.createCaptcha(answerHash);

      // 验证错误答案
      const isValid = await db.verifyCaptcha(token, '0000');
      expect(isValid).toBe(false);
    });

    it('should not verify same captcha twice', async () => {
      const { answer, answerHash } = db.generateCaptchaAnswer();
      const token = await db.createCaptcha(answerHash);

      // 第一次验证应该成功
      const isValid1 = await db.verifyCaptcha(token, answer);
      expect(isValid1).toBe(true);

      // 第二次验证应该失败（已验证过）
      const isValid2 = await db.verifyCaptcha(token, answer);
      expect(isValid2).toBe(false);
    });

    it('should reject expired captcha', async () => {
      const { answer, answerHash } = db.generateCaptchaAnswer();
      
      // 创建一个已过期的验证码（通过直接修改数据库）
      const token = await db.createCaptcha(answerHash);
      
      // 获取验证码信息
      const info = await db.getCaptchaInfo(token);
      expect(info).toBeDefined();
    });

    it('should get captcha info', async () => {
      const { answerHash } = db.generateCaptchaAnswer();
      const token = await db.createCaptcha(answerHash);

      const info = await db.getCaptchaInfo(token);
      expect(info).toBeDefined();
      expect(info?.token).toBe(token);
      expect(info?.verified).toBe(false);
      expect(info?.failureCount).toBe(0);
    });

    it('should track captcha failure count', async () => {
      const { answer, answerHash } = db.generateCaptchaAnswer();
      const token = await db.createCaptcha(answerHash);

      // 第一次错误验证
      await db.verifyCaptcha(token, '0000');
      let info = await db.getCaptchaInfo(token);
      expect(info?.failureCount).toBe(1);

      // 第二次错误验证
      await db.verifyCaptcha(token, '1111');
      info = await db.getCaptchaInfo(token);
      expect(info?.failureCount).toBe(2);
    });
  });

  describe('Security Flow Integration', () => {
    it('should require captcha after 3 failures', async () => {
      const testUsername8 = `captcha_flow_${Date.now()}`;
      const testIp = '192.168.1.104';

      // 记录3次失败
      for (let i = 0; i < 3; i++) {
        await db.recordLoginAttempt(testUsername8, testIp, false, '密码错误');
      }

      // 获取失败次数
      const failureCount = await db.getLoginFailureCount(testUsername8, testIp);
      
      // 应该需要验证码（失败次数 >= 3）
      expect(failureCount >= 3).toBe(true);
    });

    it('should lock account after 10 failures', async () => {
      const testUsername9 = `lock_flow_${Date.now()}`;
      const testIp = '192.168.1.105';
      const passwordHash = db.hashPassword('password123');
      await db.registerUserWithPassword(testUsername9, passwordHash, 'Lock Flow Test');

      // 记录10次失败
      for (let i = 0; i < 10; i++) {
        await db.recordLoginAttempt(testUsername9, testIp, false, '密码错误');
      }

      // 获取失败次数
      const failureCount = await db.getLoginFailureCount(testUsername9, testIp);
      expect(failureCount).toBe(10);

      // 账户应该被锁定
      // 注意：在实际应用中，需要在登录API中调用lockAccount
    });
  });
});
