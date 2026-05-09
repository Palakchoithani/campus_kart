const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function parseJsonResponse(res, fallbackMessage) {
  const contentType = res.headers.get('content-type') || ''
  let data = null
  let textBody = ''

  if (contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch (error) {
      data = null
    }
  } else {
    try {
      textBody = (await res.text()) || ''
    } catch (error) {
      textBody = ''
    }
  }

  if (!res.ok) {
    const nonJsonMessage = textBody
      ? textBody.replace(/\s+/g, ' ').trim().slice(0, 200)
      : ''
    const message =
      data?.error ||
      data?.message ||
      nonJsonMessage ||
      `${fallbackMessage || 'Request failed'} (HTTP ${res.status})`
    throw new Error(message)
  }

  return data
}

// Wrapper to make fetch errors explicit (network vs HTTP status)
async function doFetch(...args) {
  try {
    return await fetch(...args)
  } catch (err) {
    throw new Error('Network error: could not reach backend — ' + (err && err.message ? err.message : String(err)))
  }
}

// Simple helper to GET listings from backend
export async function getListings(filters = {}) {
  const query = new URLSearchParams()

  if (filters.category && filters.category !== 'all') query.set('category', filters.category)
  if (filters.location) query.set('location', filters.location)
  if (filters.search) query.set('search', filters.search)
  if (filters.sortBy) query.set('sortBy', filters.sortBy)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const res = await doFetch(`${API_BASE}/listings${suffix}`)
  return parseJsonResponse(res, 'Failed to fetch listings')
}

export async function createListing(payload) {
  const token = localStorage.getItem('campus_token')
  
  const res = await doFetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  })
  return parseJsonResponse(res, 'Failed to create listing')
}

export async function deleteListing(id) {
  const token = localStorage.getItem('campus_token')
  const res = await doFetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  })
  return parseJsonResponse(res, 'Failed to delete listing')
}

export async function getRatings(listingId) {
  const res = await doFetch(`${API_BASE}/ratings/listing/${listingId}`)
  return parseJsonResponse(res, 'Failed to fetch ratings')
}

export async function createRating(listingId, rating, comment) {
  const token = localStorage.getItem('campus_token')
  const res = await doFetch(`${API_BASE}/ratings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ listingId, rating, comment }),
  })
  return parseJsonResponse(res, 'Failed to add rating')
}

export async function getMessages(listingId, sellerId) {
  const token = localStorage.getItem('campus_token')
  const query = new URLSearchParams({ listingId, sellerId })
  const res = await doFetch(`${API_BASE}/messages?${query.toString()}`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  })
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json()
}

export async function sendMessage(listingId, receiverId, text) {
  const token = localStorage.getItem('campus_token')
  const res = await doFetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ listingId, receiverId, text }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function getConversations() {
  const token = localStorage.getItem('campus_token')
  const res = await doFetch(`${API_BASE}/messages`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  })
  return parseJsonResponse(res, 'Failed to fetch conversations')
}

// Auth-aware fetch helper — attaches JWT if present
export function authFetch(path, options = {}) {
  const token = localStorage.getItem('campus_token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return doFetch(`${API_BASE}${path}`, { ...options, headers })
}

// Minimal login helper (returns JSON with token/user)
export async function login(email, password) {
  const res = await doFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return parseJsonResponse(res, 'Login failed')
}

export async function signup(payloadOrEmail, password) {
  const payload = typeof payloadOrEmail === 'object'
    ? payloadOrEmail
    : { email: payloadOrEmail, password }

  const res = await doFetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseJsonResponse(res, 'Signup failed')
}

export async function requestPasswordReset(email) {
  const res = await doFetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return parseJsonResponse(res, 'Failed to request password reset')
}

export async function resetPassword({ email, token, password }) {
  const res = await doFetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, password }),
  })
  return parseJsonResponse(res, 'Failed to reset password')
}

export async function getCurrentUser() {
  const res = await authFetch('/auth/me', {
    method: 'GET',
    headers: {},
  })

  return parseJsonResponse(res, 'Failed to load user')
}

export async function processPayment(listingId, amount = 99) {
  const token = localStorage.getItem('campus_token')
  const res = await doFetch(`${API_BASE}/payments/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ listingId, amount }),
  })
  if (!res.ok) throw new Error('Payment processing failed')
  return res.json()
}

export async function checkPremiumStatus(listingId) {
  const token = localStorage.getItem('campus_token')
  const res = await doFetch(`${API_BASE}/payments/status/${listingId}`, {
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  })
  if (!res.ok) throw new Error('Failed to check premium status')
  return res.json()
}

export default {
  API_BASE,
  getListings,
  authFetch,
  login,
  signup,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  createListing,
  deleteListing,
  getRatings,
  createRating,
  getMessages,
  sendMessage,
  getConversations,
  processPayment,
  checkPremiumStatus,
}
