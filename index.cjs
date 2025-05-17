const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const axios = require('axios')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

require('./utils/globals')

app.use(cors())
app.use(express.json({ type: ['application/json', 'application/*+json'] }))

// ✅ 靜態資源
app.use(express.static('public'))
app.use('/turtle-individuals', express.static(path.join(__dirname, 'uploads/turtle-individuals')))

// ✅ API 路由
app.use('/api/breeds', require('./routes/breeds'))
app.use('/upload', require('./routes/upload'))
app.use('/login', require('./routes/login'))
app.use('/api/shop', require('./routes/shop'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/announcements', require('./routes/announcements'))
app.use('/api/users', require('./routes/users'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/client-users', require('./routes/clientUsers'))
app.use('/api/care-users', require('./routes/careUsers'))
app.use('/api/individuals', require('./routes/individuals'))
app.use('/api/backup', require('./routes/backup'))
app.use('/api/line', require('./routes/lineNotify').router) // ✅ LINE Notify 路由

// ✅ 自訂影片串流
app.get('/turtle-details/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public/turtle-details', req.params.filename)
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found')

  if (filePath.endsWith('.mp4')) {
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', 'inline')
  }

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
})

// ✅ 測試 API
app.get('/test', (req, res) => {
  res.send('API OK')
})

// ✅ LINE Webhook 接收訊息（只印出使用者 ID，不自動回覆）
app.post('/webhook/line', async (req, res) => {
  try {
    const events = req.body.events
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source?.userId
        console.log('👤 來自使用者的 LINE ID：', userId)
      }
    }
    res.status(200).end()
  } catch (err) {
    console.error('❌ webhook 錯誤：', err.response?.data || err.message)
    res.status(500).end()
  }
})

// ✅ 啟動伺服器（不再傳 deprecated 參數）
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ 成功連線至 MongoDB Atlas')
    app.listen(PORT, () => {
      console.log(`✅ Server is running at http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ 連線 MongoDB 失敗：', err)
  })

console.log('🚀 這是我的 turtle-server，正在啟動')
