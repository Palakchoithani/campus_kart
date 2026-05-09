import { useEffect, useState } from 'react'
import api from '../services/api'
import PaymentModal from '../components/PaymentModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useToast } from '../context/ToastContext.jsx'
import './ListingDetail.css'

const STARS = [1, 2, 3, 4, 5]

function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="star-rating" role="group" aria-label="Rating">
      {STARS.map(s => (
        <button
          key={s}
          type="button"
          className={`star-btn icon icon-lg ${s <= (hovered || value) ? 'star-btn--filled' : ''}`}
          onClick={() => !readOnly && onChange?.(s)}
          onMouseEnter={() => !readOnly && setHovered(s)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
          disabled={readOnly}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function ListingDetail({ listing, onBack, onChat, onDeleteListing, user }) {
  const toast = useToast()
  const [ratings, setRatings] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const fetchRatings = async () => {
    try {
      const data = await api.getRatings(listing.id)
      const visibleRatings = data.ratings || []

      setRatings(visibleRatings)
      setAvgRating(
        visibleRatings.length > 0
          ? Number((visibleRatings.reduce((sum, rating) => sum + Number(rating.rating || 0), 0) / visibleRatings.length).toFixed(1))
          : Number(data.avgRating) || 0,
      )
      setRatingCount(visibleRatings.length > 0 ? visibleRatings.length : (data.count || 0))
    } catch (err) {
      setRatings([])
      setAvgRating(0)
      setRatingCount(0)
      console.error('Failed to fetch ratings:', err)
    }
  }

  useEffect(() => { if (listing?.id) fetchRatings() }, [listing?.id])

  const handleRatingSubmit = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please login to rate'); return }
    setSubmitting(true)

    try {
      await api.createRating(listing.id, ratingForm.rating, ratingForm.comment)
      setRatingForm({ rating: 5, comment: '' })
      await fetchRatings()
      toast.success('Rating submitted!')
    } catch (err) {
      toast.error(err.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteListing(listing.id)
      onDeleteListing?.(listing.id)
      toast.success('Listing deleted successfully')
      setShowDeleteModal(false)
      onBack?.()
    } catch (err) {
      toast.error('Failed to delete: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handlePremiumSuccess = () => {
    setShowPaymentModal(false)
    listing.isPremium = true
    toast.success('Listing is now Premium ⭐')
  }

  if (!listing) return <p className="empty-state">No listing selected</p>

  const isOwner = user?.id === listing.userId

  return (
    <div className="detail-page">
      {showPaymentModal && (
        <PaymentModal
          listingData={listing}
          listingId={listing.id}
          onSuccess={handlePremiumSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        isLoading={deleting}
        listingTitle={listing.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Back + title */}
      <div className="detail-page__header">
        <button onClick={onBack} className="btn btn-secondary detail-back-btn">
          <span className="icon icon-lg">←</span> Back
        </button>
        <div>
          <p className="eyebrow">Listing detail</p>
          <h1 className="section-title">{listing.title}</h1>
        </div>
      </div>

      {/* Hero image */}
      {listing.image && (
        <div className="detail-page__hero-img">
          <img src={listing.image} alt={listing.title} />
          <div className="detail-page__hero-overlay">
            <div className="detail-page__hero-badges">
              {listing.isUrgent  && <span className="badge urgent"><span className="icon icon-sm">🔥</span> Urgent</span>}
              {listing.isPremium && <span className="badge premium"><span className="icon icon-sm">⭐</span> Premium</span>}
            </div>
          </div>
        </div>
      )}

      {/* Meta chips */}
      <div className="detail-page__meta-row">
        <span className="detail-meta-chip detail-meta-chip--price">₹{listing.price}</span>
        {listing.category  && <span className="detail-meta-chip">{listing.category}</span>}
        {listing.condition && <span className="detail-meta-chip">{listing.condition}</span>}
        {listing.location  && <span className="detail-meta-chip"><span className="icon icon-md">📍</span> {listing.location}</span>}
        <span className="detail-meta-chip">by {listing.userEmail}</span>
        <span className="detail-meta-chip">{new Date(listing.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Main grid */}
      <div className="detail-page__grid">
        {/* Description + Actions */}
        <div className="detail-page__main">
          <div className="detail-card">
            <h2 className="detail-card__title">Description</h2>
            <p className="detail-card__body" style={{ whiteSpace: 'pre-wrap' }}>
              {listing.description || 'No description provided.'}
            </p>
          </div>

          {/* Action bar */}
          <div className="detail-actions">
            {!isOwner && (
              <button
                onClick={() => onChat(listing.id, listing.userId)}
                className="btn btn-primary detail-actions__primary"
              >
                <span className="icon icon-lg">💬</span> Message Seller
              </button>
            )}
            {isOwner && !listing.isPremium && (
              <button onClick={() => setShowPaymentModal(true)} className="btn btn-secondary">
                <span className="icon icon-lg">⭐</span> Make Premium
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-secondary detail-actions__delete"
                disabled={deleting}
              >
                <span className="icon icon-lg">🗑️</span> Delete Listing
              </button>
            )}
          </div>
        </div>

        {/* Ratings sidebar */}
        <aside className="detail-page__aside">
          <div className="detail-card">
            <div className="detail-ratings-header">
              <h2 className="detail-card__title">Ratings</h2>
              <div className="detail-ratings-avg">
                <span className="detail-ratings-score">{Number(avgRating).toFixed(1)}</span>
                <StarRating value={Math.round(avgRating)} readOnly />
                <span className="detail-ratings-count">({ratingCount})</span>
              </div>
            </div>

            <div className="detail-ratings-list">
              {ratings.length === 0 ? (
                <p className="empty-state">No ratings yet</p>
              ) : (
                ratings.map((r, i) => (
                  <div className="detail-rating-item" key={i}>
                    <div className="detail-rating-item__meta">
                      <span className="detail-rating-item__user">{r.userEmail?.split('@')[0]}</span>
                      <StarRating value={r.rating} readOnly />
                    </div>
                    {r.comment && <p className="detail-rating-item__comment">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Add rating form */}
            {user && (
              <form className="detail-rating-form" onSubmit={handleRatingSubmit}>
                <h3 className="detail-card__subtitle">Add Your Rating</h3>
                <StarRating value={ratingForm.rating} onChange={v => setRatingForm(f => ({ ...f, rating: v }))} />
                <textarea
                  className="input"
                  value={ratingForm.comment}
                  onChange={e => setRatingForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience..."
                  rows={3}
                  style={{ marginTop: '0.5rem', borderRadius: 'var(--r-md)' }}
                />
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
