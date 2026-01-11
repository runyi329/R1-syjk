-- 为所有没有权限配置的普通管理员创建默认权限配置
INSERT INTO adminPermissions (userId, balanceManagement, userManagement, permissionManagement, memberManagement, staffManagement, status, createdBy)
SELECT 
  u.id,
  1, -- balanceManagement = true
  1, -- userManagement = true
  1, -- permissionManagement = true
  1, -- memberManagement = true
  0, -- staffManagement = false
  'active',
  1  -- createdBy = 1 (假设超级管理员ID为1)
FROM users u
WHERE u.role = 'staff_admin'
  AND NOT EXISTS (
    SELECT 1 FROM adminPermissions ap WHERE ap.userId = u.id
  );
