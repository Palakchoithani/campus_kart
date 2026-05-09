import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './ListingCard.css'

export default function ListingCard({ listing, onClick, onDelete, user, layout = 'grid' }) {
  const { title, price, location, image, userEmail, isUrgent, isPremium, category, condition } = listing
  const [imageError, setImageError] = useState(false)
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [loadingRating, setLoadingRating] = useState(false)
  
  const isOwner = user?.id === listing.userId

  useEffect(() => {
    // Fetch ratings for this listing
    const fetchRatings = async () => {
      try {
        setLoadingRating(true)
        const data = await api.getRatings(listing.id)
        setAvgRating(Number(data.avgRating) || 0)
        setRatingCount(data.count || 0)
      } catch (err) {
        // Silent fail - ratings are optional
        console.error('Failed to fetch ratings:', err)
      } finally {
        setLoadingRating(false)
      }
    }

    if (listing?.id) {
      fetchRatings()
    }
  }, [listing?.id])

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    onDelete?.(listing)
  }

  return (
    <article
      className={`listing-card listing-card--${layout} ${isUrgent ? 'listing-card--urgent' : ''} ${isPremium ? 'listing-card--premium' : ''}`}
      onClick={() => onClick?.(listing)}
      tabIndex={0}
      role="button"
      aria-label={`View listing: ${title}, ₹${price}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(listing) } }}
    >
      {/* Badge stack */}
      <div className="listing-card__badges">
        {isUrgent  && <span className="badge badge--urgent"><span className="icon icon-sm">🔥</span> Urgent</span>}
        {isPremium && <span className="badge badge--premium"><span className="icon icon-sm">⭐</span> Premium</span>}
      </div>

      {/* Delete button (for owner) */}
      {isOwner && (
        <button
          onClick={handleDeleteClick}
          className="listing-card__delete-btn"
          title="Delete this listing"
          aria-label="Delete listing"
        >
          <span className="icon icon-md">🗑️</span>
        </button>
      )}

      {/* Image */}
      <div className="listing-card__image-box">
        {image && !imageError ? (
          <img 
            src={image} 
            alt={title} 
            className="listing-card__img"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="listing-card__img-empty" aria-hidden="true">
            <span>📷</span>
          </div>
        )}
        <div className="listing-card__price">₹{price}</div>
      </div>

      {/* Body */}
      <div className="listing-card__content">
        <div className="listing-card__category">{category}</div>
        <h3 className="listing-card__title">{title}</h3>

        {/* Rating display */}
        {!loadingRating && ratingCount > 0 && (
          <div className="listing-card__rating">
            <span className="listing-card__rating-stars">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
            <span className="listing-card__rating-score">{Number(avgRating).toFixed(1)}</span>
            <span className="listing-card__rating-count">({ratingCount})</span>
          </div>
        )}

        <div className="listing-card__footer">
          {location && <span className="listing-card__location"><span className="icon icon-md">📍</span> {location}</span>}
          {condition && <span className="listing-card__condition">{condition}</span>}
        </div>

        {userEmail && (
          <p className="listing-card__seller">by {userEmail?.split('@')[0] || 'User'}</p>
        )}

        {layout === 'list' && (
          <div className="listing-card__list-footer">
            <span className="listing-card__list-price">₹{price}</span>
            <span className="listing-card__cta">View details →</span>
          </div>
        )}
      </div>
    </article>
  )
}
