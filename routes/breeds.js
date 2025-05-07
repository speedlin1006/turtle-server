// routes/breeds.js
const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const router = express.Router()
const { verifyToken, logOperation } = require('../utils/helpers')

const dataPath = path.join(__dirname, '../public/breeds.json')
const imageFolder = path.join(__dirname, '../public/turtle-breeds')

// ✅ 沒有 JSON 檔就建立
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify([]))
}

// ✅ 取得所有品種資料
router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8') || '[]')
  res.json(data)
})

// ✅ 上傳圖片
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, imageFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + ext)
  }
})

const upload = multer({ storage })

// ✅ 新增品種
router.post('/', verifyToken, upload.single('image'), (req, res) => {
  const { id, name } = req.body
  const breeds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  const newBreed = {
    id,
    name,
    image: '/turtle-breeds/' + req.file.filename
  }
  breeds.push(newBreed)
  fs.writeFileSync(dataPath, JSON.stringify(breeds, null, 2))

  logOperation({ type: '新增品種', breed: newBreed }, req)
  res.status(201).json({ success: true })
})

// ✅ 刪除品種
router.delete('/:id', verifyToken, (req, res) => {
  let breeds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const target = breeds.find(b => b.id === req.params.id)
  if (!target) return res.status(404).json({ success: false })

  breeds = breeds.filter(b => b.id !== req.params.id)
  fs.writeFileSync(dataPath, JSON.stringify(breeds, null, 2))

  const imgPath = path.join(imageFolder, path.basename(target.image))
  if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)

  logOperation({ type: '刪除品種', id: req.params.id }, req)
  res.json({ success: true })
})

// ✅ 修改品種
router.put('/:id', verifyToken, upload.single('image'), (req, res) => {
  const { name } = req.body
  const breeds = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const index = breeds.findIndex(b => b.id === req.params.id)
  if (index === -1) return res.status(404).json({ success: false })

  if (name) breeds[index].name = name
  if (req.file) {
    const oldImg = path.join(imageFolder, path.basename(breeds[index].image))
    if (fs.existsSync(oldImg)) fs.unlinkSync(oldImg)
    breeds[index].image = '/turtle-breeds/' + req.file.filename
  }

  fs.writeFileSync(dataPath, JSON.stringify(breeds, null, 2))
  logOperation({ type: '修改品種', id: req.params.id, newData: breeds[index] }, req)
  res.json({ success: true })
})

module.exports = router
