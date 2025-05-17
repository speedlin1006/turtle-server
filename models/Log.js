const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type: { type: String, required: true },         // 操作類型（例如：新增訂單、修改商品...）
  user: { type: String, required: true },         // 執行操作的人
  time: { type: Date, default: Date.now },        // 操作時間（預設現在）
  details: { type: mongoose.Schema.Types.Mixed }  // 其他詳細資料（格式彈性）
});

module.exports = mongoose.model('Log', logSchema);
