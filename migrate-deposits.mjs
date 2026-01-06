import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baccarat',
});

try {
  console.log('开始迁移充值记录...');

  // 查询所有credit类型的积分流水记录
  const [pointTransactions] = await connection.execute(
    `SELECT id, userId, amount, createdAt, notes 
     FROM pointTransactions 
     WHERE type = 'credit' AND notes LIKE '%充值%'
     ORDER BY createdAt ASC`
  );

  console.log(`找到 ${pointTransactions.length} 条充值记录`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const transaction of pointTransactions) {
    try {
      // 检查是否已经存在对应的deposit记录
      const [existingDeposits] = await connection.execute(
        `SELECT id FROM deposits 
         WHERE userId = ? AND amount = ? AND createdAt = ?`,
        [transaction.userId, transaction.amount, transaction.createdAt]
      );

      if (existingDeposits.length > 0) {
        console.log(`跳过已存在的记录: 用户${transaction.userId}, 金额${transaction.amount}`);
        skippedCount++;
        continue;
      }

      // 创建deposit记录
      await connection.execute(
        `INSERT INTO deposits (userId, amount, network, depositAddress, txHash, status, adminNotes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.userId,
          transaction.amount,
          'Migration', // 标记为迁移记录
          'migrated',
          `migration-${transaction.id}`,
          'confirmed',
          transaction.notes.replace('充值 ', '').replace(' USDT', ''), // 提取备注
          transaction.createdAt,
          transaction.createdAt,
        ]
      );

      migratedCount++;
      console.log(`✓ 已迁移: 用户${transaction.userId}, 金额${transaction.amount} USDT`);
    } catch (error) {
      console.error(`✗ 迁移失败: 用户${transaction.userId}, 金额${transaction.amount}`, error.message);
    }
  }

  console.log(`\n迁移完成！`);
  console.log(`成功迁移: ${migratedCount} 条记录`);
  console.log(`跳过已存在: ${skippedCount} 条记录`);

} catch (error) {
  console.error('迁移过程出错:', error);
} finally {
  await connection.end();
}
