const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type: String,
  user: String,
  name: String,
  time: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // ✅ 30 天後自動刪除
  },
  details: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Log', logSchema);
