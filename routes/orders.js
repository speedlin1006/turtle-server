const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { verifyToken, logOperation } = require('../utils/helpers')
const { sendLineNotify } = require('./lineNotify')

const ordersPath = path.join(__dirname, '../orders.json')

// 初始化訂單檔案
if (!fs.existsSync(ordersPath)) {
  fs.writeFileSync(ordersPath, JSON.stringify([]))
}

function readOrders() {
  try {
    const data = fs.readFileSync(ordersPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

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
  )
}

// ✅ 前台公開：新增訂單（不需驗證）
router.post('/', async (req, res) => {
  const order = req.body
  if (!order || !order.contact || !order.cart) {
    return res.status(400).json({ success: false })
  }

  const orders = readOrders()
  const newOrder = {
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
    deleted: false,
    status: '未確認'
  }
  orders.push(newOrder)
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2))

  logOperation({
    type: '新增訂單',
    orderId: newOrder.createdAt,
    contact: newOrder.contact,
    items: newOrder.cart
  })

  try {
    const { name, phone, address } = newOrder.contact
    const lineContact = newOrder.contact.line || newOrder.contact.lineId || newOrder.contact.lineName || '未提供'

    console.log('🧾 新訂單聯絡資料：', newOrder.contact)
    console.log('🧾 商品清單：', newOrder.cart)

    const items = newOrder.cart
      .map(item => {
        const quantity = item.quantity || 1
        return `${item.name} x${quantity}（單價：$${item.price}）`
      })
      .join('\n')

    const message = `有新訂單成立！\n\n姓名：${name}\n電話：${phone}\n地址：${address}\nLINE 聯絡方式：${lineContact}\n\n商品內容：\n${items}`

    await sendLineNotify(message)
  } catch (err) {
    console.warn('⚠️ 傳送 LINE 通知失敗', err.message)
  }

  res.status(201).json({ success: true })
})

// ✅ 查詢未刪除訂單（需登入）
router.get('/', verifyToken, (req, res) => {
  const orders = readOrders()
  res.json(orders.filter(o => !o.deleted))
})

// ✅ 查詢已刪除訂單（需登入）
router.get('/deleted', verifyToken, (req, res) => {
  const orders = readOrders()
  res.json(orders.filter(o => o.deleted))
})

// ✅ 刪除訂單（需登入）
router.delete('/:createdAt', verifyToken, (req, res) => {
  const { createdAt } = req.params
  const { reason, user } = req.body
  const orders = readOrders()

  const index = orders.findIndex(order => String(order.createdAt) === String(createdAt))
  if (index === -1) return res.status(404).json({ success: false })

  orders[index].deleted = true
  orders[index].deleteReason = reason
  orders[index].deletedAt = new Date().toISOString()

  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2))
  logOperation({ type: '刪除訂單', createdAt, reason, user: user || '未知使用者' }, req)

  res.json({ success: true })
})

// ✅ 修改訂單狀態（需登入）
router.post('/status', verifyToken, (req, res) => {
  const { orderId, newStatus, user } = req.body
  if (!orderId || !newStatus) return res.status(400).json({ success: false })

  const orders = readOrders()
  const index = orders.findIndex(order => String(order.createdAt) === String(orderId))
  if (index === -1) return res.status(404).json({ success: false })

  const oldStatus = orders[index].status || '未設定'
  orders[index].status = newStatus
  orders[index].statusUpdatedAt = new Date().toISOString()

  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2))

  let orderNo = ''
  try {
    orderNo = formatOrderId(orderId)
  } catch {
    orderNo = '[轉換失敗]'
  }

  logOperation({
    type: '修改訂單狀態',
    orderId,
    orderNo,
    oldStatus,
    newStatus,
    user: user || '未知使用者'
  })

  res.json({ success: true })
})

module.exports = router
