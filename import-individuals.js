// import-individuals.js
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
require('dotenv').config()

const Individual = require('./models/Individual')

const filePath = path.join(__dirname, 'data/individuals.json')

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ 成功連線至 MongoDB')

    const raw = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    await Individual.deleteMany({})
    const result = await Individual.insertMany(data)

    console.log(`🎉 匯入成功，共新增 ${result.length} 筆個體資料`)
    process.exit()
  } catch (err) {
    console.error('❌ 匯入失敗', err)
    process.exit(1)
  }
}

importData()
