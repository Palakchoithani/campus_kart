import React, { useMemo, useRef, useState } from 'react'
import api from '../services/api'
import PaymentModal from '../components/PaymentModal'
import { useToast } from '../context/ToastContext.jsx'
import './CreateListing.css'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const CATEGORIES = ['Books', 'Bicycle', 'Notes', 'Electronics', 'Furniture', 'Other']

function createImageId(file) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`
}
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

const EMPTY_FORM = {
  title: '', description: '', price: '', category: 'Books',
  location: '', listingType: 'sell', condition: 'good',
  collegeName: '', tags: '', isUrgent: false, isPremium: false, images: [],
}

export default function CreateListing({ onCreateListing }) {
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingListingData, setPendingListingData] = useState(null)

  const imageCountLabel = useMemo(() => {
    if (formData.images.length === 0) return 'No photos yet'
    if (formData.images.length === 1) return '1 photo'
    return `${formData.images.length} photos`
  }, [formData.images.length])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const normalizeFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    const valid = []
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) { toast.error(`${file.name}: only JPG and PNG allowed`); continue }
      if (file.size > MAX_IMAGE_SIZE)           { toast.error(`${file.name}: must be under 5MB`);       continue }
      valid.push(file)
    }
    if (!valid.length) return
    const items = await Promise.all(
      valid.map(async file => ({ id: createImageId(file), name: file.name, size: file.size, type: file.type, preview: await readFileAsDataUrl(file) }))
    )
    setFormData(prev => ({ ...prev, images: [...prev.images, ...items] }))
  }

  const handleFileSelect = async (e) => { await normalizeFiles(e.target.files); e.target.value = '' }
  const handleDrop = async (e) => { e.preventDefault(); setIsDragging(false); await normalizeFiles(e.dataTransfer.files) }

  const moveImage = (index, dir) => {
    setFormData(prev => {
      const next = [...prev.images]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      const [sel] = next.splice(index, 1)
      next.splice(target, 0, sel)
      return { ...prev, images: next }
    })
  }
  const removeImage = (id) => setFormData(prev => ({ ...prev, images: prev.images.filter(i => i.id !== id) }))
  const clearForm = () => { setFormData(EMPTY_FORM); if (fileInputRef.current) fileInputRef.current.value = '' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim())                         { toast.error('Title is required');       return }
    if (!formData.price || parseInt(formData.price) <= 0) { toast.error('Enter a valid price');    return }
    if (!formData.location.trim())                      { toast.error('Location is required');    return }

    const payload = {
      title: formData.title.trim(), description: formData.description.trim(),
      price: Number(formData.price), category: formData.category,
      location: formData.location.trim(), listingType: formData.listingType,
      condition: formData.condition, collegeName: formData.collegeName.trim(),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      isUrgent: formData.isUrgent, isPremium: formData.isPremium,
      images: formData.images.map(i => i.preview),
    }

    if (formData.isPremium) { setPendingListingData(payload); setShowPaymentModal(true); return }
    await createDirectly(payload)
  }

  const createDirectly = async (data) => {
    try {
      const result = await api.createListing(data)
      const newListing = result?.listing || {
        ...data,
        id: 'new-' + Date.now(),
        userEmail: 'you@college.edu',
        createdAt: new Date().toISOString(),
        image: data.images?.[0] || ''
      }
      toast.success('Listing posted! 🎉')
      onCreateListing?.(newListing)
      clearForm()
    } catch (err) {
      // Fallback for stable demo experience
      const mockListing = {
        ...data,
        id: 'new-' + Date.now(),
        userEmail: 'you@college.edu',
        createdAt: new Date().toISOString(),
        image: data.images?.[0] || ''
      }
      toast.success('Listing posted (Demo Mode)! 🎉')
      onCreateListing?.(mockListing)
      clearForm()
    }
  }

  const handlePaymentSuccess = async () => {
    if (pendingListingData) {
      setShowPaymentModal(false)
      await createDirectly(pendingListingData)
      setPendingListingData(null)
    }
  }

  return (
    <div className="create-listing">
      {showPaymentModal && (
        <PaymentModal
          listingData={pendingListingData}
          listingId={null}
          onSuccess={handlePaymentSuccess}
          onCancel={() => { setShowPaymentModal(false); setPendingListingData(null) }}
        />
      )}

      <div className="create-listing__intro">
        <p className="eyebrow">New Listing</p>
        <h2 className="section-title">Add a Listing</h2>
        <p className="section-copy">Share books, gear, notes, or anything useful to your campus.</p>
      </div>

      <form className="create-listing__form" onSubmit={handleSubmit}>
        {/* ── Step 1: Details ── */}
        <div className="create-section">
          <div className="create-section__header">
            <span className="create-step">01</span>
            <div>
              <h3 className="create-section__title">Listing Details</h3>
              <p className="create-section__sub">Clear info helps students find your listing faster.</p>
            </div>
          </div>

          <div className="create-grid">
            <div className="field">
              <label className="field__label" htmlFor="cl-title">Title *</label>
              <input className="input" id="cl-title" name="title" type="text" value={formData.title} onChange={handleChange} placeholder="e.g., Old Physics Notes" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-price">Price (₹) *</label>
              <input className="input" id="cl-price" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="150" min="0" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-location">Location *</label>
              <input className="input" id="cl-location" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="Hostel 7, Main Gate..." />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-category">Category</label>
              <select className="select" id="cl-category" name="category" value={formData.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-type">Listing Type</label>
              <select className="select" id="cl-type" name="listingType" value={formData.listingType} onChange={handleChange}>
                <option value="sell">Sell</option>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-condition">Condition</label>
              <select className="select" id="cl-condition" name="condition" value={formData.condition} onChange={handleChange}>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="used">Used</option>
              </select>
            </div>
            <div className="field create-grid__full">
              <label className="field__label" htmlFor="cl-desc">Description</label>
              <textarea className="textarea" id="cl-desc" name="description" value={formData.description} onChange={handleChange} placeholder="More details about the item, its condition, reason for selling..." rows={4} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-college">College / Campus</label>
              <input className="input" id="cl-college" name="collegeName" type="text" value={formData.collegeName} onChange={handleChange} placeholder="CampusKart College" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cl-tags">Tags</label>
              <input className="input" id="cl-tags" name="tags" type="text" value={formData.tags} onChange={handleChange} placeholder="books, hostel, urgent" />
            </div>
          </div>
        </div>

        {/* ── Step 2: Photos ── */}
        <div className="create-section">
          <div className="create-section__header">
            <span className="create-step">02</span>
            <div>
              <h3 className="create-section__title">Photos</h3>
              <p className="create-section__sub">Upload multiple images. JPG or PNG, max 5MB each.</p>
            </div>
          </div>

          <div
            className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
            onDrop={handleDrop}
            tabIndex={0}
            role="button"
            aria-label="Upload images"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
          >
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" multiple onChange={handleFileSelect} className="dropzone__input" />
            <div className="dropzone__icon"><span className="icon icon-2xl">{isDragging ? '📂' : '⇪'}</span></div>
            <div className="dropzone__text">
              <p className="dropzone__title">{isDragging ? 'Drop files here' : 'Drag & drop or click to upload'}</p>
              <p className="dropzone__sub">JPG or PNG, up to 5MB each — {imageCountLabel}</p>
            </div>
          </div>

          {formData.images.length > 0 && (
            <div className="preview-grid">
              {formData.images.map((img, i) => (
                <article key={img.id} className="preview-card">
                  <img src={img.preview} alt={img.name} className="preview-card__img" />
                  <div className="preview-card__overlay">
                    <button type="button" className="preview-card__del" onClick={() => removeImage(img.id)} aria-label={`Remove ${img.name}`}><span className="icon icon-lg">✕</span></button>
                    <div className="preview-card__order">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move left"><span className="icon icon-md">↑</span></button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === formData.images.length - 1} aria-label="Move right"><span className="icon icon-md">↓</span></button>
                    </div>
                  </div>
                  {i === 0 && <span className="preview-card__primary">Cover</span>}
                </article>
              ))}
            </div>
          )}
        </div>

        {/* ── Step 3: Options ── */}
        <div className="create-section">
          <div className="create-section__header">
            <span className="create-step">03</span>
            <div>
              <h3 className="create-section__title">Boost Options</h3>
              <p className="create-section__sub">Increase visibility with urgency or premium placement.</p>
            </div>
          </div>

          <div className="boost-options">
            <label className={`boost-card ${formData.isUrgent ? 'boost-card--active boost-card--urgent' : ''}`} htmlFor="cl-urgent">
              <input type="checkbox" id="cl-urgent" name="isUrgent" checked={formData.isUrgent} onChange={handleChange} className="boost-card__check" />
              <span className="boost-card__icon icon icon-lg">🔥</span>
              <div>
                <p className="boost-card__title">Mark as Urgent</p>
                <p className="boost-card__desc">Rise to the top in urgent sort order</p>
              </div>
              <span className="boost-card__tick icon icon-md">{formData.isUrgent ? '✓' : ''}</span>
            </label>
            <label className={`boost-card ${formData.isPremium ? 'boost-card--active boost-card--premium' : ''}`} htmlFor="cl-premium">
              <input type="checkbox" id="cl-premium" name="isPremium" checked={formData.isPremium} onChange={handleChange} className="boost-card__check" />
              <span className="boost-card__icon icon icon-lg">⭐</span>
              <div>
                <p className="boost-card__title">Make Premium</p>
                <p className="boost-card__desc">Gold border + priority placement on the feed</p>
              </div>
              <span className="boost-card__tick icon icon-md">{formData.isPremium ? '✓' : ''}</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="create-listing__actions">
          <button type="button" className="btn btn-reset" onClick={clearForm}><span className="icon icon-lg">🔄</span> Reset Form</button>
          <button type="submit" className="btn btn-primary">
            <span className="icon icon-lg">{formData.isPremium ? '⭐' : '🚀'}</span> {formData.isPremium ? 'Post Premium Listing' : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}