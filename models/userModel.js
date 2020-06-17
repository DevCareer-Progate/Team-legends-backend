const mongoose = require('mongoose')

const Schema = mongoose.Schema

const User = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
})

module.exports = mongoose.model('User', User)
