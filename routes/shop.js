const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { v2: cloudinary } = require('cloudinary') // ✅ 圖床 SDK
const { verifyToken, logOperation } = require('../utils/helpers')
const Shop = require('../models/Shop')

// ✅ 搜尋商品
router.get('/search', async (req, res) => {
  try {
    const { keyword = '', breedId = '', minPrice, maxPrice } = req.query
    const filter = {}

    if (keyword) filter.name = { $regex: keyword, $options: 'i' }
    if (breedId) filter.breedId = breedId
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    const items = await Shop.find(filter).sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    console.error('❌ 搜尋商品錯誤：', err)
    res.status(500).json({ error: '搜尋失敗' })
  }
})

// ✅ 新增商品
router.post('/', verifyToken, async (req, res) => {
  try {
    const newItem = await Shop.create(req.body)
    logOperation({ type: '新增商品', item: newItem }, req)
    res.status(201).json({ success: true, item: newItem })
  } catch (err) {
    console.error('❌ 新增商品失敗：', err)
    res.status(500).json({ success: false })
  }
})

// ✅ 修改商品
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true })
    logOperation({ type: '修改商品', itemId: req.params.id, newData: req.body }, req)
    res.json({ success: true, item })
  } catch (err) {
    console.error('❌ 修改商品失敗：', err)
    res.status(500).json({ success: false })
  }
})

// ✅ 刪除商品（同步刪除 Cloudinary 圖片 或 本地圖片）
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Shop.findById(req.params.id)
    if (!item) return res.status(404).json({ success: false, message: '找不到商品' })

    // ✅ 若圖片為 Cloudinary，從網址提取 publicId 並刪除
    if (item.image && item.image.startsWith('https://res.cloudinary.com/')) {
      const match = item.image.match(/\/turtle-shop\/([^./]+)/)
      if (match && match[1]) {
        const publicId = `turtle-shop/${match[1]}`
        await cloudinary.uploader.destroy(publicId)
        console.log('✅ Cloudinary 圖片已刪除:', publicId)
      }
    }

    // ✅ 如果是本地圖片（已棄用）
    if (item.image && item.image.startsWith('/shop/')) {
      const imagePath = path.join(__dirname, '../public', item.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    await Shop.findByIdAndDelete(req.params.id)
    logOperation({ type: '刪除商品', itemId: req.params.id }, req)
    res.json({ success: true })
  } catch (err) {
    console.error('❌ 刪除商品失敗：', err)
    res.status(500).json({ success: false })
  }
})

module.exports = router
