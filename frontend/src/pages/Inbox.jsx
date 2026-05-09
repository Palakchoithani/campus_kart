import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { SkeletonInboxItem } from '../components/Skeleton'
import { MOCK_CONVERSATIONS } from '../mockData'
import './Inbox.css'

export default function Inbox({ activeConversationId, onSelectConversation }) {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    const list = conversations.length > 0 ? conversations : MOCK_CONVERSATIONS
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(c =>
      c.listingTitle?.toLowerCase().includes(q) ||
      c.otherUserName?.toLowerCase().includes(q) ||
      c.otherUserEmail?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    )
  }, [conversations, searchQuery])

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.getConversations()
        setConversations(Array.isArray(data) && data.length > 0 ? data : [])
        setError(null)
      } catch (err) {
        // Silently fallback to mock in demo
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const iv = setInterval(fetch, 5000)
    return () => clearInterval(iv)
  }, [])

  const formatTime = (date) => {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1)   return 'now'
    if (diffMins < 60)  return `${diffMins}m`
    const diffH = Math.floor(diffMins / 60)
    if (diffH < 24)     return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD === 1)    return 'Yesterday'
    if (diffD < 7)      return `${diffD}d`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const truncate = (text, len = 55) => {
    if (!text) return 'No message'
    return text.length > len ? text.slice(0, len) + '…' : text
  }

  const handleSelect = (conv) => {
    const conversationData = {
      listingId: conv.listingId,
      sellerId: conv.sellerId || conv.userId2,
      title: conv.listingTitle || conv.otherUserName || 'Chat',
      roomId: conv.id,
      id: conv.id,
      otherUserName: conv.otherUserName,
      otherUserEmail: conv.otherUserEmail,
    }
    onSelectConversation(conversationData)
    // Navigate with state
    navigate(`/chat/${conv.sellerId || conv.userId2}`, {
      state: {
        conversation: conversationData,
        fromInbox: true
      },
      replace: false
    })
  }

  const getInitial = (conv) =>
    (conv.otherUserName || conv.otherUserEmail || 'U').charAt(0).toUpperCase()

  return (
    <div className="inbox">
      {/* Header */}
      <div className="inbox__header">
        <div>
          <p className="eyebrow" style={{ color: 'var(--yellow)' }}>Messages</p>
          <h2 className="inbox__title">Inbox</h2>
        </div>
        {!loading && (
          <span className="inbox__count">{filtered.length}</span>
        )}
      </div>

      {/* Search */}
      <div className="inbox__search">
        <span className="inbox__search-icon icon icon-lg">🔍</span>
        <input
          type="text"
          className="inbox__search-input"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      {/* List */}
      <div className="inbox__list">
        {error && <p className="error-state" style={{ margin: '0.75rem' }}>{error}</p>}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonInboxItem key={i} />)
        ) : filtered.length === 0 ? (
          <div className="inbox__empty">
            <span className="inbox__empty-icon icon icon-2xl">📭</span>
            <p>{searchQuery ? 'No matches found' : 'No conversations yet'}</p>
          </div>
        ) : (
          filtered.map((conv, i) => {
            return (
              <button
                key={conv.id}
                type="button"
                className={`conv-item ${activeConversationId === conv.id ? 'conv-item--active' : ''}`}
                onClick={() => handleSelect(conv)}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="conv-item__avatar" aria-hidden="true">
                  {getInitial(conv)}
                  {conv.unreadCount > 0 && <span className="conv-item__unread-dot" />}
                </div>

                <div className="conv-item__body">
                  <div className="conv-item__top">
                    <span className="conv-item__name">
                      {conv.otherUserName || conv.otherUserEmail?.split('@')[0] || 'User'}
                    </span>
                    <span className="conv-item__time">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <p className="conv-item__listing">{conv.listingTitle || 'Conversation'}</p>
                  <div className="conv-item__preview-row">
                    <p className="conv-item__preview">{truncate(conv.lastMessage)}</p>
                    {conv.unreadCount > 0 && (
                      <span className="conv-item__badge">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
