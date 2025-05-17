// utils/logHelper.js
const Log = require('../models/Log');

async function logOperation(data, req) {
  try {
    const token = req?.headers?.authorization?.split(' ')[1];
    const userInfo = global.activeTokens?.[token];
    const user = userInfo?.username || data.user || '未知';
    const name = userInfo?.name || data.name || null;

    const log = new Log({
      type: data.type,
      user,
      name,
      time: new Date().toISOString(),
      details: data.details || data
    });

    await log.save();
  } catch (err) {
    console.error('❌ 寫入操作日誌失敗：', err);
  }
}

module.exports = { logOperation };
