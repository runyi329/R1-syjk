import { describe, it, expect } from "vitest";
import { getKlineDataByYears } from "./db";

/**
 * K线数据查询测试
 * 验证 schema.ts 中的列名修复是否生效
 */
describe("KlineData Schema Fix", () => {
  it("should query kline data with correct column names", async () => {
    console.log("\n========================================");
    console.log("开始测试 K线数据查询");
    console.log("========================================\n");
    
    console.log("[步骤 1/4] 准备查询参数...");
    console.log("  - 交易对: BTCUSDT");
    console.log("  - 时间周期: 1分钟");
    console.log("  - 查询年份: 2024");
    console.log("");
    
    console.log("[步骤 2/4] 执行数据库查询...");
    console.log("  - 正在查询 kline_data 表");
    console.log("  - 预计查询时间: 15-20秒（数据量较大）");
    console.log("");
    
    const startTime = Date.now();
    const result = await getKlineDataByYears("BTCUSDT", "1m", [2024]);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`[步骤 3/4] 查询完成！耗时: ${duration}秒`);
    console.log(`  - 查询到 ${result.length} 条记录`);
    console.log("");
    
    console.log("[步骤 4/4] 验证查询结果...");
    
    // 验证查询成功（不抛出列名错误）
    console.log("  ✓ 查询成功，未抛出列名错误");
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    console.log("  ✓ 返回结果是数组类型");
    
    // 如果有数据，验证字段存在
    if (result.length > 0) {
      console.log("");
      console.log("验证数据字段...");
      const firstRow = result[0];
      
      // 验证所有字段都存在
      console.log("  - 检查必需字段...");
      expect(firstRow).toHaveProperty("id");
      console.log("    ✓ id");
      expect(firstRow).toHaveProperty("symbol");
      console.log("    ✓ symbol");
      expect(firstRow).toHaveProperty("interval");
      console.log("    ✓ interval");
      expect(firstRow).toHaveProperty("openTime");
      console.log("    ✓ openTime (数据库列名: open_time)");
      expect(firstRow).toHaveProperty("open");
      console.log("    ✓ open");
      expect(firstRow).toHaveProperty("high");
      console.log("    ✓ high");
      expect(firstRow).toHaveProperty("low");
      console.log("    ✓ low");
      expect(firstRow).toHaveProperty("close");
      console.log("    ✓ close");
      expect(firstRow).toHaveProperty("volume");
      console.log("    ✓ volume");
      expect(firstRow).toHaveProperty("closeTime");
      console.log("    ✓ closeTime (数据库列名: close_time)");
      expect(firstRow).toHaveProperty("quoteVolume");
      console.log("    ✓ quoteVolume (数据库列名: quote_volume)");
      expect(firstRow).toHaveProperty("trades");
      console.log("    ✓ trades");
      expect(firstRow).toHaveProperty("createdAt");
      console.log("    ✓ createdAt (数据库列名: created_at)");
      
      console.log("");
      console.log("  - 检查字段类型...");
      // 验证字段类型
      expect(typeof firstRow.symbol).toBe("string");
      console.log("    ✓ symbol 是字符串类型");
      expect(typeof firstRow.interval).toBe("string");
      console.log("    ✓ interval 是字符串类型");
      expect(firstRow.openTime).toBeInstanceOf(Date);
      console.log("    ✓ openTime 是日期类型");
      expect(typeof firstRow.open).toBe("string"); // Drizzle returns decimal as string
      console.log("    ✓ open 是字符串类型（Decimal）");
      expect(typeof firstRow.high).toBe("string");
      console.log("    ✓ high 是字符串类型（Decimal）");
      expect(typeof firstRow.low).toBe("string");
      console.log("    ✓ low 是字符串类型（Decimal）");
      expect(typeof firstRow.close).toBe("string");
      console.log("    ✓ close 是字符串类型（Decimal）");
      expect(typeof firstRow.volume).toBe("string");
      console.log("    ✓ volume 是字符串类型（Decimal）");
      expect(firstRow.closeTime).toBeInstanceOf(Date);
      console.log("    ✓ closeTime 是日期类型");
      expect(typeof firstRow.quoteVolume).toBe("string");
      console.log("    ✓ quoteVolume 是字符串类型（Decimal）");
      expect(typeof firstRow.trades).toBe("number");
      console.log("    ✓ trades 是数字类型");
      expect(firstRow.createdAt).toBeInstanceOf(Date);
      console.log("    ✓ createdAt 是日期类型");
      
      console.log("");
      console.log("示例数据:");
      console.log(`  - 时间: ${firstRow.openTime.toISOString()}`);
      console.log(`  - 开盘价: ${firstRow.open}`);
      console.log(`  - 最高价: ${firstRow.high}`);
      console.log(`  - 最低价: ${firstRow.low}`);
      console.log(`  - 收盘价: ${firstRow.close}`);
      console.log(`  - 成交量: ${firstRow.volume}`);
    }
    
    console.log("");
    console.log("========================================");
    console.log("✅ 测试通过！Schema 修复成功！");
    console.log("========================================");
    console.log("");
  }, 30000); // 30秒超时，因为查询可能较慢
});
