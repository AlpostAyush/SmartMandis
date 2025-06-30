const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('City', citiesSchema);
