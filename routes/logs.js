// routes/logs.js
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { verifyToken } = require('../utils/helpers')

const logsPath = path.join(__dirname, '../operationLogs.json')

// ✅ 取得所有操作日誌（倒序）
router.get('/', verifyToken, (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync(logsPath, 'utf-8') || '[]')
    res.json(logs.reverse())
  } catch (err) {
    console.error('❌ 無法讀取操作日誌', err)
    res.status(500).json({ success: false, message: '無法讀取日誌' })
  }
})

module.exports = router
