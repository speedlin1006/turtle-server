const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { users } = require('../users')
const { careUsers } = require('../careUsers')
const { clientUsers } = require('../clientUsers')
const { verifyToken, logOperation } = require('../utils/helpers')

// ✅ 通用權限檢查
function isAdmin(req) {
  const token = req.headers['authorization']?.split(' ')[1]
  const userInfo = global.activeTokens[token]
  return userInfo?.username === 'pt001'
}

// ✅ 查詢帳號
router.get('/', verifyToken, (req, res) => res.json(users))
router.get('/care-users', verifyToken, (req, res) => res.json(careUsers))
router.get('/client-users', verifyToken, (req, res) => res.json(clientUsers))

// ✅ 新增帳號
router.post('/', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  users.push(req.body)
  fs.writeFileSync('./users.js', `exports.users = ${JSON.stringify(users, null, 2)}\n`)
  logOperation({ type: '新增員工帳號', newData: req.body }, req)
  res.status(201).json({ success: true })
})
router.post('/care-users', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  careUsers.push(req.body)
  fs.writeFileSync('./careUsers.js', `exports.careUsers = ${JSON.stringify(careUsers, null, 2)}\n`)
  logOperation({ type: '新增寄養帳號', newData: req.body }, req)
  res.status(201).json({ success: true })
})
router.post('/client-users', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  clientUsers.push(req.body)
  fs.writeFileSync('./clientUsers.js', `exports.clientUsers = ${JSON.stringify(clientUsers, null, 2)}\n`)
  logOperation({ type: '新增售後帳號', newData: req.body }, req)
  res.status(201).json({ success: true })
})

// ✅ 修改帳號
router.put('/', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  const { originalUsername } = req.body
  const index = users.findIndex(u => u.username === originalUsername)
  if (index !== -1) {
    const oldData = users[index]
    users[index] = req.body
    fs.writeFileSync('./users.js', `exports.users = ${JSON.stringify(users, null, 2)}\n`)
    logOperation({ type: '修改員工帳號', originalUsername, oldData, newData: req.body }, req)
    return res.json({ success: true })
  }
  res.status(404).json({ success: false })
})
router.put('/care-users', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  const { originalUsername } = req.body
  const index = careUsers.findIndex(u => u.username === originalUsername)
  if (index !== -1) {
    const oldData = careUsers[index]
    careUsers[index] = req.body
    fs.writeFileSync('./careUsers.js', `exports.careUsers = ${JSON.stringify(careUsers, null, 2)}\n`)
    logOperation({ type: '修改寄養帳號', originalUsername, oldData, newData: req.body }, req)
    return res.json({ success: true })
  }
  res.status(404).json({ success: false })
})
router.put('/client-users', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  const { originalUsername } = req.body
  const index = clientUsers.findIndex(u => u.username === originalUsername)
  if (index !== -1) {
    const oldData = clientUsers[index]
    clientUsers[index] = req.body
    fs.writeFileSync('./clientUsers.js', `exports.clientUsers = ${JSON.stringify(clientUsers, null, 2)}\n`)
    logOperation({ type: '修改售後帳號', originalUsername, oldData, newData: req.body }, req)
    return res.json({ success: true })
  }
  res.status(404).json({ success: false })
})

// ✅ 刪除帳號
router.delete('/', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  const { username } = req.body
  const index = users.findIndex(u => u.username === username)
  if (index !== -1) {
    const deleted = users[index]
    users.splice(index, 1)
    fs.writeFileSync('./users.js', `exports.users = ${JSON.stringify(users, null, 2)}\n`)
    logOperation({ type: '刪除員工帳號', oldData: deleted }, req)
  }
  res.json({ success: true })
})
router.delete('/care-users', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  const { username } = req.body
  const index = careUsers.findIndex(u => u.username === username)
  if (index !== -1) {
    const deleted = careUsers[index]
    careUsers.splice(index, 1)
    fs.writeFileSync('./careUsers.js', `exports.careUsers = ${JSON.stringify(careUsers, null, 2)}\n`)
    logOperation({ type: '刪除寄養帳號', oldData: deleted }, req)
  }
  res.json({ success: true })
})
router.delete('/client-users', verifyToken, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: '沒有權限' })
  const { username } = req.body
  const index = clientUsers.findIndex(u => u.username === username)
  if (index !== -1) {
    const deleted = clientUsers[index]
    clientUsers.splice(index, 1)
    fs.writeFileSync('./clientUsers.js', `exports.clientUsers = ${JSON.stringify(clientUsers, null, 2)}\n`)
    logOperation({ type: '刪除售後帳號', oldData: deleted }, req)
  }
  res.json({ success: true })
})

module.exports = router
