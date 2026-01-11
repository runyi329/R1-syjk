import { getDb } from "./server/_core/db.js";
import { 
  users, 
  pointTransactions, 
  products, 
  orders, 
  deposits, 
  withdrawals, 
  walletAddresses,
  stockUsers,
  stockBalances,
  stockUserPermissions,
  staffStockPermissions
} from "./shared/schema.js";

async function testBackupAPI() {
  console.log("Testing backup API...");
  
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    // 导出所有表的数据
    const [
      usersData,
      pointTransactionsData,
      productsData,
      ordersData,
      depositsData,
      withdrawalsData,
      walletAddressesData,
      stockUsersData,
      stockBalancesData,
      stockUserPermissionsData,
      staffStockPermissionsData
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(pointTransactions),
      db.select().from(products),
      db.select().from(orders),
      db.select().from(deposits),
      db.select().from(withdrawals),
      db.select().from(walletAddresses),
      db.select().from(stockUsers),
      db.select().from(stockBalances),
      db.select().from(stockUserPermissions),
      db.select().from(staffStockPermissions)
    ]);

    console.log("Data counts:");
    console.log("- users:", usersData.length);
    console.log("- pointTransactions:", pointTransactionsData.length);
    console.log("- products:", productsData.length);
    console.log("- orders:", ordersData.length);
    console.log("- deposits:", depositsData.length);
    console.log("- withdrawals:", withdrawalsData.length);
    console.log("- walletAddresses:", walletAddressesData.length);
    console.log("- stockUsers:", stockUsersData.length);
    console.log("- stockBalances:", stockBalancesData.length);
    console.log("- stockUserPermissions:", stockUserPermissionsData.length);
    console.log("- staffStockPermissions:", staffStockPermissionsData.length);

    const backup = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      exportedBy: "test",
      data: {
        users: usersData,
        pointTransactions: pointTransactionsData,
        products: productsData,
        orders: ordersData,
        deposits: depositsData,
        withdrawals: withdrawalsData,
        walletAddresses: walletAddressesData,
        stockUsers: stockUsersData,
        stockBalances: stockBalancesData,
        stockUserPermissions: stockUserPermissionsData,
        staffStockPermissions: staffStockPermissionsData
      }
    };

    console.log("\nBackup object created successfully!");
    console.log("Total size:", JSON.stringify(backup).length, "bytes");
    
    return backup;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

testBackupAPI().then(() => {
  console.log("\nTest completed!");
  process.exit(0);
}).catch(err => {
  console.error("\nTest failed:", err);
  process.exit(1);
});
