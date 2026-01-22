import mysql from 'mysql2/promise';

async function findDB() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'gateway03.us-east-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: 'XTqR3P9v8tSgKnm.root',
      password: 'K8QY1lPVu2ESLyh9b89m',
      ssl: { rejectUnauthorized: false }
    });
    
    const databases = ['6FruK4rvQmB5vXQRdMfWC3', 'VmDUuhTUMTJxLjPQovhMxC', 'dWfvfUieyVkmVGc44bjad7', 'jHCPjtWAoWrQh3F8kPBEFC'];
    
    for (const db of databases) {
      try {
        const [tables] = await connection.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`, [db]);
        const tableNames = tables.map(t => t.TABLE_NAME);
        
        if (tableNames.includes('stockUsers')) {
          console.log(`✅ 找到正确的数据库: ${db}`);
          console.log(`   表: ${tableNames.join(', ')}`);
          process.exit(0);
        }
      } catch (e) {
        // 忽略错误
      }
    }
    
    console.log('❌ 未找到包含 stockUsers 的数据库');
    process.exit(1);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

findDB();
