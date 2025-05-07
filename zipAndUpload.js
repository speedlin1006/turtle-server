const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { google } = require('googleapis')
const cron = require('node-cron') // ⏰ 加入排程

// 你的 Google Service Account 金鑰 JSON 檔案
const KEYFILEPATH = path.join(__dirname, 'sharp-effort-353719-b0812a41ea70.json')

// 雲端硬碟要儲存的資料夾 ID
const FOLDER_ID = '13tiOL5X_pzapGSlrYX7hc5idPSIKyk9v'

// 初始化 Google Drive API 授權
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
})
const drive = google.drive({ version: 'v3', auth })

// 建立 ZIP 檔案
function zipServerFolder(zipPath, callback) {
  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  output.on('close', () => {
    console.log(`✅ 壓縮完成，大小：${archive.pointer()} bytes`)
    callback()
  })

  archive.on('error', (err) => {
    throw err
  })

  archive.pipe(output)

  // 收集所有檔案與資料夾（排除不必要的）
  fs.readdirSync('./').forEach(file => {
    if (file !== 'node_modules' && file !== 'backup.zip' && file !== 'zipAndUpload.js') {
      const fullPath = path.join('./', file)
      if (fs.statSync(fullPath).isDirectory()) {
        archive.directory(fullPath, file)
      } else {
        archive.file(fullPath, { name: file })
      }
    }
  })

  archive.finalize()
}

// 上傳到 Google 雲端硬碟（支援大檔案）
async function uploadToDrive(zipPath) {
  const fileMetadata = {
    name: `backup-${new Date().toISOString().split('T')[0]}.zip`,
    parents: [FOLDER_ID],
  }

  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(zipPath),
  }

  try {
    const res = await drive.files.create(
      {
        resource: fileMetadata,
        media,
        fields: 'id',
        supportsAllDrives: true,
      },
      {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    )
    console.log('✅ 上傳成功，檔案 ID：', res.data.id)
    fs.unlinkSync(zipPath) // 刪除本地 zip
  } catch (err) {
    console.error('❌ 上傳失敗：', err.message)
  }
}

// 備份流程
function runBackup() {
  const zipPath = path.join(__dirname, `server-backup-${Date.now()}.zip`)
  zipServerFolder(zipPath, () => {
    uploadToDrive(zipPath)
  })
}

// ✅ 每天凌晨 00:00 自動備份
cron.schedule('0 0 * * *', () => {
  console.log('⏰ 自動備份啟動...')
  runBackup()
})

// ✅ 手動執行也會立即備份一次
runBackup()
