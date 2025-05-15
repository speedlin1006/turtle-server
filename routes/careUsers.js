// routes/careClientUserDetails.js（資料庫版本）
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, logOperation } = require('../utils/helpers');

// ✅ 查詢尚未刪除的售後帳號
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find({ role: 'client', deleted: { $ne: true } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '無法取得資料' });
  }
});

// ✅ 查詢已刪除的售後帳號
router.get('/deleted', verifyToken, async (req, res) => {
  try {
    const users = await User.find({ role: 'client', deleted: true });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '無法取得刪除資料' });
  }
});

// ✅ 新增售後使用者
router.post('/', verifyToken, async (req, res) => {
  const { username, password, name } = req.body;
  if (!username) return res.status(400).json({ success: false });
  try {
    const exists = await User.findOne({ username, role: 'client' });
    if (exists) return res.status(409).json({ success: false });

    const newUser = new User({ username, password, name, role: 'client', deleted: false, createdAt: new Date() });
    await newUser.save();
    logOperation({ type: '新增售後使用者', username }, req);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ 軟刪除售後使用者（標記 deleted: true）
router.delete('/:username', verifyToken, async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOneAndUpdate(
      { username, role: 'client' },
      { deleted: true, deletedAt: new Date() }
    );
    if (!user) return res.status(404).json({ success: false });
    logOperation({ type: '刪除售後使用者', username }, req);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
