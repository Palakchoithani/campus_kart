const STORAGE_PREFIX = 'campuskart_ratings'

function storageKey(listingId) {
  return `${STORAGE_PREFIX}_${listingId}`
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    return []
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStoredRatings(listingId) {
  if (!listingId) return []
  return readJson(storageKey(listingId))
}

export function saveRatings(listingId, ratings) {
  if (!listingId) return []
  const normalized = Array.isArray(ratings) ? ratings : []
  writeJson(storageKey(listingId), normalized)
  return normalized
}

export function upsertStoredRating(listingId, rating) {
  if (!listingId || !rating) return []

  const existing = getStoredRatings(listingId)
  const next = [rating, ...existing.filter((item) => item.id !== rating.id)]
  writeJson(storageKey(listingId), next)
  return next
}

export function mergeRatings(apiRatings = [], storedRatings = []) {
  const map = new Map()

  ;[...(Array.isArray(apiRatings) ? apiRatings : []), ...(Array.isArray(storedRatings) ? storedRatings : [])].forEach((rating) => {
    if (rating?.id) {
      map.set(rating.id, rating)
    }
  })

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )
}
