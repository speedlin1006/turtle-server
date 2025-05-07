const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { verifyToken, logOperation } = require('../utils/helpers')

const filePath = path.join(__dirname, '../clientUsers.json')

// 初始化
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([]))
}

// 取得全部使用者
router.get('/', verifyToken, (req, res) => {
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  res.json(users.filter(u => !u.deleted))
})

// 取得已刪除使用者
router.get('/deleted', verifyToken, (req, res) => {
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  res.json(users.filter(u => u.deleted))
})

// 新增使用者
router.post('/', verifyToken, (req, res) => {
  const { username } = req.body
  if (!username) return res.status(400).json({ success: false })

  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  users.push({ ...req.body, createdAt: new Date().toISOString(), deleted: false })

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
  logOperation({ type: '新增寄養使用者', username }, req)
  res.json({ success: true })
})

// 軟刪除使用者
router.delete('/:username', verifyToken, (req, res) => {
  const { username } = req.params
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const index = users.findIndex(u => u.username === username)

  if (index === -1) return res.status(404).json({ success: false })

  users[index].deleted = true
  users[index].deletedAt = new Date().toISOString()

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
  logOperation({ type: '刪除寄養使用者', username }, req)
  res.json({ success: true })
})

module.exports = router
