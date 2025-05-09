const express = require('express')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

const router = express.Router()
const BACKUP_DIR = path.join(__dirname, '../backups')

// ✅ 確保備份資料夾存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR)
}

// ✅ 從檔名中解析出建立時間
function extractDateFromFilename(filename) {
  const match = filename.match(/後端備份-(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})/)
  if (!match) return '未知時間'
  const [_, date, time] = match
  return `${date} ${time.replace('-', ':')}` // → '2025-05-09 09:45'
}

// ✅ 建立 ZIP 壓縮檔
function createBackupZip(callback) {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // yyyy-mm-dd
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '-') // hh-mm
  const zipFilename = `後端備份-${dateStr}_${timeStr}.zip`
  const zipPath = path.join(BACKUP_DIR, zipFilename)

  const output = fs.createWriteStream(zipPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  output.on('close', () => {
    console.log(`✅ 備份完成：${zipFilename}`)
    callback(null, zipFilename)
  })

  archive.on('error', (err) => {
    callback(err)
  })

  archive.pipe(output)

  // ✅ 排除不需要的資料夾與壓縮本身
  const EXCLUDE = ['node_modules', 'backups', '.git']
  fs.readdirSync(path.join(__dirname, '..')).forEach(file => {
    const fullPath = path.join(__dirname, '..', file)
    if (EXCLUDE.includes(file) || file.endsWith('.zip')) return

    if (fs.statSync(fullPath).isDirectory()) {
      archive.directory(fullPath, file)
    } else {
      archive.file(fullPath, { name: file })
    }
  })

  archive.finalize()
}

// ✅ API：立即備份
router.post('/', (req, res) => {
  createBackupZip((err, filename) => {
    if (err) {
      console.error('❌ 備份失敗：', err.message)
      return res.status(500).json({ message: '備份失敗', error: err.message })
    }
    res.status(200).json({ message: '備份成功', filename })
  })
})

// ✅ API：列出所有備份檔案
router.get('/list', (req, res) => {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) return res.status(500).json({ message: '讀取備份清單失敗' })

    const backups = files
      .filter(f => f.endsWith('.zip'))
      .map(filename => {
        const filePath = path.join(BACKUP_DIR, filename)
        const stat = fs.statSync(filePath)
        return {
          filename,
          sizeKB: Math.round(stat.size / 1024),
          createdAt: extractDateFromFilename(filename)
        }
      })
      .sort((a, b) => b.filename.localeCompare(a.filename)) // 以檔名順序排序

    res.json(backups)
  })
})

// ✅ API：下載指定備份檔
router.get('/download/:filename', (req, res) => {
  const file = req.params.filename
  const filePath = path.join(BACKUP_DIR, file)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: '找不到備份檔案' })
  }

  res.download(filePath)
})

module.exports = router
