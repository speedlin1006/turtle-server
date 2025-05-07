const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const dataFile = path.join(__dirname, '../data/individuals.json')
const mainImageDir = path.join(__dirname, '../public/turtle-individuals')
const detailDir = path.join(__dirname, '../public/turtle-details')

if (!fs.existsSync(mainImageDir)) fs.mkdirSync(mainImageDir, { recursive: true })
if (!fs.existsSync(detailDir)) fs.mkdirSync(detailDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'mainImage') cb(null, mainImageDir)
    else cb(null, detailDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`
    cb(null, filename)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.mp4']
  const ext = path.extname(file.originalname).toLowerCase()
  cb(null, allowed.includes(ext))
}

const upload = multer({ storage, fileFilter })

// ✅ 取得所有個體資料
router.get('/', (req, res) => {
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]')
  try {
    const raw = fs.readFileSync(dataFile)
    res.json(JSON.parse(raw))
  } catch (err) {
    res.status(500).json({ error: '資料讀取失敗，請檢查 JSON 格式' })
  }
})

// ✅ 新增個體資料（含主圖／細節圖／影片）
router.post('/', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'details', maxCount: 20 },
  { name: 'videos', maxCount: 10 }
]), (req, res) => {
  try {
    const { id, breedId, description } = req.body
    if (!id || !breedId || !req.files['mainImage']) {
      return res.status(400).json({ error: '缺少必要欄位' })
    }

    // ✅ 額外防呆：只允許正確類型的檔案分類
    if (req.files.details) {
      req.files.details = req.files.details.filter(file => file.mimetype.startsWith('image/'))
    }
    if (req.files.videos) {
      req.files.videos = req.files.videos.filter(file => file.mimetype.startsWith('video/'))
    }

    const mainImage = req.files['mainImage'][0].filename
    const details = (req.files['details'] || []).map(f => f.filename)
    const videos = (req.files['videos'] || []).map(f => f.filename)

    const newEntry = { id, breedId, description, mainImage, details, videos }

    let list = []
    if (fs.existsSync(dataFile)) {
      list = JSON.parse(fs.readFileSync(dataFile))
    }

    const exists = list.some(i => i.id === id && i.breedId === breedId)
    if (exists) {
      return res.status(400).json({ error: '該品種下已有相同個體編號' })
    }

    list.push(newEntry)
    fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), 'utf-8')
    res.json({ message: '新增成功', data: newEntry })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '後端處理錯誤' })
  }
})

// ✅ 刪除個體資料
router.delete('/:id', (req, res) => {
  const { id } = req.params
  const { breedId } = req.query

  if (!fs.existsSync(dataFile)) return res.status(404).json({ error: '資料不存在' })

  let list = JSON.parse(fs.readFileSync(dataFile))
  const target = list.find(i => i.id === id && i.breedId === breedId)
  if (!target) return res.status(404).json({ error: '找不到此個體' })

  if (target.mainImage) {
    const mainPath = path.join(mainImageDir, target.mainImage)
    if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath)
  }

  if (Array.isArray(target.details)) {
    target.details.forEach(file => {
      const filePath = path.join(detailDir, file)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    })
  }

  if (Array.isArray(target.videos)) {
    target.videos.forEach(file => {
      const filePath = path.join(detailDir, file)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    })
  }

  list = list.filter(i => !(i.id === id && i.breedId === breedId))
  fs.writeFileSync(dataFile, JSON.stringify(list, null, 2), 'utf-8')
  res.json({ message: '刪除成功' })
})

// ✅ 修改個體資料
router.put('/:id', upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'details', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), (req, res) => {
  try {
    const { id } = req.params
    const { breedId } = req.query
    const rawData = fs.readFileSync(dataFile)
    const individuals = JSON.parse(rawData)

    const index = individuals.findIndex(item => item.id === id && item.breedId === breedId)
    if (index === -1) return res.status(404).json({ error: '找不到個體' })

    const updated = {
      ...individuals[index],
      description: req.body.description || individuals[index].description,
    }

    if (req.files['mainImage']) {
      updated.mainImage = req.files['mainImage'][0].filename
    }
    if (req.files['details']) {
      updated.details = req.files['details'].filter(f => f.mimetype.startsWith('image/')).map(f => f.filename)
    }
    if (req.files['videos']) {
      updated.videos = req.files['videos'].filter(f => f.mimetype.startsWith('video/')).map(f => f.filename)
    }

    individuals[index] = updated
    fs.writeFileSync(dataFile, JSON.stringify(individuals, null, 2))
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '更新失敗' })
  }
})

module.exports = router
