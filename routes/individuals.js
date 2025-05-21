const express = require('express')
const router = express.Router()
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const Individual = require('../models/Individual') // ✅ MongoDB 模型

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const upload = multer({ storage: multer.memoryStorage() })

// ✅ 上傳 buffer 到 Cloudinary 的 helper
const uploadToCloudinary = (file, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    )
    streamifier.createReadStream(file.buffer).pipe(stream)
  })
}

// ✅ 取得所有個體
router.get('/', async (req, res) => {
  try {
    const individuals = await Individual.find().sort({ breedId: 1, id: 1 })
    res.json(individuals)
  } catch (err) {
    res.status(500).json({ error: '無法取得個體資料' })
  }
})

// ✅ 新增個體
router.post('/', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'details', maxCount: 20 },
  { name: 'videos', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('✅ 收到新增個體請求，正在處理上傳')

    const { id, breedId, description } = req.body
    if (!id || !breedId || !req.files['mainImage']) {
      return res.status(400).json({ error: '缺少必要欄位' })
    }

    const exists = await Individual.findOne({ id, breedId })
    if (exists) {
      return res.status(400).json({ error: '該品種下已有相同個體編號' })
    }

    const mainImageUrl = await uploadToCloudinary(req.files['mainImage'][0], 'turtle-individuals', 'image')
    const detailUrls = req.files['details']
      ? await Promise.all(req.files['details']
          .filter(f => f.mimetype.startsWith('image/'))
          .map(f => uploadToCloudinary(f, 'turtle-details', 'image')))
      : []
    const videoUrls = req.files['videos']
      ? await Promise.all(req.files['videos']
          .filter(f => f.mimetype.startsWith('video/'))
          .map(f => uploadToCloudinary(f, 'turtle-details', 'video')))
      : []

    const newIndividual = new Individual({
      id,
      breedId,
      description,
      mainImage: mainImageUrl,
      details: detailUrls,
      videos: videoUrls
    })

    await newIndividual.save()
    res.json({ message: '新增成功', data: newIndividual })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '上傳或儲存失敗' })
  }
})

// ✅ 修改個體
router.put('/:id', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'details', maxCount: 20 },
  { name: 'videos', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params
    const { breedId } = req.query
    console.log('✅ 收到修改請求:', id, breedId)

    const existing = await Individual.findOne({ id, breedId })
    if (!existing) return res.status(404).json({ error: '找不到該個體' })

    if (req.body.description) existing.description = req.body.description

    if (req.files['mainImage']) {
      existing.mainImage = await uploadToCloudinary(req.files['mainImage'][0], 'turtle-individuals', 'image')
    }

    if (req.files['details']) {
      existing.details = await Promise.all(req.files['details']
        .filter(f => f.mimetype.startsWith('image/'))
        .map(f => uploadToCloudinary(f, 'turtle-details', 'image')))
    }

    if (req.files['videos']) {
      existing.videos = await Promise.all(req.files['videos']
        .filter(f => f.mimetype.startsWith('video/'))
        .map(f => uploadToCloudinary(f, 'turtle-details', 'video')))
    }

    await existing.save()
    res.json({ message: '修改成功', data: existing })
  } catch (err) {
    console.error('❌ 修改失敗:', err)
    res.status(500).json({ error: '修改失敗' })
  }
})

// ✅ 刪除個體
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const { breedId } = req.query

  if (!id || !breedId) {
    return res.status(400).json({ error: '缺少必要參數' })
  }

  try {
    const deleted = await Individual.findOneAndDelete({ id, breedId })
    if (!deleted) {
      return res.status(404).json({ error: '找不到該個體' })
    }
    res.json({ message: '刪除成功' })
  } catch (err) {
    console.error('❌ 刪除失敗:', err)
    res.status(500).json({ error: '刪除失敗' })
  }
})

module.exports = router
