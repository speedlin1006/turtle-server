const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { verifyToken, logOperation } = require('../utils/helpers');
const { sendLineNotify } = require('./lineNotify');

// ✅ 格式化 Order ID
function formatOrderId(id) {
  return (
    id.slice(0, 4) + '年' +
    id.slice(4, 6) + '月' +
    id.slice(6, 8) + '日 ' +
    id.slice(8, 10) + ':' +
    id.slice(10, 12) + ':' +
    id.slice(12, 14) + '.' +
    id.slice(14)
  );
}

// ✅ 前台公開：新增訂單（不需登入）
router.post('/', async (req, res) => {
  const order = req.body;
  if (!order || !order.contact || !order.cart) {
    return res.status(400).json({ success: false });
  }

  const newOrder = new Order({
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
    deleted: false,
    status: '未確認'
  });

  await newOrder.save();

  logOperation({
    type: '新增訂單',
    orderId: newOrder.createdAt,
    contact: newOrder.contact,
    items: newOrder.cart
  });

  try {
    const { name, phone, address, bankcode } = newOrder.contact;
    const lineContact = bankcode || '未提供';

    const items = newOrder.cart
      .map(item => {
        const qty = item.qty || item.quantity || 1;
        return `${item.name} x${qty}（單價：$${item.price}）`;
      })
      .join('\n');

    const message = `有新訂單成立！\n\n姓名：${name}\n電話：${phone}\n地址：${address}\nLINE 聯絡方式：${lineContact}\n\n商品內容：\n${items}`;

    await sendLineNotify(message);
  } catch (err) {
    console.warn('⚠️ 傳送 LINE 通知失敗', err.message);
  }

  res.status(201).json({ success: true });
});

// ✅ 查詢未刪除訂單（需登入）
router.get('/', verifyToken, async (req, res) => {
  const orders = await Order.find({ deleted: false }).sort({ createdAt: -1 });
  res.json(orders);
});

// ✅ 查詢已刪除訂單（需登入）
router.get('/deleted', verifyToken, async (req, res) => {
  const orders = await Order.find({ deleted: true }).sort({ deletedAt: -1 });
  res.json(orders);
});

// ✅ 刪除訂單（需登入）
router.delete('/:createdAt', verifyToken, async (req, res) => {
  const { createdAt } = req.params;
  const { reason, user } = req.body;

  console.log('🗑️ 收到刪除請求：', { createdAt, reason, user }); // ← 新增 log

  const updated = await Order.findOneAndUpdate(
    { createdAt },
    {
      deleted: true,
      deleteReason: reason || '',
      deletedAt: new Date().toISOString()
    },
    { new: true }
  );

  if (!updated) return res.status(404).json({ success: false });

  logOperation({
    type: '刪除訂單',
    createdAt,
    reason,
    user: user || '未知使用者'
  }, req);

  res.json({ success: true });
});

// ✅ 修改訂單狀態（需登入）
router.post('/status', verifyToken, async (req, res) => {
  const { orderId, newStatus, user } = req.body;
  if (!orderId || !newStatus) return res.status(400).json({ success: false });

  const order = await Order.findOne({ createdAt: orderId });
  if (!order) return res.status(404).json({ success: false });

  const oldStatus = order.status || '未設定';
  order.status = newStatus;
  order.statusUpdatedAt = new Date().toISOString();
  await order.save();

  let orderNo = '';
  try {
    orderNo = formatOrderId(orderId);
  } catch {
    orderNo = '[轉換失敗]';
  }

  logOperation({
    type: '修改訂單狀態',
    orderId,
    orderNo,
    oldStatus,
    newStatus,
    user: user || '未知使用者'
  });

  res.json({ success: true });
});

module.exports = router;
