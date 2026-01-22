import mysql from 'mysql2/promise';
import ExcelJS from 'exceljs';
import fs from 'fs';

async function exportRealData() {
  let connection;
  try {
    console.log('正在连接数据库...\n');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: 'gateway03.us-east-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: 'XTqR3P9v8tSgKnm.root',
      password: 'K8QY1lPVu2ESLyh9b89m',
      database: 'jHCPjtWAoWrQh3F8kPBEFC',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('✅ 数据库连接成功\n');
    
    // 获取所有客户
    const [allUsers] = await connection.query('SELECT * FROM stockUsers ORDER BY id');
    console.log(`✅ 查询到 ${allUsers.length} 个客户`);
    
    // 获取所有每日登记数据
    const [allBalances] = await connection.query('SELECT * FROM stockBalances ORDER BY stockUserId, date');
    console.log(`✅ 查询到 ${allBalances.length} 条每日登记记录\n`);
    
    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    
    // 创建总结工作表
    const ws_summary = workbook.addWorksheet('数据总结');
    ws_summary.addRow(['项目', '数值', '说明']);
    ws_summary.addRow(['客户总数', allUsers.length, '所有股票客户']);
    ws_summary.addRow(['每日登记记录总数', allBalances.length, '所有客户的每日记录']);
    ws_summary.addRow(['导出时间', new Date().toLocaleString('zh-CN'), '备份生成时间']);
    
    // 创建客户列表工作表
    const ws_users = workbook.addWorksheet('客户列表');
    ws_users.addRow(['客户ID', '客户名称', '初始资金', '记录数', '最后更新日期', '当前余额', '累计盈亏', '收益率']);
    
    for (const user of allUsers) {
      const userBalances = allBalances.filter(b => b.stockUserId === user.id);
      const lastBalance = userBalances[userBalances.length - 1];
      const lastDate = lastBalance ? new Date(lastBalance.date).toLocaleDateString('zh-CN') : '无记录';
      const cumulativePnL = lastBalance ? lastBalance.balance - user.initialBalance : 0;
      const returnRate = user.initialBalance > 0 ? (cumulativePnL / user.initialBalance * 100).toFixed(2) : 0;
      
      ws_users.addRow([
        user.id,
        user.name,
        user.initialBalance,
        userBalances.length,
        lastDate,
        lastBalance?.balance || 0,
        cumulativePnL,
        returnRate + '%'
      ]);
    }
    
    // 创建完整的每日登记数据工作表
    const ws_daily = workbook.addWorksheet('每日登记数据');
    ws_daily.addRow(['客户ID', '客户名称', '日期', '余额', '日盈亏', '累计盈亏', '备注', '登记时间']);
    
    for (const balance of allBalances) {
      const user = allUsers.find(u => u.id === balance.stockUserId);
      const userName = user ? user.name : '未知客户';
      const dailyPnL = balance.dailyPnL || 0;
      const cumulativePnL = balance.cumulativePnL || 0;
      
      ws_daily.addRow([
        balance.stockUserId,
        userName,
        new Date(balance.date).toLocaleDateString('zh-CN'),
        balance.balance,
        dailyPnL,
        cumulativePnL,
        balance.notes || '',
        new Date(balance.createdAt).toLocaleString('zh-CN')
      ]);
    }
    
    // 为每个客户创建单独的工作表
    for (const user of allUsers) {
      const userBalances = allBalances.filter(b => b.stockUserId === user.id);
      
      if (userBalances.length > 0) {
        const ws_user = workbook.addWorksheet(`${user.id}-${user.name}`.substring(0, 31));
        ws_user.addRow(['日期', '余额', '日盈亏', '累计盈亏', '备注', '登记时间', '初始资金', '收益率']);
        
        for (const balance of userBalances) {
          const cumulativePnL = balance.cumulativePnL || (balance.balance - user.initialBalance);
          const returnRate = (cumulativePnL / user.initialBalance * 100).toFixed(2) + '%';
          const dailyPnL = balance.dailyPnL || 0;
          
          ws_user.addRow([
            new Date(balance.date).toLocaleDateString('zh-CN'),
            balance.balance,
            dailyPnL,
            cumulativePnL,
            balance.notes || '',
            new Date(balance.createdAt).toLocaleString('zh-CN'),
            user.initialBalance,
            returnRate
          ]);
        }
      }
    }
    
    // 保存 Excel 文件
    await workbook.xlsx.writeFile('/home/ubuntu/real_data_export.xlsx');
    console.log('✅ Excel 文件已导出: /home/ubuntu/real_data_export.xlsx');
    
    // 保存 JSON 文件
    const jsonData = {
      exportInfo: {
        exportTime: new Date().toISOString(),
        customerCount: allUsers.length,
        recordCount: allBalances.length
      },
      customers: allUsers,
      records: allBalances
    };
    fs.writeFileSync('/home/ubuntu/real_data_export.json', JSON.stringify(jsonData, null, 2));
    console.log('✅ JSON 文件已导出: /home/ubuntu/real_data_export.json');
    
    // 保存 CSV 文件
    let csvContent = '客户ID,客户名称,初始资金,日期,余额,日盈亏,累计盈亏,备注,登记时间\n';
    for (const balance of allBalances) {
      const user = allUsers.find(u => u.id === balance.stockUserId);
      const userName = user ? user.name : '未知';
      const dailyPnL = balance.dailyPnL || 0;
      const cumulativePnL = balance.cumulativePnL || 0;
      csvContent += `${balance.stockUserId},${userName},${user?.initialBalance || 0},${new Date(balance.date).toLocaleDateString('zh-CN')},${balance.balance},${dailyPnL},${cumulativePnL},"${balance.notes || ''}",${new Date(balance.createdAt).toLocaleString('zh-CN')}\n`;
    }
    fs.writeFileSync('/home/ubuntu/real_data_export.csv', csvContent);
    console.log('✅ CSV 文件已导出: /home/ubuntu/real_data_export.csv');
    
    console.log(`\n📊 导出统计:`);
    console.log(`   - 客户总数: ${allUsers.length}`);
    console.log(`   - 每日登记记录: ${allBalances.length}`);
    console.log(`\n✅ 所有数据导出完成！`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 导出失败:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

exportRealData();
