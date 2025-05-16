const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: true
  },
  expireAt: {
    type: String,
    default: null
  },
  createdAt: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
