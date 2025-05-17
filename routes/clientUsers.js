const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../utils/helpers');
const { logOperation } = require('../utils/logHelper');

// ✅ 查詢所有售後帳號
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find({ role: 'client' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: '無法取得售後帳號資料' });
  }
});

// ✅ 新增售後帳號
router.post('/', verifyToken, async (req, res) => {
  const { username, password, name } = req.body;
  try {
    const exists = await User.findOne({ username, role: 'client' });
    if (exists) return res.status(409).json({ error: '帳號已存在' });

    const newUser = new User({ username, password, name, role: 'client' });
    await newUser.save();

    await logOperation({
      type: '新增售後帳號',
      user: req.user?.username || '未知',
      details: {
        newData: { username, password, name }
      }
    });

    res.json({ success: true, message: '新增成功' });
  } catch (err) {
    res.status(500).json({ error: '新增失敗' });
  }
});

// ✅ 刪除售後帳號
router.delete('/:username', verifyToken, async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username, role: 'client' });
    if (!user) return res.status(404).json({ error: '找不到帳號' });

    await User.deleteOne({ username, role: 'client' });

    await logOperation({
      type: '刪除售後帳號',
      user: req.user?.username || '未知',
      details: {
        oldData: user
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '刪除失敗' });
  }
});

module.exports = router;
