// routes/login.js
const express = require('express')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { users } = require('../users')
const { careUsers } = require('../careUsers')
const { clientUsers } = require('../clientUsers')

const router = express.Router()
const logsPath = path.join(__dirname, '../operationLogs.json')

function logOperation(record) {
  const logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8') || '[]')
  logs.push({ ...record, time: new Date().toISOString() })
  fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2))
}

function addLoginRoute(route, userList, type) {
  router.post(route, (req, res) => {
    const user = userList.find(
      u => u.username === req.body.username && u.password === req.body.password
    )
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')

      // ✅ 將帳號與名稱都儲存到 token 中
      global.activeTokens[token] = {
        username: user.username,
        name: user.name
      }

      // ✅ 日誌中也記錄名稱
      logOperation({ type: `${type}登入成功`, username: user.username, name: user.name }, req)

      const response = { success: true, token }
      if (user.name) response.name = user.name
      if (user.username) response.username = user.username
      return res.json(response)
    } else {
      return res.status(401).json({ success: false })
    }
  })
}

// ✅ 請注意：這裡的路徑要配合 index.cjs 中掛載的 /login
addLoginRoute('/', users, '員工')
addLoginRoute('/care', careUsers, '寄養')
addLoginRoute('/client', clientUsers, '售後')

module.exports = router
