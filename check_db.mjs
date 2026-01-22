import mysql from 'mysql2/promise';

async function checkDB() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'gateway03.us-east-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: 'XTqR3P9v8tSgKnm.root',
      password: 'K8QY1lPVu2ESLyh9b89m',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('✅ 连接成功\n');
    
    // 查询所有数据库
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('可用的数据库:');
    databases.forEach(db => console.log('  -', Object.values(db)[0]));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkDB();
