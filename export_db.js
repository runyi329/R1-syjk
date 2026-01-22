import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import fs from 'fs';

dotenv.config();

async function exportDatabase() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const workbook = new ExcelJS.Workbook();
  
  try {
    // 获取所有表
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    console.log('开始导出数据库...\n');
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`正在导出表: ${tableName}...`);
      
      // 获取表的列信息
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      // 获取表的数据
      const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
      
      // 创建工作表
      const worksheet = workbook.addWorksheet(tableName);
      
      // 添加表信息行
      worksheet.addRow([`表名: ${tableName}`, `总行数: ${rows.length}`, `导出时间: ${new Date().toLocaleString('zh-CN')}`]);
      worksheet.addRow([]);
      
      // 添加列信息
      const columnNames = columns.map(col => col.COLUMN_NAME);
      const columnInfo = columns.map(col => `${col.COLUMN_NAME} (${col.COLUMN_TYPE}${col.IS_NULLABLE === 'NO' ? ' NOT NULL' : ''})`);
      
      worksheet.addRow(columnInfo);
      worksheet.addRow([]);
      
      // 添加数据
      if (rows.length > 0) {
        worksheet.addRow(columnNames);
        rows.forEach(row => {
          const rowData = columnNames.map(col => {
            const value = row[col];
            // 处理日期和特殊类型
            if (value instanceof Date) {
              return value.toLocaleString('zh-CN');
            }
            return value;
          });
          worksheet.addRow(rowData);
        });
      }
      
      // 设置列宽
      worksheet.columns.forEach((column, index) => {
        column.width = Math.min(30, Math.max(15, columnNames[index]?.length || 15));
      });
    }
    
    // 添加总结表
    const summarySheet = workbook.addWorksheet('导出总结');
    summarySheet.addRow(['表名', '行数', '列数', '导出时间']);
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT * FROM ${table.TABLE_NAME}`);
      const [columns] = await connection.execute(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      `, [table.TABLE_NAME]);
      
      summarySheet.addRow([
        table.TABLE_NAME,
        rows.length,
        columns[0].count,
        new Date().toLocaleString('zh-CN')
      ]);
    }
    
    // 保存文件
    const outputPath = '/home/ubuntu/database_backup.xlsx';
    await workbook.xlsx.writeFile(outputPath);
    console.log(`\n✅ Excel 文件已导出: ${outputPath}`);
    
  } finally {
    await connection.end();
  }
}

exportDatabase().catch(console.error);
