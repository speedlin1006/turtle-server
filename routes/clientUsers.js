// routes/clientUsers.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ 取得所有售後帳號（role = 'client'）
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: 'client' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '無法取得售後帳號資料' });
  }
});

// ✅ 新增售後帳號
router.post('/', async (req, res) => {
  const { username, password, name } = req.body;
  try {
    const exists = await User.findOne({ username, role: 'client' });
    if (exists) return res.status(409).json({ error: '帳號已存在' });

    const newUser = new User({ username, password, name, role: 'client' });
    await newUser.save();
    res.json({ success: true, message: '新增成功' });
  } catch (err) {
    res.status(500).json({ error: '新增失敗' });
  }
});

// ✅ 刪除售後帳號
router.delete('/:username', async (req, res) => {
  try {
    await User.deleteOne({ username: req.params.username, role: 'client' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '刪除失敗' });
  }
});

module.exports = router;
