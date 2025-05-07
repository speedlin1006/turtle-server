
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { google } = require('googleapis')
const cron = require('node-cron')

// ✅ 讀取環境變數中的金鑰 JSON 字串（Render 會自動注入）
const credentials = JSON.parse(process.env.GCP_KEY_JSON)

// ✅ Google Drive 設定（你自己的資料夾 ID）
const FOLDER_ID = '13tiOL5X_pzapGSlrYX7hc5idPSIKyk9v'

// ✅ 初始化 Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
})
const drive = google.drive({ version: 'v3', auth })

// ✅ 建立 ZIP 檔案
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

// ✅ 上傳到 Google Drive（含台灣時區命名）
async function uploadToDrive(zipPath) {
  const now = new Date()
  const offset = now.getTime() + (8 * 60 * 60 * 1000)
  const taipeiTime = new Date(offset)
  const dateStr = taipeiTime.toISOString().split('T')[0]
  const timeStr = taipeiTime.toISOString().split('T')[1].slice(0,5).replace(':', '-')
  const fileName = `backup-${dateStr}_${timeStr}.zip`

  const fileMetadata = {
    name: fileName,
    parents: [FOLDER_ID],
  }

  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(zipPath),
  }

  try {
    const res = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id',
      supportsAllDrives: true,
    })
    console.log('✅ 上傳成功，檔案 ID：', res.data.id)
    fs.unlinkSync(zipPath)
  } catch (err) {
    console.error('❌ 上傳失敗：', err.message)
  }
}

// ✅ 執行備份
function runBackup() {
  const zipPath = path.join(__dirname, `server-backup-temp.zip`)
  zipServerFolder(zipPath, () => {
    uploadToDrive(zipPath)
  })
}

// ✅ 每分鐘備份一次（測試用）
cron.schedule('0 12 * * *', () => {
  console.log('⏰ 自動備份啟動...')
  runBackup()
})

// ✅ 啟動立即備份一次
runBackup()
