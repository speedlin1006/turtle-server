// ✅ routes/lineNotify.js
const express = require('express')
const router = express.Router()
const axios = require('axios')
require('dotenv').config()

// ✅ 傳送 LINE 通知函式
const sendLineNotify = async (message) => {
  try {
    const userId = process.env.LINE_ADMIN_USER_ID
    if (!userId) throw new Error('LINE_ADMIN_USER_ID 未設定')

    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('✅ 已成功傳送 LINE 通知')
  } catch (err) {
    console.error('❌ 傳送 LINE 通知失敗：', err.response?.data || err.message)
  }
}

// ✅ 提供測試 API（可選）
router.post('/test', async (req, res) => {
  const { message } = req.body
  await sendLineNotify(message || '這是測試通知')
  res.json({ success: true })
})

module.exports = { router, sendLineNotify }
