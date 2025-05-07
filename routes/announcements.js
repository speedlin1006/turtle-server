// routes/announcements.js
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { verifyToken, logOperation } = require('../utils/helpers')
const {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement
} = require('../announcements.js')

const announcementsPath = path.join(__dirname, '../announcements.json')

// ✅ 取得公告
router.get('/', (req, res) => {
  res.json(getAnnouncements())
})

// ✅ 新增公告
router.post('/', verifyToken, (req, res) => {
  const { text, visible = true, expireAt, user } = req.body
  if (!text || text.trim() === '') {
    return res.status(400).json({ success: false, message: '公告內容不可空白' })
  }
  addAnnouncement({ text, visible, expireAt })
  logOperation({ type: '新增公告', text, visible, expireAt, user: user || '未知使用者' }, req)
  res.status(201).json({ success: true })
})

// ✅ 修改公告可見性
router.patch('/:id', verifyToken, (req, res) => {
  const { id } = req.params
  const { visible } = req.body
  const list = getAnnouncements()
  const index = list.findIndex(a => a.id === id)
  if (index === -1) {
    return res.status(404).json({ success: false, message: '找不到公告' })
  }
  list[index].visible = visible
  fs.writeFileSync(announcementsPath, JSON.stringify(list, null, 2))
  res.json({ success: true })
})

// ✅ 刪除公告
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params
  const { user } = req.body
  const success = deleteAnnouncement(id)
  if (success) {
    logOperation({ type: '刪除公告', id, user: user || '未知使用者' }, req)
    res.json({ success: true })
  } else {
    res.status(404).json({ success: false })
  }
})

module.exports = router
