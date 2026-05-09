const express = require('express')
const { verifyToken } = require('../middleware/auth')
const Listing = require('../models/Listing')
const User = require('../models/User')
const cloudinary = require('cloudinary').v2

const router = express.Router()

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
)

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

async function uploadListingImages(images = []) {
  const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : [images].filter(Boolean)

  if (!cloudinaryConfigured || normalizedImages.length === 0) {
    return normalizedImages
  }

  const uploaded = []

  for (const image of normalizedImages) {
    if (typeof image !== 'string' || !image.startsWith('data:')) {
      uploaded.push(image)
      continue
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'campuskart/listings',
      resource_type: 'image',
    })

    uploaded.push(result.secure_url)
  }

  return uploaded
}

function serializeListing(listing) {
  const seller = listing.seller || {}

  return {
    id: listing._id.toString(),
    userId: seller._id ? seller._id.toString() : listing.seller.toString(),
    userEmail: listing.sellerEmail || seller.email || '',
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    listingType: listing.listingType,
    condition: listing.condition,
    location: listing.location,
    collegeName: listing.collegeName,
    image: listing.images?.[0] || '',
    images: listing.images || [],
    isUrgent: Boolean(listing.urgent),
    isPremium: Boolean(listing.premium),
    premiumExpiresAt: listing.premiumExpiresAt,
    status: listing.status,
    tags: listing.tags || [],
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }
}

// GET all listings with optional filters
router.get('/', async (req, res) => {
  const { category, location, search, sortBy = 'recent' } = req.query

  try {
    const query = { status: 'active' }

    if (category && category !== 'all') {
      query.category = category
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    let sort = { createdAt: -1 }
    if (sortBy === 'urgent') {
      sort = { urgent: -1, createdAt: -1 }
    } else if (sortBy === 'premium') {
      sort = { premium: -1, createdAt: -1 }
    }

    const listings = await Listing.find(query).sort(sort).populate('seller', 'email name')
    res.json(listings.map(serializeListing))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load listings' })
  }
})

// GET single listing by ID
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'email name')
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }
    res.json(serializeListing(listing))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load listing' })
  }
})

// POST create new listing
router.post('/', verifyToken, async (req, res) => {
  const {
    title,
    description = '',
    price,
    category = 'Other',
    location,
    listingType = req.body.listingType || 'sell',
    condition = '',
    images = [],
    urgent = req.body.urgent ?? req.body.isUrgent ?? false,
    premium = req.body.premium ?? req.body.isPremium ?? false,
    premiumExpiresAt = null,
    collegeName = '',
    tags = [],
  } = req.body

  // Validation
  if (!title || price === undefined || price === null || !location) {
    return res.status(400).json({
      error: 'title, price, and location are required',
    })
  }

  try {
    const seller = await User.findById(req.user.id)
    const storedImages = await uploadListingImages(images)
    const newListing = await Listing.create({
      seller: req.user.id,
      sellerEmail: req.user.email,
      title,
      description,
      price: Number(price),
      category,
      listingType,
      condition,
      images: storedImages,
      location,
      collegeName: collegeName || seller?.collegeName || '',
      urgent: Boolean(urgent),
      premium: Boolean(premium),
      premiumExpiresAt: premium ? premiumExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      tags: Array.isArray(tags) ? tags : [],
    })

    const populatedListing = await newListing.populate('seller', 'email name')
    return res.status(201).json(serializeListing(populatedListing))
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create listing' })
  }
})

// PATCH update existing listing
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized - not your listing' })
    }

    const allowedFields = [
      'title',
      'description',
      'price',
      'category',
      'listingType',
      'condition',
      'images',
      'location',
      'collegeName',
      'urgent',
      'isUrgent',
      'premium',
      'isPremium',
      'premiumExpiresAt',
      'status',
      'tags',
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field]
      }
    }

    if (req.body.images !== undefined) {
      listing.images = await uploadListingImages(req.body.images)
    }

    if (req.body.isUrgent !== undefined) {
      listing.urgent = Boolean(req.body.isUrgent)
    }

    if (req.body.isPremium !== undefined) {
      listing.premium = Boolean(req.body.isPremium)
    }

    if (listing.premium && !listing.premiumExpiresAt) {
      listing.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    await listing.save()
    const updatedListing = await listing.populate('seller', 'email name')
    return res.json(serializeListing(updatedListing))
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update listing' })
  }
})

// DELETE listing
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    if (listing.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized - not your listing' })
    }

    await listing.deleteOne()
    res.json({ message: 'Listing deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing' })
  }
})

module.exports = router
