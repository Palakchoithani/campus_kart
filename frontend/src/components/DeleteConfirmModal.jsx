import React from 'react'
import './DeleteConfirmModal.css'

export default function DeleteConfirmModal({
  isOpen,
  isLoading = false,
  listingTitle = 'this listing',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="delete-modal-backdrop" onClick={onCancel} />

      {/* Modal */}
      <div className="delete-modal">
        <div className="delete-modal__content">
          {/* Icon */}
          <div className="delete-modal__icon">🗑️</div>

          {/* Title */}
          <h2 className="delete-modal__title">Delete Listing?</h2>

          {/* Description */}
          <p className="delete-modal__description">
            Are you sure you want to delete this listing?
            <br />
            <strong>{listingTitle}</strong>
          </p>

          {/* Actions */}
          <div className="delete-modal__actions">
            <button
              onClick={onCancel}
              className="btn btn-secondary delete-modal__cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn btn-danger delete-modal__confirm"
              disabled={isLoading}
            >
              {isLoading ? '🗑️ Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
