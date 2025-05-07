const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000


require('./utils/globals')
require('./zipAndUpload') // ⏰ 啟用每日 00:30 備份


app.use(cors())
app.use(bodyParser.json())

// ✅ 靜態資源
app.use(express.static('public'))
app.use('/turtle-individuals', express.static(path.join(__dirname, 'uploads/turtle-individuals')))

// ✅ API 路由
app.use('/api/breeds', require('./routes/breeds'))
app.use('/upload', require('./routes/upload.js'))
app.use('/login', require('./routes/login'))
app.use('/api/shop', require('./routes/shop'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/announcements', require('./routes/announcements'))
app.use('/api/users', require('./routes/users'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/client-users', require('./routes/clientUsers'))
app.use('/api/care-users', require('./routes/careUsers'))
app.use('/api/individuals', require('./routes/individuals'))

// ✅ 自訂影片路由（避免自動下載）
app.get('/turtle-details/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public/turtle-details', req.params.filename)

  // 檢查檔案是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found')
  }

  // 設定影片 Header
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

// ✅ 啟動伺服器
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`)
})
console.log('🚀 這是我的 turtle-server，正在啟動')
