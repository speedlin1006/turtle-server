const express = require('express')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// ✅ 各類帳號資料（從 users 資料夾引入）
const { users } = require('../users/users')
const { careUsers } = require('../users/careUsers')
const { clientUsers } = require('../users/clientUsers')
const { memberUsers } = require('../users/memberUsers')

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

      // ✅ 將帳號與名稱都儲存到全域 token 中
      global.activeTokens[token] = {
        username: user.username,
        name: user.name
      }

      // ✅ 登入成功寫入日誌
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

// ✅ 掛載路由（根據 index.cjs 設定為 app.use('/login', ...））
addLoginRoute('/', users, '員工')
addLoginRoute('/care', careUsers, '寄養')
addLoginRoute('/client', clientUsers, '售後')
addLoginRoute('/member', memberUsers, '會員') 

module.exports = router
