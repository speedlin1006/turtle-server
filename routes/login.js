const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// ✅ 匯入 MongoDB 使用者模型
const User = require('../models/User');

// ✅ 匯入記錄操作日誌的工具
const { logOperation } = require('../utils/logHelper');

// ✅ 建立登入路由，根據角色登入
function addLoginRoute(route, role, typeName) {
  router.post(route, async (req, res) => {
    const { username, password } = req.body;

    try {
      // 查詢 MongoDB 的 users 集合
      const user = await User.findOne({ username, password, role });

      if (!user) {
        return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
      }

      const token = crypto.randomBytes(32).toString('hex');

      // 將登入資訊儲存至全域變數
      global.activeTokens[token] = {
        username: user.username,
        name: user.name,
      };

      // ✅ 寫入登入成功紀錄（標準格式）
      await logOperation({
        type: `${typeName}登入成功`,
        user: user.username,
        details: {
          name: user.name
        }
      });

      res.json({
        success: true,
        token,
        username: user.username,
        name: user.name,
      });
    } catch (err) {
      console.error('❌ 登入錯誤：', err);
      res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
  });
}

// ✅ 註冊四種登入角色
addLoginRoute('/', 'staff', '員工');
addLoginRoute('/care', 'care', '寄養');
addLoginRoute('/client', 'client', '售後');
addLoginRoute('/member', 'member', '會員');

module.exports = router;
