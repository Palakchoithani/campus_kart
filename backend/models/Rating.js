const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    raterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ratedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

ratingSchema.index({ listingId: 1, raterId: 1 }, { unique: true })

module.exports = mongoose.model('Rating', ratingSchema)