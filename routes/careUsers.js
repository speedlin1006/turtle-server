const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { verifyToken, logOperation } = require('../utils/helpers')

const filePath = path.join(__dirname, '../careUsers.json')

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify([]))
}

router.get('/', verifyToken, (req, res) => {
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  res.json(users.filter(u => !u.deleted))
})

router.get('/deleted', verifyToken, (req, res) => {
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  res.json(users.filter(u => u.deleted))
})

router.post('/', verifyToken, (req, res) => {
  const { username } = req.body
  if (!username) return res.status(400).json({ success: false })

  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  users.push({ ...req.body, createdAt: new Date().toISOString(), deleted: false })

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
  logOperation({ type: '新增售後使用者', username }, req)
  res.json({ success: true })
})

router.delete('/:username', verifyToken, (req, res) => {
  const { username } = req.params
  const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const index = users.findIndex(u => u.username === username)

  if (index === -1) return res.status(404).json({ success: false })

  users[index].deleted = true
  users[index].deletedAt = new Date().toISOString()

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
  logOperation({ type: '刪除售後使用者', username }, req)
  res.json({ success: true })
})

module.exports = router
