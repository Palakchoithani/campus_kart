const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null, index: true },
    provider: { type: String, default: 'stripe' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
    transactionId: { type: String, required: true },
    premiumExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Payment', paymentSchema)