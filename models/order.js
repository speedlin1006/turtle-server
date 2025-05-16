const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  createdAt: {
    type: String,
    required: true
  },
  contact: {
    name: String,
    phone: String,
    address: String,
    bankcode: String
  },
  cart: [
    {
      name: String,
      qty: Number,
      price: Number
    }
  ],
  status: {
    type: String,
    default: '未確認'
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deleteReason: {
    type: String,
    default: ''
  },
  deletedAt: {
    type: String,
    default: ''
  },
  statusUpdatedAt: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Order', OrderSchema);
