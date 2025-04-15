// turtle-server/index.js

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { users } from './users.js'
import { fosterUsers } from './fosterUsers.js'

console.log("🔥 index.js 啟動中：這是你目前跑的檔案")

const app = express()
const PORT = 3000

app.use(cors())
app.use(bodyParser.json())

app.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)

  if (user) {
    res.status(200).json({ success: true, message: '登入成功' })
  } else {
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
  }
})

app.post('/login/foster', (req, res) => {
  const { username, password } = req.body
  console.log('🟢 收到寄養登入請求', username, password)

  const user = fosterUsers.find(u => u.username === username && u.password === password)

  if (user) {
    res.status(200).json({ success: true, message: '寄養登入成功' })
  } else {
    res.status(401).json({ success: false, message: '帳號或密碼錯誤' })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`)
})

console.log("🚀 這是我的 turtle-server，正在啟動")
