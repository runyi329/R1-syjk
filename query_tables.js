import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function getTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    console.log('=== 数据库中的所有表 ===');
    tables.forEach(row => {
      console.log(`- ${row.TABLE_NAME}`);
    });
    
    // 获取每个表的行数
    console.log('\n=== 每个表的数据行数 ===');
    for (const table of tables) {
      const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`);
      console.log(`${table.TABLE_NAME}: ${result[0].count} 行`);
    }
    
  } finally {
    await connection.end();
  }
}

getTables().catch(console.error);
