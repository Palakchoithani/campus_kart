const express = require('express')
const mongoose = require('mongoose')
const { verifyToken } = require('../middleware/auth')
const Rating = require('../models/Rating')
const Listing = require('../models/Listing')
const User = require('../models/User')

const router = express.Router()

async function updateUserRatingAggregate(userId) {
  const agg = await Rating.aggregate([
    { $match: { ratedUserId: userId } },
    {
      $group: {
        _id: '$ratedUserId',
        avgRating: { $avg: '$score' },
        count: { $sum: 1 },
      },
    },
  ])

  const stats = agg[0] || { avgRating: 0, count: 0 }
  await User.findByIdAndUpdate(userId, {
    ratingAverage: Number((stats.avgRating || 0).toFixed(1)),
    ratingCount: stats.count || 0,
  })
}

router.get('/listing/:listingId', async (req, res) => {
  try {
    const listingRatings = await Rating.find({ listingId: req.params.listingId })
      .sort({ createdAt: -1 })
      .populate('raterId', 'email name')

    const avgRating = listingRatings.length > 0
      ? Number((listingRatings.reduce((sum, r) => sum + r.score, 0) / listingRatings.length).toFixed(1))
      : 0

    res.json({
      avgRating,
      count: listingRatings.length,
      ratings: listingRatings.map((rating) => ({
        id: rating._id.toString(),
        listingId: rating.listingId.toString(),
        userId: rating.raterId?._id ? rating.raterId._id.toString() : rating.raterId.toString(),
        userEmail: rating.raterId?.email || '',
        rating: rating.score,
        comment: rating.review,
        createdAt: rating.createdAt,
      })),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ratings' })
  }
})

router.post('/', verifyToken, async (req, res) => {
  const { listingId, rating, comment } = req.body
  
  if (!listingId || !rating || isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid rating. Rating must be between 1 and 5.' })
  }

  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    return res.status(400).json({ error: 'Invalid listing ID' })
  }

  try {
    const listing = await Listing.findById(listingId)
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    const sellerId = listing.seller.toString()
    const currentUserId = String(req.user.id)
    
    if (sellerId === currentUserId) {
      return res.status(400).json({ error: 'You cannot rate your own listing' })
    }

    const newRating = await Rating.findOneAndUpdate(
      { listingId, raterId: req.user.id },
      {
        listingId,
        raterId: req.user.id,
        ratedUserId: listing.seller,
        score: Number(rating),
        review: comment || '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    await updateUserRatingAggregate(listing.seller)

    res.status(201).json({
      id: newRating._id.toString(),
      listingId: newRating.listingId.toString(),
      userId: req.user.id,
      userEmail: req.user.email,
      rating: newRating.score,
      comment: newRating.review,
      createdAt: newRating.createdAt,
    })
  } catch (err) {
    console.error('Rating error:', err)
    res.status(500).json({ error: 'Failed to save rating' })
  }
})

module.exports = router
