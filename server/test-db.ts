/**
 * 测试数据库工具
 * 为测试提供隔离的数据库连接，防止测试数据污染生产数据库
 * 
 * 使用方式：
 * 1. 在测试文件中导入：import { getTestDb, setupTestDb, teardownTestDb } from "../server/test-db";
 * 2. 在 beforeAll 中调用 setupTestDb() 创建测试数据库
 * 3. 在测试中使用 getTestDb() 获取测试数据库连接
 * 4. 在 afterAll 中调用 teardownTestDb() 清理测试数据库
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

let testDb: ReturnType<typeof drizzle> | null = null;
let testConnection: mysql.Connection | null = null;
let testDatabaseName: string | null = null;

/**
 * 创建独立的测试数据库
 * 这个函数会：
 * 1. 创建一个新的数据库（名称带有时间戳）
 * 2. 执行所有的schema迁移
 * 3. 返回数据库连接
 */
export async function setupTestDb() {
  try {
    // 从环境变量获取生产数据库连接信息
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is required");
    }

    // 解析数据库URL
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = parseInt(url.port || "3306");
    const user = url.username;
    const password = url.password;
    const originalDb = url.pathname.slice(1); // 移除开头的 /

    // 创建临时连接用于创建测试数据库
    const tempConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    // 生成测试数据库名称（带时间戳，确保唯一性）
    testDatabaseName = `${originalDb}_test_${Date.now()}`;

    // 创建测试数据库
    console.log(`[Test DB] Creating test database: ${testDatabaseName}`);
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${testDatabaseName}\``);

    // 关闭临时连接
    await tempConnection.end();

    // 创建测试数据库连接
    const testDbUrl = `mysql://${user}:${password}@${host}:${port}/${testDatabaseName}`;
    testConnection = await mysql.createConnection(testDbUrl);
    testDb = drizzle(testDbUrl);

    // 执行迁移脚本（从drizzle/migrations目录）
    // 这里我们需要手动执行迁移SQL
    const fs = await import("fs");
    const path = await import("path");
    const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");

    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        // 分割SQL语句并执行
        const statements = sql.split(";").filter((s) => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await testConnection.execute(statement);
            } catch (error) {
              console.warn(`[Test DB] Warning executing migration: ${error}`);
            }
          }
        }
      }
    }

    console.log(`[Test DB] Test database setup complete: ${testDatabaseName}`);
    return testDb;
  } catch (error) {
    console.error("[Test DB] Failed to setup test database:", error);
    throw error;
  }
}

/**
 * 获取测试数据库连接
 * 必须在 setupTestDb() 之后调用
 */
export async function getTestDb() {
  if (!testDb) {
    throw new Error(
      "Test database not initialized. Call setupTestDb() in beforeAll() first."
    );
  }
  return testDb;
}

/**
 * 清理测试数据库
 * 删除测试数据库和所有数据
 */
export async function teardownTestDb() {
  try {
    if (testConnection) {
      // 关闭所有连接
      await testConnection.end();
      testConnection = null;
    }

    if (testDatabaseName) {
      // 创建临时连接用于删除测试数据库
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error("DATABASE_URL is required");
      }

      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = parseInt(url.port || "3306");
      const user = url.username;
      const password = url.password;

      const tempConnection = await mysql.createConnection({
        host,
        port,
        user,
        password,
      });

      console.log(`[Test DB] Dropping test database: ${testDatabaseName}`);
      await tempConnection.execute(`DROP DATABASE IF EXISTS \`${testDatabaseName}\``);
      await tempConnection.end();

      testDatabaseName = null;
    }

    testDb = null;
    console.log("[Test DB] Test database cleanup complete");
  } catch (error) {
    console.error("[Test DB] Failed to cleanup test database:", error);
    throw error;
  }
}

/**
 * 重置测试数据库（删除所有数据但保留schema）
 * 用于在测试之间重置状态
 */
export async function resetTestDb() {
  try {
    if (!testConnection) {
      throw new Error("Test database not initialized");
    }

    // 禁用外键约束
    await testConnection.execute("SET FOREIGN_KEY_CHECKS = 0");

    // 获取所有表
    const [tables] = await testConnection.execute<any[]>(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
    );

    // 清空所有表
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      try {
        await testConnection.execute(`TRUNCATE TABLE \`${tableName}\``);
      } catch (error) {
        console.warn(`[Test DB] Warning truncating table ${tableName}: ${error}`);
      }
    }

    // 重新启用外键约束
    await testConnection.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("[Test DB] Test database reset complete");
  } catch (error) {
    console.error("[Test DB] Failed to reset test database:", error);
    throw error;
  }
}
