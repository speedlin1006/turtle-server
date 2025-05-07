// utils/helpers.js
const fs = require('fs')
const path = require('path')

// 操作日誌路徑
const logsPath = path.join(__dirname, '../operationLogs.json')

// ✅ 驗證 Token（可用在所有需要驗證的路由）
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token || !global.activeTokens[token]) {
    return res.status(401).json({ success: false, message: '未授權，請重新登入' })
  }
  req.user = global.activeTokens[token] // ✅ 把使用者資訊加進 req 裡
  next()
}

// ✅ 寫入操作日誌（會自動補上使用者名稱）
function logOperation(data, req = null) {
  let logs = []
  try {
    logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8') || '[]')
  } catch {
    logs = []
  }

  const userDisplayName = req?.user?.name || req?.user?.username || data.user || '未知'

  logs.push({
    ...data,
    time: new Date().toISOString(),
    user: userDisplayName
  })

  fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2))
}

module.exports = {
  verifyToken,
  logOperation
}
