/**
 * Message Storage Utility
 * Manages persistent message storage using localStorage
 * Provides fallback for when backend API is unavailable
 */

const STORAGE_KEY_PREFIX = 'campuskart_messages_'

/**
 * Get messages for a specific conversation
 * @param {string} listingId - The listing ID
 * @param {string} otherUserId - The other user's ID
 * @returns {Array} Array of messages
 */
export function getStoredMessages(listingId, otherUserId) {
  if (!listingId || !otherUserId) return []
  const key = `${STORAGE_KEY_PREFIX}${listingId}_${otherUserId}`
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (err) {
    console.warn('Failed to load stored messages:', err)
    return []
  }
}

/**
 * Save messages for a specific conversation
 * @param {string} listingId - The listing ID
 * @param {string} otherUserId - The other user's ID
 * @param {Array} messages - Array of messages to store
 */
export function saveMessages(listingId, otherUserId, messages) {
  if (!listingId || !otherUserId || !Array.isArray(messages)) return
  const key = `${STORAGE_KEY_PREFIX}${listingId}_${otherUserId}`
  try {
    localStorage.setItem(key, JSON.stringify(messages))
  } catch (err) {
    console.warn('Failed to save messages:', err)
  }
}

/**
 * Add a single message to stored messages
 * @param {string} listingId - The listing ID
 * @param {string} otherUserId - The other user's ID
 * @param {Object} message - Message to add
 * @returns {Array} Updated messages array
 */
export function addStoredMessage(listingId, otherUserId, message) {
  const messages = getStoredMessages(listingId, otherUserId)
  const newMessages = [...messages, message]
  saveMessages(listingId, otherUserId, newMessages)
  return newMessages
}

/**
 * Clear messages for a specific conversation
 * @param {string} listingId - The listing ID
 * @param {string} otherUserId - The other user's ID
 */
export function clearStoredMessages(listingId, otherUserId) {
  if (!listingId || !otherUserId) return
  const key = `${STORAGE_KEY_PREFIX}${listingId}_${otherUserId}`
  try {
    localStorage.removeItem(key)
  } catch (err) {
    console.warn('Failed to clear messages:', err)
  }
}

/**
 * Merge API messages with stored messages, avoiding duplicates
 * @param {Array} apiMessages - Messages from API
 * @param {Array} storedMessages - Messages from localStorage
 * @returns {Array} Merged and deduplicated messages
 */
export function mergeMessages(apiMessages = [], storedMessages = []) {
  const map = new Map()
  
  // Add stored messages first (they're the source of truth for local state)
  storedMessages.forEach((msg) => {
    if (msg?.id) map.set(msg.id, msg)
  })
  
  // Merge with API messages, but prefer stored versions if they exist
  apiMessages.forEach((msg) => {
    if (msg?.id && !map.has(msg.id)) {
      map.set(msg.id, msg)
    }
  })
  
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )
}

/**
 * Dedup messages by ID
 * @param {Array} messages - Messages to deduplicate
 * @returns {Array} Deduplicated messages
 */
export function dedupMessages(messages = []) {
  const map = new Map()
  messages.forEach((msg) => {
    if (msg?.id) map.set(msg.id, msg)
  })
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )
}
