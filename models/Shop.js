const mongoose = require('mongoose')

const shopSchema = new mongoose.Schema({
  name: String,
  price: Number,
  status: String,
  description: String,
  image: String,
  video: String,
  breedId: String
}, {
  timestamps: true
})

module.exports = mongoose.model('Shop', shopSchema)
//112