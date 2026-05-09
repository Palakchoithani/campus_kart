import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import api from '../services/api'
import './Profile.css'

export default function Profile({ user, listings, onDeleteListing }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { logout } = useAuth()
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, listing: null })

  const userListings = listings.filter((l) => l.userId === user?.id)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/')
    } catch (error) {
      toast.error('Logout failed: ' + error.message)
    }
  }

  const handleDeleteListing = (listing) => {
    setDeleteModalState({ isOpen: true, listing })
  }

  const confirmDelete = async () => {
    const listing = deleteModalState.listing
    if (!listing) return

    try {
      await api.deleteListing(listing.id)
      onDeleteListing?.(listing.id)
      toast.success('Listing deleted successfully')
      setDeleteModalState({ isOpen: false, listing: null })
    } catch (err) {
      toast.error('Failed to delete: ' + err.message)
    }
  }

  return (
    <div className="profile-page">
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        listingTitle={deleteModalState.listing?.title}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, listing: null })}
      />
      <div className="profile-container">
        {/* Profile Header - Minimal */}
        <div className="profile-header">
          <div className="profile-avatar">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user?.name || 'Campus User'}</h1>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat-card">
            <strong>{userListings.length}</strong>
            <span>Active Listings</span>
          </div>
          <div className="stat-card">
            <strong>5</strong>
            <span>Transactions</span>
          </div>
          <div className="stat-card">
            <strong>4.8★</strong>
            <span>Rating</span>
          </div>
        </div>

        {/* Listings Section */}
        <div className="profile-section">
          <h2>Your Listings</h2>
          {userListings.length > 0 ? (
            <div className="listings-grid">
              {userListings.map((listing) => (
                <div
                  key={listing.id}
                  className="listing-item"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <div className="listing-item__image-wrapper">
                    <img src={listing.image} alt={listing.title} />
                    <button
                      className="listing-item__delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteListing(listing)
                      }}
                      title="Delete listing"
                      aria-label="Delete listing"
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                  <h3>{listing.title}</h3>
                  <p className="price">₹{listing.price.toLocaleString()}</p>
                  <p className="category">{listing.category}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No listings yet. Create one to get started!</p>
          )}
          <button className="btn-primary" onClick={() => navigate('/create')}>
            + Create New Listing
          </button>
        </div>

        {/* Campus Mode - Settings */}
        <div className="profile-section">
          <h2>Preferences</h2>
          <div className="settings-list">
            <button className="setting-item campus-mode">
              <div className="setting-content">
                <span className="setting-label">Campus Mode</span>
                <span className="setting-desc">Browse & sell within your campus community</span>
              </div>
              <span className="toggle-switch" role="switch" aria-checked="true">
                <span className="toggle-knob"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="profile-section">
          <button className="btn-danger" onClick={handleLogout}>
            <span className="icon icon-lg">🚪</span> Logout
          </button>
        </div>
      </div>
    </div>
  )
}
