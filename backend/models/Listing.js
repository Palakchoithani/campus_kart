const mongoose = require('mongoose')

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerEmail: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'Other' },
    listingType: { type: String, enum: ['sell', 'buy', 'rent'], default: 'sell' },
    price: { type: Number, required: true, min: 0 },
    condition: { type: String, trim: true, default: '' },
    images: [{ type: String, trim: true }],
    location: { type: String, required: true, trim: true },
    collegeName: { type: String, trim: true, default: '' },
    urgent: { type: Boolean, default: false },
    premium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'sold', 'rented', 'closed'], default: 'active' },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
)

listingSchema.index({ title: 'text', description: 'text', location: 'text', category: 'text', collegeName: 'text' })

module.exports = mongoose.model('Listing', listingSchema)