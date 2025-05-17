const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/helpers');
const Log = require('../models/Log'); // 載入 Mongoose 模型

// ✅ 取得所有操作日誌（時間倒序排列）
router.get('/', verifyToken, async (req, res) => {
  try {
    const logs = await Log.find().sort({ time: -1 }); // 最新的在前面
    res.json(logs);
  } catch (err) {
    console.error('❌ 無法讀取操作日誌', err);
    res.status(500).json({ success: false, message: '無法讀取日誌' });
  }
});

module.exports = router;
