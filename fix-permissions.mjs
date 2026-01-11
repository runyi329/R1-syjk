import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { users, adminPermissions } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// 查找所有没有权限配置的普通管理员
const staffAdmins = await db.select().from(users).where(eq(users.role, "staff_admin"));

console.log(`找到 ${staffAdmins.length} 个普通管理员`);

for (const admin of staffAdmins) {
  // 检查是否已有权限配置
  const existingPerm = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, admin.id));
  
  if (existingPerm.length === 0) {
    console.log(`为用户 ${admin.username} (ID: ${admin.id}) 创建权限配置...`);
    
    // 创建默认权限配置
    await db.insert(adminPermissions).values({
      userId: admin.id,
      balanceManagement: true,
      userManagement: true,
      permissionManagement: true,
      memberManagement: true,
      staffManagement: false,
      status: "active",
      createdBy: 1, // 假设超级管理员ID为1
    });
    
    console.log(`✓ 权限配置创建成功`);
  } else {
    console.log(`用户 ${admin.username} (ID: ${admin.id}) 已有权限配置`);
  }
}

await connection.end();
console.log("修复完成！");
