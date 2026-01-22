import { getDb } from './server/db.ts';
import * as schema from './drizzle/schema.ts';
import ExcelJS from 'exceljs';

async function exportDatabase() {
  const workbook = new ExcelJS.Workbook();
  
  try {
    console.log('开始导出数据库...\n');
    
    const db = await getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 获取所有表的数据
    const stockUsers = await db.select().from(schema.stockUsers);
    const stockBalances = await db.select().from(schema.stockBalances);
    const stockUserPermissions = await db.select().from(schema.stockUserPermissions);
    const auditLogs = await db.select().from(schema.auditLogs);
    
    console.log('✅ 数据库查询成功');
    console.log(`- stockUsers: ${stockUsers.length} 条`);
    console.log(`- stockBalances: ${stockBalances.length} 条`);
    console.log(`- stockUserPermissions: ${stockUserPermissions.length} 条`);
    console.log(`- auditLogs: ${auditLogs.length} 条\n`);
    
    // 创建 Excel 工作簿
    const ws_summary = workbook.addWorksheet('导出总结');
    ws_summary.addRow(['表名', '行数', '导出时间']);
    ws_summary.addRow(['stockUsers', stockUsers.length, new Date().toLocaleString('zh-CN')]);
    ws_summary.addRow(['stockBalances', stockBalances.length, new Date().toLocaleString('zh-CN')]);
    ws_summary.addRow(['stockUserPermissions', stockUserPermissions.length, new Date().toLocaleString('zh-CN')]);
    ws_summary.addRow(['auditLogs', auditLogs.length, new Date().toLocaleString('zh-CN')]);
    
    // 导出 stockUsers
    if (stockUsers.length > 0) {
      const ws_users = workbook.addWorksheet('stockUsers');
      ws_users.addRow(Object.keys(stockUsers[0]));
      stockUsers.forEach(row => {
        ws_users.addRow(Object.values(row));
      });
      console.log('✅ stockUsers 已导出');
    }
    
    // 导出 stockBalances
    if (stockBalances.length > 0) {
      const ws_balances = workbook.addWorksheet('stockBalances');
      ws_balances.addRow(Object.keys(stockBalances[0]));
      stockBalances.forEach(row => {
        ws_balances.addRow(Object.values(row));
      });
      console.log('✅ stockBalances 已导出');
    }
    
    // 导出 stockUserPermissions
    if (stockUserPermissions.length > 0) {
      const ws_perms = workbook.addWorksheet('stockUserPermissions');
      ws_perms.addRow(Object.keys(stockUserPermissions[0]));
      stockUserPermissions.forEach(row => {
        ws_perms.addRow(Object.values(row));
      });
      console.log('✅ stockUserPermissions 已导出');
    }
    
    // 导出 auditLogs
    if (auditLogs.length > 0) {
      const ws_logs = workbook.addWorksheet('auditLogs');
      ws_logs.addRow(Object.keys(auditLogs[0]));
      auditLogs.forEach(row => {
        ws_logs.addRow(Object.values(row));
      });
      console.log('✅ auditLogs 已导出');
    }
    
    // 保存文件
    await workbook.xlsx.writeFile('/home/ubuntu/database_backup.xlsx');
    console.log('\n✅ Excel 文件已导出: /home/ubuntu/database_backup.xlsx');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 导出失败:', error);
    process.exit(1);
  }
}

exportDatabase();
