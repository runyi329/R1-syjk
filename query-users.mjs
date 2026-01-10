import 'dotenv/config';
import mysql from 'mysql2/promise';

async function queryUsers() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [rows] = await connection.execute(
      `SELECT id, openId, name, username, email, role, usdtBalance, vipLevel, registerMethod, createdAt 
       FROM users 
       ORDER BY createdAt DESC`
    );
    
    console.log('\n=== 注册用户列表 ===\n');
    console.log(`总共 ${rows.length} 个注册用户\n`);
    
    rows.forEach((user, index) => {
      console.log(`--- 用户 ${index + 1} ---`);
      console.log(`ID: ${user.id}`);
      console.log(`OpenID: ${user.openId}`);
      console.log(`昵称: ${user.name || '未设置'}`);
      console.log(`用户名: ${user.username || '未设置'}`);
      console.log(`邮箱: ${user.email || '未设置'}`);
      console.log(`角色: ${user.role}`);
      console.log(`USDT余额: ${user.usdtBalance}`);
      console.log(`VIP等级: ${user.vipLevel || 0}`);
      console.log(`注册方式: ${user.registerMethod || 'oauth'}`);
      console.log(`注册时间: ${user.createdAt}`);
      console.log('');
    });
    
  } finally {
    await connection.end();
  }
}

queryUsers().catch(console.error);
