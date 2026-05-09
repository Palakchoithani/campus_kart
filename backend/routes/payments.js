const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51234567890abcdefghijklmnop')
const { verifyToken } = require('../middleware/auth')
const Payment = require('../models/Payment')
const Listing = require('../models/Listing')

const router = express.Router()

function getPremiumExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

// POST /payments/charge - Process premium listing payment
router.post('/charge', verifyToken, async (req, res) => {
  try {
    const { listingId, amount = 99 } = req.body // 99 paise = ₹0.99 for premium listing
    const userId = req.user.id
    const premiumExpiresAt = getPremiumExpiry(30)
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    if (listingId) {
      const listing = await Listing.findById(listingId)
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' })
      }

      if (listing.seller.toString() !== userId) {
        return res.status(403).json({ error: 'Unauthorized - not your listing' })
      }
    }

    // Skip actual Stripe charge in test mode, just validate and record
    if (process.env.NODE_ENV === 'production') {
      // In production, create actual Stripe charge
      const charge = await stripe.charges.create({
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency: 'inr',
        source: 'tok_visa', // In production, would come from frontend token
        description: `Premium listing ${listingId}`,
        metadata: { userId, listingId },
      })

      await Payment.create({
        userId,
        listingId: listingId || null,
        provider: 'stripe',
        amount,
        status: 'success',
        transactionId: charge.id,
        premiumExpiresAt,
      })

      if (listingId) {
        await Listing.findByIdAndUpdate(listingId, {
          premium: true,
          premiumExpiresAt,
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        chargeId: charge.id,
      })
    }

    // Test mode: just simulate payment
    await Payment.create({
      userId,
      listingId: listingId || null,
      provider: 'stripe',
      amount,
      status: 'success',
      transactionId,
      premiumExpiresAt,
    })

    if (listingId) {
      await Listing.findByIdAndUpdate(listingId, {
        premium: true,
        premiumExpiresAt,
      })
    }

    res.status(200).json({
      success: true,
      message: 'Premium listing activated (test mode)',
      chargeId: transactionId,
      testMode: true,
    })
  } catch (err) {
    console.error('Payment error:', err)
    res.status(400).json({
      error: 'Payment failed: ' + err.message,
    })
  }
})

// GET /payments/status/:listingId - Check if listing has active premium
router.get('/status/:listingId', verifyToken, async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await Listing.findById(listingId)

    if (!listing || !listing.premium || !listing.premiumExpiresAt) {
      return res.json({ isPremiumActive: false })
    }

    const isActive = new Date(listing.premiumExpiresAt) > new Date()

    if (!isActive) {
      listing.premium = false
      listing.premiumExpiresAt = null
      await listing.save()
    }

    res.json({
      isPremiumActive: isActive,
      expiresAt: listing.premiumExpiresAt,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load premium status' })
  }
})

module.exports = router
