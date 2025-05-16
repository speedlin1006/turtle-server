console.log('🚀 importOrders.js 開始執行...');
require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Order = require('./models/Order');

// 連線 MongoDB（請確認 .env 中有 MONGODB_URI）
require('dotenv').config(); // 如果你有使用 dotenv 管理環境變數

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', (error) => console.error('❌ MongoDB 連線錯誤:', error));
db.once('open', async () => {
  console.log('✅ 已連線至 MongoDB');

  const filePath = path.join(__dirname, 'orders.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ 找不到 orders.json 檔案');
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const orders = JSON.parse(rawData);

  for (const order of orders) {
    const exists = await Order.findOne({ createdAt: order.createdAt });
    if (exists) {
      console.log(`⏩ 已存在訂單：${order.createdAt}，跳過`);
      continue;
    }

    try {
      await Order.create(order);
      console.log(`✅ 匯入訂單：${order.createdAt}`);
    } catch (err) {
      console.error(`❌ 匯入失敗：${order.createdAt}`, err.message);
    }
  }

  console.log('🎉 匯入完成');
  process.exit(0);
});
