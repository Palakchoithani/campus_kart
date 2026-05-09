const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    collegeName: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    passwordResetTokenHash: { type: String, default: '' },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)