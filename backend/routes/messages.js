const express = require('express')
const { verifyToken } = require('../middleware/auth')
const Message = require('../models/Message')
const Listing = require('../models/Listing')

const router = express.Router()

function getRoomId(listingId, userIdA, userIdB) {
  return `conversation:${listingId}:${[userIdA, userIdB].sort().join(':')}`
}

function serializeMessage(message) {
  const sender = message.senderId || {}
  const receiver = message.receiverId || {}

  return {
    id: message._id.toString(),
    listingId: message.listingId.toString(),
    senderId: sender._id ? sender._id.toString() : message.senderId.toString(),
    senderEmail: sender.email || '',
    receiverId: receiver._id ? receiver._id.toString() : message.receiverId.toString(),
    receiverEmail: receiver.email || '',
    text: message.text,
    createdAt: message.createdAt,
    roomId: message.roomId,
  }
}

async function loadConversations(req, res) {
  try {
    const recentMessages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate('senderId', 'email name')
      .populate('receiverId', 'email name')
      .populate('listingId', 'title')

    const conversations = []
    const seenRooms = new Set()

    for (const message of recentMessages) {
      if (seenRooms.has(message.roomId)) continue

      seenRooms.add(message.roomId)

      // Determine the other user
      const senderId = message.senderId?._id?.toString?.() || message.senderId?.toString?.()
      const receiverId = message.receiverId?._id?.toString?.() || message.receiverId?.toString?.()
      const listingId = message.listingId?._id?.toString?.() || message.listingId?.toString?.()
      const isInitiator = senderId === req.user.id
      const otherUser = isInitiator ? message.receiverId : message.senderId
      const otherUserId = otherUser?._id?.toString?.() || otherUser?.toString?.()

      if (!listingId || !otherUserId) {
        continue
      }

      conversations.push({
        id: message.roomId,
        listingId,
        listingTitle: message.listingId?.title || 'Deleted listing',
        lastMessage: message.text,
        lastMessageAt: message.createdAt,
        sellerId: otherUserId,
        userId2: otherUserId,
        otherUserName: otherUser.name || 'User',
        otherUserEmail: otherUser.email,
      })
    }

    res.json(conversations)
  } catch (err) {
    console.error('Failed to load conversations:', err)
    res.status(500).json({ error: 'Failed to load conversations' })
  }
}

async function loadConversationMessages(req, res, listingId, sellerId) {
  try {
    if (!listingId || !sellerId) {
      return res.status(400).json({ error: 'listingId and sellerId are required' })
    }

    const roomId = getRoomId(listingId, req.user.id, sellerId)
    const convMessages = await Message.find({ roomId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'email name')
      .populate('receiverId', 'email name')

    return res.json(convMessages.map(serializeMessage))
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load messages' })
  }
}

async function sendMessage(req, res) {
  const { listingId, receiverId, text } = req.body
  
  if (!listingId || !receiverId || !text) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const listing = await Listing.findById(listingId)
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    const roomId = getRoomId(listingId, req.user.id, receiverId)
    const newMessage = await Message.create({
      roomId,
      listingId,
      senderId: req.user.id,
      receiverId,
      text,
    })

    const populatedMessage = await newMessage.populate([
      { path: 'senderId', select: 'email name' },
      { path: 'receiverId', select: 'email name' },
    ])

    const io = req.app.get('io')
    if (io) {
      io.to(roomId).emit('message:new', serializeMessage(populatedMessage))
    }

    return res.status(201).json(serializeMessage(populatedMessage))
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' })
  }
}

router.get('/', verifyToken, async (req, res) => {
  if (req.query.listingId || req.query.sellerId) {
    return loadConversationMessages(req, res, req.query.listingId, req.query.sellerId)
  }

  return loadConversations(req, res)
})

router.get('/conversations', verifyToken, loadConversations)

router.get('/conversation/:listingId/:sellerId', verifyToken, async (req, res) => {
  return loadConversationMessages(req, res, req.params.listingId, req.params.sellerId)
})

router.post('/', verifyToken, sendMessage)

router.post('/send', verifyToken, sendMessage)

module.exports = router
