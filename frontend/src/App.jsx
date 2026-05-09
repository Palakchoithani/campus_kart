import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import './App.css'

// Contexts & Providers
import { useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { CursorGlowProvider } from './context/CursorGlowContext'

// Pages
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Inbox from './pages/Inbox'
import Chat from './pages/Chat'
import CreateListing from './pages/CreateListing'
import ListingDetail from './pages/ListingDetail'
import Profile from './pages/Profile'

// Components
import DarkModeToggle from './components/DarkModeToggle'

/**
 * AppLayout - Shared layout for authenticated pages
 * Includes navbar, routing, and proper state management
 */
function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  const chatUserId = location.pathname.match(/^\/chat\/([^/]+)/)?.[1]
  const listingId = location.pathname.match(/^\/listing\/([^/]+)/)?.[1]

  const activeConversation = useMemo(() => {
    if (!chatUserId) return selectedConversation
    if (selectedConversation?.sellerId === chatUserId) return selectedConversation

    const routeConversation = location.state?.conversation
    if (routeConversation?.sellerId === chatUserId) return routeConversation

    return selectedConversation
  }, [chatUserId, location.state, selectedConversation])

  const activeListing = useMemo(() => {
    if (!listingId) return selectedListing
    if (selectedListing?.id === listingId) return selectedListing

    const foundListing = listings.find((listing) => listing.id === listingId)

    return foundListing || selectedListing
  }, [listingId, listings, selectedListing])

  // Handle listing creation
  const handleCreateListing = (newListing) => {
    setListings((prev) => [newListing, ...prev])
  }

  // Handle listing deletion
  const handleDeleteListing = (listingId) => {
    setListings((prev) => prev.filter((listing) => listing.id !== listingId))
  }

  // Redirect unauthenticated users
  useEffect(() => {
    const publicPaths = ['/', '/auth', '/login', '/signup', '/forgot']
    if (!user && !publicPaths.includes(location.pathname)) {
      navigate('/auth')
    }
  }, [user, location.pathname, navigate])

  // Only show navbar on authenticated pages
  const isAuthPage = location.pathname === '/' || location.pathname === '/auth'
  const isLandingPage = location.pathname === '/'

  return (
    <>
      {!isLandingPage && !isAuthPage && (
        <nav className="navbar navbar--app">
          <div className="navbar__brand" onClick={() => navigate('/home')}>
            <span className="navbar__eyebrow">Campus Node</span>
            <span className="navbar__logo">CampusKart</span>
          </div>

          <div className="navbar__nav">
            <button
              className="nav-tab"
              onClick={() => navigate('/home')}
              data-active={location.pathname === '/home'}
            >
              Browse
            </button>
            <button
              className="nav-tab"
              onClick={() => navigate('/inbox')}
              data-active={location.pathname === '/inbox' || location.pathname.startsWith('/chat')}
            >
              Inbox
            </button>
            <button
              className="nav-tab"
              onClick={() => navigate('/create')}
              data-active={location.pathname === '/create'}
            >
              Add Listing
            </button>
          </div>

          <div className="navbar__meta">
            <button
              className="nav-profile-btn"
              onClick={() => navigate('/profile')}
              data-active={location.pathname === '/profile'}
              title="View Profile"
            >
              <span className="nav-profile-btn__name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              <div className="nav-profile-btn__avatar">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            </button>
            <DarkModeToggle />
          </div>
        </nav>
      )}

      <main className={isLandingPage ? 'home-landing' : 'app-main'}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/forgot" element={<Auth />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              user ? (
                <Home
                  listings={listings}
                  setListings={setListings}
                  onSelectListing={setSelectedListing}
                  user={user}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/inbox"
            element={
              user ? (
                <Inbox
                  user={user}
                  activeConversationId={selectedConversation?.id}
                  onSelectConversation={setSelectedConversation}
                />
                ) : (
                  <Navigate to="/auth" replace />
                )
            }
          />
          <Route
            path="/chat/:userId"
            element={
            user && activeConversation ? (
                <Chat
                  listingId={activeConversation.listingId}
                  sellerId={activeConversation.sellerId}
                  user={user}
                  onBack={() => navigate('/inbox')}
                  listingTitle={activeConversation.title}
                />
              ) : (
                <Navigate to="/inbox" replace />
              )
            }
          />
          <Route
            path="/create"
            element={
              user ? (
                <CreateListing onCreateListing={handleCreateListing} />
                ) : (
                  <Navigate to="/auth" replace />
                )
            }
          />
          <Route
            path="/listing/:id"
            element={
              user ? (
                <ListingDetail
                  listing={activeListing}
                  onBack={() => navigate('/home')}
                  onChat={(targetListingId, targetSellerId) => {
                    if (!activeListing || !targetListingId || !targetSellerId) {
                      navigate('/inbox')
                      return
                    }

                    const conversationData = {
                      listingId: targetListingId,
                      sellerId: targetSellerId,
                      title: activeListing.title || 'Chat',
                      roomId: `conversation:${targetListingId}:${[user.id, targetSellerId].sort().join(':')}`,
                      id: `conversation:${targetListingId}:${[user.id, targetSellerId].sort().join(':')}`,
                      otherUserName: activeListing.userEmail?.split('@')[0] || 'Seller',
                      otherUserEmail: activeListing.userEmail,
                    }

                    setSelectedConversation(conversationData)
                    navigate(`/chat/${targetSellerId}`, {
                      state: { conversation: conversationData },
                    })
                  }}
                  onDeleteListing={handleDeleteListing}
                  user={user}
                />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <Profile user={user} listings={listings} onDeleteListing={handleDeleteListing} />
                ) : (
                  <Navigate to="/auth" replace />
                )
            }
          />

          {/* Fallback */}
            <Route path="*" element={user ? <Navigate to="/home" replace /> : <Landing />} />
        </Routes>
      </main>
    </>
  )
}

/**
 * Main App Component
 */
function App() {
  const { sessionReady } = useAuth()

  if (!sessionReady) {
    return <div className="app-loading">Loading...</div>
  }

  return (
    <ToastProvider>
      <CursorGlowProvider>
        <AppLayout />
      </CursorGlowProvider>
    </ToastProvider>
  )
}

export default App
