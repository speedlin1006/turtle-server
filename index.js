// turtle-server/index.js

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { users } from './users.js'
import { careUsers } from './careUsers.js' // ✅ 改名為 careUsers，對應 LoginCare.vue

console.log('🔥 index.js 啟動中：這是你目前跑的檔案')

const app = express()
const PORT = 3000

// ✅ 中介層
app.use(cors())
app.use(bodyParser.json())

// ✅ 員工登入（/login）
app.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)

  if (user) {
    console.log('🟢 員工登入成功', username)
    res.status(200).json({ success: true, message: '登入成功' })
  } else {
    console.log('🔴 員工登入失敗', username)
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
  }
})

// ✅ 寄養登入（/login/care）
app.post('/login/care', (req, res) => {
  const { username, password } = req.body
  const user = careUsers.find(u => u.username === username && u.password === password)

  if (user) {
    console.log('🟢 寄養登入成功', username)
    res.status(200).json({ success: true, message: '寄養登入成功' })
  } else {
    console.log('🔴 寄養登入失敗', username)
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
  }
})

// ✅ 啟動伺服器
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`)
})

console.log('🚀 這是我的 turtle-server，正在啟動')
