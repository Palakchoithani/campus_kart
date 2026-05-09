import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { SkeletonCard } from '../components/Skeleton'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import api from '../services/api'
import './Home.css'

const CATEGORIES = [
  { value: 'all', label: 'All', icon: '🔍' },
  { value: 'Books', label: 'Books', icon: '📚' },
  { value: 'Bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'Notes', label: 'Notes', icon: '📝' },
  { value: 'Electronics', label: 'Electronics', icon: '💻' },
  { value: 'Furniture', label: 'Furniture', icon: '🪑' },
  { value: 'Other', label: 'Other', icon: '📦' },
]

export default function Home({ listings = [], setListings, onSelectListing, user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ category: 'all', location: '', search: '', sortBy: 'recent' })
  const [isGridView, setIsGridView] = useState(() => {
    const v = localStorage.getItem('campuskart-layout-view')
    return v ? v === 'grid' : true
  })
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, listing: null })
  const searchRef = useRef(null)

  useEffect(() => {
    if (listings.length > 0) return

    let cancelled = false
    const loadListings = async () => {
      setLoading(true)
      try {
        const data = await api.getListings()
        if (!cancelled) {
          setListings(Array.isArray(data) ? data : [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load listings')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadListings()
    return () => {
      cancelled = true
    }
  }, [listings.length, setListings])

  const displayListings = listings

  const filteredListings = useMemo(() => {
    let result = displayListings.filter((l) => {
      const matchCat = filters.category === 'all' || l.category === filters.category
      const matchSearch =
        !filters.search ||
        l.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        l.description?.toLowerCase().includes(filters.search.toLowerCase())
      const matchLoc =
        !filters.location ||
        l.location?.toLowerCase().includes(filters.location.toLowerCase())
      return matchCat && matchSearch && matchLoc
    })

    // Sort results
    if (filters.sortBy === 'urgent') {
      result.sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0))
    } else if (filters.sortBy === 'premium') {
      result.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0))
    } else if (filters.sortBy === 'price_low') {
      result.sort((a, b) => a.price - b.price)
    } else if (filters.sortBy === 'price_high') {
      result.sort((a, b) => b.price - a.price)
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return result
  }, [displayListings, filters])

  useEffect(() => {
    localStorage.setItem('campuskart-layout-view', isGridView ? 'grid' : 'list')
  }, [isGridView])

  const activeFilters = useMemo(() => {
    const vals = []
    if (filters.location) vals.push(`📍 ${filters.location}`)
    if (filters.search) vals.push(`🔎 ${filters.search}`)
    if (filters.sortBy !== 'recent') vals.push(`⬆ ${filters.sortBy}`)
    return vals
  }, [filters])

  const set = (field, value) =>
    setFilters((prev) => ({ ...prev, [field]: value }))
  const clearFilters = () =>
    setFilters({ category: 'all', location: '', search: '', sortBy: 'recent' })

  const handleSelectListing = (listing) => {
    onSelectListing(listing)
    navigate(`/listing/${listing.id}`)
  }

  const handleDeleteListing = (listing) => {
    setDeleteModalState({ isOpen: true, listing })
  }

  const confirmDelete = async () => {
    const listing = deleteModalState.listing
    if (!listing) return

    try {
      await api.deleteListing(listing.id)
      setListings((prev) => prev.filter((l) => l.id !== listing.id))
      setDeleteModalState({ isOpen: false, listing: null })
    } catch (err) {
      console.error('Failed to delete listing:', err)
    }
  }

  return (
    <section className="home-page" aria-label="CampusKart listings">
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        listingTitle={deleteModalState.listing?.title}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, listing: null })}
      />
      {/* Header */}
      <div className="home-page__header">
        <div>
          <p className="eyebrow" style={{ color: 'var(--yellow)' }}>Campus Marketplace</p>
          <h2 className="section-title" style={{ marginTop: '0.25rem' }}>
            Latest Listings
          </h2>
          <div className="home-page__chips">
            {!loading && (
              <span className="home-chip home-chip--count">{displayListings.length} listings</span>
            )}
            {activeFilters.map((f) => (
              <span key={f} className="home-chip">
                {f}
              </span>
            ))}
            {activeFilters.length > 0 && (
              <button className="home-chip home-chip--clear" onClick={clearFilters}>
                <span className="icon icon-md">✕</span> Clear
              </button>
            )}
          </div>
        </div>

        <div className="home-page__toolbar">
          <div className="toolbar-group">
            <select
              className="toolbar-dropdown toolbar-sort"
              value={filters.sortBy}
              onChange={(e) => set('sortBy', e.target.value)}
              aria-label="Sort listings"
              title="Sort by"
            >
              <option value="recent">⏱ Latest</option>
              <option value="premium">⭐ Popular</option>
              <option value="price_low">📉 Price: Low to High</option>
              <option value="price_high">📈 Price: High to Low</option>
              <option value="urgent">🔥 Urgent First</option>
            </select>
          </div>
          
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              className={`view-toggle__btn ${isGridView ? 'view-toggle__btn--active' : ''}`}
              onClick={() => setIsGridView(true)}
              aria-pressed={isGridView}
              title="Grid view"
              aria-label="Switch to grid view"
            >
              <span className="icon icon-md">⊞</span>
            </button>
            <button
              className={`view-toggle__btn ${!isGridView ? 'view-toggle__btn--active' : ''}`}
              onClick={() => setIsGridView(false)}
              aria-pressed={!isGridView}
              title="List view"
              aria-label="Switch to list view"
            >
              <span className="icon icon-md">☰</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="home-search">
        <span className="home-search__icon icon icon-lg">🔍</span>
        <input
          ref={searchRef}
          className="home-search__input"
          type="text"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search listings, books, electronics..."
          aria-label="Search listings"
        />
        {filters.search && (
          <button
            className="home-search__clear"
            onClick={() => set('search', '')}
            aria-label="Clear search"
          >
            <span className="icon icon-lg">✕</span>
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="home-categories" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`cat-pill ${filters.category === cat.value ? 'cat-pill--active' : ''}`}
            onClick={() => set('category', cat.value)}
            aria-pressed={filters.category === cat.value}
          >
            <span className="icon icon-lg">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="home-filters">
        <div className="home-filter-field">
          <span className="home-filter-field__icon icon icon-lg">📍</span>
          <input
            className="home-filter-input"
            type="text"
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Location (Hostel, Gate...)"
            aria-label="Filter by location"
          />
        </div>
      </div>

      {/* Listings grid */}
      <div
        className={`listing-grid ${isGridView ? 'listing-grid--grid' : 'listing-grid--list'}`}
        aria-busy={loading}
        aria-label="Listings"
      >
        {error ? (
          <p className="error-state" style={{ gridColumn: '1/-1' }}>
            ⚠ {error}
          </p>
        ) : loading && filteredListings.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredListings.length === 0 ? (
          <div className="home-empty" style={{ gridColumn: '1/-1' }}>
            <p className="home-empty__icon">🏷️</p>
            <p className="home-empty__title">No listings found</p>
            <p className="home-empty__sub">Try adjusting your filters or search term.</p>
            <button
              className="btn btn-secondary"
              onClick={clearFilters}
              style={{ marginTop: '0.75rem' }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredListings.map((l, i) => (
            <div key={l.id} className={`stagger-${Math.min(i + 1, 6)}`}>
              <ListingCard
                listing={l}
                onClick={() => handleSelectListing(l)}
                onDelete={handleDeleteListing}
                user={user}
                layout={isGridView ? 'grid' : 'list'}
              />
            </div>
          ))
        )}
      </div>

      {loading && displayListings.length > 0 && (
        <p className="loading-state" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          Updating results...
        </p>
      )}
    </section>
  )
}