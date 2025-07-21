const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['reader', 'writer', 'admin'], default: 'reader' },
  bio: { type: String },
  avatar: { type: String },
  socialLinks: [{ type: String }],
  xp: { type: Number, default: 0 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
}, { timestamps: true });

userSchema.methods.generateVerificationCode = function() {
  // Generate a 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

module.exports = mongoose.model('User', userSchema); 