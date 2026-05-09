import React, { useState } from 'react'
import api from '../services/api'
import './PaymentModal.css'

export default function PaymentModal({ listingData, listingId, onSuccess, onCancel }) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePayment = async () => {
    setProcessing(true)
    setError('')
    try {
      await api.processPayment(listingId || null, 99)
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Payment failed')
      setProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="payment-modal__overlay">
        <div className="payment-modal payment-modal--success">
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h2>Payment Successful!</h2>
            <p>Your listing is now premium for 30 days.</p>
            <p className="premium-details">Premium listings get:</p>
            <ul className="premium-perks">
              <li>⭐ Featured on top of search results</li>
              <li>🔥 Highlighted with premium badge</li>
              <li>💬 Priority in conversations</li>
              <li>📈 Better visibility to buyers</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-modal__overlay" onClick={onCancel}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal__close" onClick={onCancel}>✕</button>
        
        <div className="payment-modal__header">
          <h2>Make Your Listing Premium</h2>
          <p>Get more visibility and faster sales</p>
        </div>

        <div className="payment-modal__content">
          <div className="premium-showcase">
            <div className="showcase-item">
              <span className="showcase-icon">⭐</span>
              <div>
                <h3>Top Position</h3>
                <p>Featured at the top of search results for 30 days</p>
              </div>
            </div>
            <div className="showcase-item">
              <span className="showcase-icon">🔥</span>
              <div>
                <h3>Premium Badge</h3>
                <p>Stand out with a special premium badge</p>
              </div>
            </div>
            <div className="showcase-item">
              <span className="showcase-icon">💬</span>
              <div>
                <h3>Priority Chat</h3>
                <p>Your messages get prioritized visibility</p>
              </div>
            </div>
          </div>

          <div className="payment-modal__pricing">
            <div className="price-breakdown">
              <div className="price-row">
                <span>Premium Upgrade (30 days)</span>
                <span className="price">₹99</span>
              </div>
              <div className="price-row price-row--total">
                <span>Total</span>
                <span className="price">₹99</span>
              </div>
            </div>
          </div>

          {error && <p className="error-state">{error}</p>}

          <div className="payment-modal__actions">
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={processing}
            >
              Skip for now
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Unlock Premium'}
            </button>
          </div>

          <p className="payment-modal__note">
            💳 Test mode: No real payment required. This is a test transaction.
          </p>
        </div>
      </div>
    </div>
  )
}
