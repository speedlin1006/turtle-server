const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcements');
const { verifyToken } = require('../utils/helpers');
const { logOperation } = require('../utils/logHelper');

// ✅ 取得所有公告
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ success: false, message: '取得公告失敗' });
  }
});

// ✅ 新增公告
router.post('/', verifyToken, async (req, res) => {
  try {
    const { text, visible = true, expireAt, user } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: '公告內容不可空白' });
    }

    const newAnnouncement = new Announcement({
      id: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14),
      text,
      visible,
      expireAt: expireAt || null,
      createdAt: new Date().toISOString()
    });

    await newAnnouncement.save();

    await logOperation({
      type: '新增公告',
      user: user || '未知',
      details: {
        id: newAnnouncement.id,
        text,
        visible,
        expireAt
      }
    });

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '新增公告失敗' });
  }
});

// ✅ 修改可見狀態（這類不記錄日誌）
router.patch('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { visible } = req.body;

  try {
    const announcement = await Announcement.findOneAndUpdate(
      { id },
      { visible },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ success: false, message: '找不到公告' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新失敗' });
  }
});

// ✅ 刪除公告
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { user } = req.body;

  try {
    const deleted = await Announcement.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false });
    }

    await logOperation({
      type: '刪除公告',
      user: user || '未知',
      details: {
        id,
        text: deleted.text
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '刪除失敗' });
  }
});

module.exports = router;
