import { getDb } from './server/db.ts';
import * as schema from './drizzle/schema.ts';
import ExcelJS from 'exceljs';
import { desc, asc } from 'drizzle-orm';

async function exportCompleteData() {
  const workbook = new ExcelJS.Workbook();
  
  try {
    console.log('开始导出完整的每日登记数据...\n');
    
    const db = await getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 获取所有客户
    const allUsers = await db.select().from(schema.stockUsers).orderBy(asc(schema.stockUsers.id));
    console.log(`✅ 查询到 ${allUsers.length} 个客户`);
    
    // 获取所有每日登记数据
    const allBalances = await db.select().from(schema.stockBalances).orderBy(asc(schema.stockBalances.stockUserId), asc(schema.stockBalances.date));
    console.log(`✅ 查询到 ${allBalances.length} 条每日登记记录\n`);
    
    // 创建总结工作表
    const ws_summary = workbook.addWorksheet('数据总结');
    ws_summary.addRow(['项目', '数值', '说明']);
    ws_summary.addRow(['客户总数', allUsers.length, '所有股票客户']);
    ws_summary.addRow(['每日登记记录总数', allBalances.length, '所有客户的每日记录']);
    ws_summary.addRow(['导出时间', new Date().toLocaleString('zh-CN'), '备份生成时间']);
    ws_summary.addRow(['数据库版本', '4c27af63', '项目版本']);
    
    // 创建客户列表工作表
    const ws_users = workbook.addWorksheet('客户列表');
    ws_users.addRow(['客户ID', '客户名称', '初始资金', '记录数', '最后更新日期']);
    
    for (const user of allUsers) {
      const userBalances = allBalances.filter(b => b.stockUserId === user.id);
      const lastBalance = userBalances[userBalances.length - 1];
      const lastDate = lastBalance ? new Date(lastBalance.date).toLocaleDateString('zh-CN') : '无记录';
      
      ws_users.addRow([
        user.id,
        user.name,
        user.initialBalance,
        userBalances.length,
        lastDate
      ]);
    }
    
    // 创建完整的每日登记数据工作表
    const ws_daily = workbook.addWorksheet('每日登记数据');
    ws_daily.addRow(['客户ID', '客户名称', '日期', '余额', '日盈亏', '累计盈亏', '备注', '登记时间']);
    
    for (const balance of allBalances) {
      const user = allUsers.find(u => u.id === balance.stockUserId);
      const userName = user ? user.name : '未知客户';
      const initialBalance = user ? user.initialBalance : 0;
      
      // 计算累计盈亏
      const cumulativePnL = balance.balance - initialBalance;
      
      ws_daily.addRow([
        balance.stockUserId,
        userName,
        new Date(balance.date).toLocaleDateString('zh-CN'),
        balance.balance,
        balance.notes || '无备注',  // 使用 notes 字段作为日盈亏说明
        cumulativePnL,
        balance.notes || '',
        new Date(balance.createdAt).toLocaleString('zh-CN')
      ]);
    }
    
    // 为每个客户创建单独的工作表
    for (const user of allUsers) {
      const userBalances = allBalances.filter(b => b.stockUserId === user.id);
      
      if (userBalances.length > 0) {
        const ws_user = workbook.addWorksheet(`客户${user.id}-${user.name}`.substring(0, 31));
        ws_user.addRow(['日期', '余额', '备注', '登记时间', '初始资金', '累计盈亏', '收益率']);
        
        for (const balance of userBalances) {
          const cumulativePnL = balance.balance - user.initialBalance;
          const returnRate = (cumulativePnL / user.initialBalance * 100).toFixed(2) + '%';
          
          ws_user.addRow([
            new Date(balance.date).toLocaleDateString('zh-CN'),
            balance.balance,
            balance.notes || '',
            new Date(balance.createdAt).toLocaleString('zh-CN'),
            user.initialBalance,
            cumulativePnL,
            returnRate
          ]);
        }
      }
    }
    
    // 保存文件
    await workbook.xlsx.writeFile('/home/ubuntu/database_complete_backup.xlsx');
    console.log('✅ Excel 文件已导出: /home/ubuntu/database_complete_backup.xlsx');
    console.log(`\n📊 导出统计:`);
    console.log(`   - 客户总数: ${allUsers.length}`);
    console.log(`   - 每日登记记录: ${allBalances.length}`);
    console.log(`   - 工作表数量: ${workbook.worksheets.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    process.exit(1);
  }
}

exportCompleteData();
