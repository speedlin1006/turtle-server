const mongoose = require('mongoose')

const individualSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  breedId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  mainImage: {
    type: String,
    required: true
  },
  details: {
    type: [String],
    default: []
  },
  videos: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
})

individualSchema.index({ id: 1, breedId: 1 }, { unique: true })

module.exports = mongoose.model('Individual', individualSchema)
