// uploadToCloudinary.js
const fs = require('fs')
const path = require('path')
const cloudinary = require('cloudinary').v2
require('dotenv').config()

// 設定 Cloudinary 認證
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// 要上傳的三個資料夾與對應 Cloudinary 資料夾
const uploadConfigs = [
  {
    localPath: './public/turtle-breeds',
    cloudFolder: 'turtle-breeds'
  },
  {
    localPath: './public/turtle-individuals',
    cloudFolder: 'turtle-individuals'
  },
  {
    localPath: './public/turtle-details',
    cloudFolder: 'turtle-details'
  }
]

// 遍歷每個資料夾並上傳
async function uploadAll() {
  for (const config of uploadConfigs) {
    const { localPath, cloudFolder } = config
    const files = fs.readdirSync(localPath)

    console.log(`🚀 開始上傳 ${cloudFolder}：共 ${files.length} 筆`)

    for (const file of files) {
      const filePath = path.join(localPath, file)
      const ext = path.extname(file).toLowerCase()
      const resourceType = ext === '.mp4' ? 'video' : 'image'

      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: cloudFolder,
          resource_type: resourceType
        })
        console.log(`✅ ${file} → ${result.secure_url}`)
      } catch (err) {
        console.error(`❌ 上傳失敗：${file}`, err.message)
      }
    }
  }
  console.log('🎉 所有上傳作業完成！')
}

uploadAll()
