const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { verifyToken, logOperation } = require('../utils/helpers')

const shopPath = path.join(__dirname, '../shop.json')

// ✅ 沒有檔案就建立空陣列
if (!fs.existsSync(shopPath)) {
  fs.writeFileSync(shopPath, JSON.stringify([]))
}

// ✅ 讀取商品資料
function getShopItems() {
  const items = JSON.parse(fs.readFileSync(shopPath, 'utf-8') || '[]')
  let updated = false
  const fixedItems = items.map(item => {
    if (!item.id) {
      item.id = Date.now().toString() + Math.floor(Math.random() * 10000)
      updated = true
    }
    return item
  })
  if (updated) {
    fs.writeFileSync(shopPath, JSON.stringify(fixedItems, null, 2))
  }
  return fixedItems
}

// ✅ 新增商品
function addShopItem(item) {
  const items = getShopItems()
  const newItem = { ...item, id: Date.now().toString() }
  items.push(newItem)
  fs.writeFileSync(shopPath, JSON.stringify(items, null, 2))
  return newItem
}

// ✅ 刪除商品
function deleteShopItem(id) {
  let items = getShopItems()
  const originalLength = items.length
  items = items.filter(item => item.id !== id)
  fs.writeFileSync(shopPath, JSON.stringify(items, null, 2))
  return items.length < originalLength
}

// ✅ 修改商品（比對差異）
function updateShopItem(id, updatedItem) {
  const items = getShopItems()
  const index = items.findIndex(item => item.id === id)
  if (index === -1) return null

  const oldData = items[index]
  const newData = { ...oldData, ...updatedItem }

  const changes = {}
  for (const key in newData) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = { from: oldData[key], to: newData[key] }
    }
  }

  items[index] = newData
  fs.writeFileSync(shopPath, JSON.stringify(items, null, 2))

  return { oldData, newData, changes }
}

// ✅ 取得所有商品
router.get('/', (req, res) => {
  res.json(getShopItems())
})

// ✅ 新增商品
router.post('/', verifyToken, (req, res) => {
  const added = addShopItem(req.body)
  logOperation({ type: '新增商品', item: added }, req)
  res.status(201).json({ success: true })
})

// ✅ 刪除商品
router.delete('/:id', verifyToken, (req, res) => {
  const success = deleteShopItem(req.params.id)
  if (success) {
    logOperation({ type: '刪除商品', itemId: req.params.id }, req)
  }
  res.json({ success })
})

// ✅ 修改商品（含變動記錄）
router.put('/:id', verifyToken, (req, res) => {
  const result = updateShopItem(req.params.id, req.body)
  if (!result) return res.status(404).json({ success: false })

  const { oldData, newData, changes } = result
  logOperation({
    type: '修改商品',
    itemId: req.params.id,
    oldData,
    newData,
    changes
  }, req)

  res.json({ success: true })
})

// ✅ 搜尋與篩選商品（已修正 includes 錯誤）
router.get('/search', (req, res) => {
  const { keyword = '', breedId = '', minPrice, maxPrice } = req.query
  const allItems = getShopItems()

  const filtered = allItems.filter(item => {
    const matchesKeyword = (item.name || '').includes(keyword)

    const matchesBreed = !breedId || item.breedId === breedId

    const price = Number(item.price || 0)
    const matchesMin = minPrice ? price >= Number(minPrice) : true
    const matchesMax = maxPrice ? price <= Number(maxPrice) : true

    return matchesKeyword && matchesBreed && matchesMin && matchesMax
  })

  res.json(filtered)
})

module.exports = router
