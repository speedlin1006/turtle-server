const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'announcements.json')

// 如果檔案不存在就創一個空陣列
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]))

// 讀取公告
function getAnnouncements() {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

// 新增公告（新版，支援 text / visible / expireAt）
function addAnnouncement({ text, visible = true, expireAt = null }) {
  const list = getAnnouncements()
  const now = new Date()

  const pad = (n) => n.toString().padStart(2, '0')
  const id =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())

  list.push({
    id,
    text,
    visible,
    expireAt,
    createdAt: now.toISOString()
  })

  fs.writeFileSync(filePath, JSON.stringify(list, null, 2))
}

// 刪除公告（加成功與否回傳）
function deleteAnnouncement(id) {
  const announcements = getAnnouncements()
  const updated = announcements.filter(a => a.id !== id)
  const found = announcements.length !== updated.length
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))
  return found
}

module.exports = {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement
}
