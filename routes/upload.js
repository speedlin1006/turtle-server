// routes/upload.js 或 upload.cjs
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

// ✅ 動態設定上傳目錄與檔名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)
    const folder = isImage ? 'shop' : 'videos'
    const uploadPath = path.join(__dirname, '..', 'public', folder)

    // 若目錄不存在則自動建立
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const timestamp = Date.now()
    cb(null, `${timestamp}${ext}`)
  }
})

const upload = multer({ storage })

// ✅ 上傳單一檔案（圖片或影片）
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未收到檔案' })
  }

  const ext = path.extname(req.file.originalname).toLowerCase()
  const folder = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? 'shop' : 'videos'
  const fileUrl = `/` + folder + `/` + req.file.filename

  res.json({ success: true, url: fileUrl })
})

module.exports = router
