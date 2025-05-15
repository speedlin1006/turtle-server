const express = require('express')
const multer = require('multer')
const path = require('path')
const { v2: cloudinary } = require('cloudinary')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
require('dotenv').config()

const router = express.Router()

// ✅ 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// ✅ 設定上傳策略（圖片上傳到 cloudinary 的 turtle-shop 資料夾）
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'turtle-shop',
    format: async (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase()
      return ext.replace('.', '') || 'jpg'
    },
    public_id: (req, file) => Date.now().toString()
  }
})

const upload = multer({ storage })

// ✅ 上傳單一檔案（圖片）
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file || !req.file.path || !req.file.filename) {
    return res.status(400).json({ error: '未收到檔案' })
  }

  // ✅ 同時回傳圖片網址與 public_id
  res.json({
    success: true,
    url: req.file.path,
    public_id: req.file.filename // Cloudinary 回傳的 public_id
  })
})

module.exports = router
