/**
 * Auto-Reply System for Demo/Mock Conversations
 * Generates contextual, realistic responses based on user messages
 */

const SELLER_RESPONSES = {
  // Availability questions
  availability: [
    'Yes, it\'s still available!',
    'Yep, still up for sale.',
    'Still available, what would you like to know?',
    'Available now, interested?'
  ],
  
  // Price negotiation
  pricing: [
    'The price is pretty firm, but I\'m open to discussion.',
    'I can be flexible on the price. What\'s your offer?',
    'I\'m willing to negotiate a bit. What did you have in mind?',
    'The listed price is my asking price, but make me an offer!',
    'I can come down slightly. What\'s fair for you?'
  ],
  
  // Condition/Quality questions
  condition: [
    'It\'s in excellent condition, barely used.',
    'No issues at all, works perfectly!',
    'Great condition - everything works as it should.',
    'Like new, everything is in perfect working order.',
    'Well maintained, you\'ll be happy with it.'
  ],
  
  // Meeting/Pickup
  meeting: [
    'Sure, we can arrange a time that works for you.',
    'I\'m flexible. When can you come by?',
    'Absolutely! Campus pickup is perfect.',
    'Let\'s make it happen. When are you free?',
    'No problem! When would be convenient for you?'
  ],
  
  // General interest
  interest: [
    'Great! Let me know if you have any other questions.',
    'Happy to answer any questions you have!',
    'Feel free to ask if you need more info.',
    'Let me know what else you\'d like to know.',
    'Glad you\'re interested! What can I help with?'
  ],
  
  // Urgent/Needs answer
  urgent: [
    'Yes, I can do that today if needed!',
    'I can make it happen quickly.',
    'Sure thing, let\'s sort this out fast!',
    'No problem, I can move quickly on this.'
  ]
}

/**
 * Analyze user message to determine response category
 * @param {string} userMessage - The user's message
 * @returns {string} Response category
 */
function analyzeMessage(userMessage) {
  const lower = userMessage.toLowerCase()
  
  // Check for availability questions
  if (/still available|available|still up/i.test(lower)) {
    return 'availability'
  }
  
  // Check for price/negotiation questions
  if (/price|cost|cheaper|discount|lower|negotiate|offer|reduce/i.test(lower)) {
    return 'pricing'
  }
  
  // Check for condition questions
  if (/condition|quality|working|issue|problem|defect|damage|scratch|wear/i.test(lower)) {
    return 'condition'
  }
  
  // Check for meeting/pickup questions
  if (/meet|pickup|pick up|collect|come by|visit|time|when|where|location|campus/i.test(lower)) {
    return 'meeting'
  }
  
  // Check for urgent keywords
  if (/urgent|asap|today|tonight|now|quick|fast|rush/i.test(lower)) {
    return 'urgent'
  }
  
  // Default to general interest
  return 'interest'
}

/**
 * Get a random response from a category
 * @param {string} category - The response category
 * @returns {string} Random response from that category
 */
function getRandomResponse(category) {
  const responses = SELLER_RESPONSES[category] || SELLER_RESPONSES.interest
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Generate an auto-reply for a user message
 * @param {string} userMessage - The user's message text
 * @returns {string} Generated reply
 */
export function generateAutoReply(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return getRandomResponse('interest')
  }
  
  const category = analyzeMessage(userMessage)
  return getRandomResponse(category)
}

/**
 * Get a realistic delay for an auto-reply (in milliseconds)
 * Ranges from 2-8 seconds to feel natural
 * @returns {number} Delay in milliseconds
 */
export function getReplyDelay() {
  const minDelay = 2000
  const maxDelay = 8000
  return minDelay + Math.random() * (maxDelay - minDelay)
}

/**
 * Create an auto-reply message object
 * @param {string} userMessage - The user's original message
 * @param {string} sellerId - ID of the seller/demo user
 * @param {string} sellerName - Name of the seller
 * @param {string} listingId - Listing ID for the conversation
 * @returns {Object} Message object ready to add to conversation
 */
export function createAutoReplyMessage(userMessage, sellerId, sellerName, listingId) {
  const replyText = generateAutoReply(userMessage)
  
  return {
    id: `auto-reply-${Date.now()}`,
    senderId: sellerId,
    senderName: sellerName,
    text: replyText,
    createdAt: new Date().toISOString(),
    listingId: listingId,
    isAutoReply: true,
    isDemoMode: true
  }
}
