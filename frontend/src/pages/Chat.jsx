import { useEffect, useState, useRef, useCallback } from 'react'
import api from '../services/api'
import { SkeletonChatBubble } from '../components/Skeleton'
import { getStoredMessages, saveMessages, mergeMessages, dedupMessages } from '../utils/messageStorage'
import './Chat.css'

export default function Chat({ listingId, sellerId, user, onBack, listingTitle }) {
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const threadRef = useRef(null)
  const inputRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const shouldAutoScrollRef = useRef(true)

  const normalize = useCallback((items) => {
    const map = new Map()
    items.forEach((i) => {
      if (i?.id) map.set(i.id, i)
    })
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }, [])

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const c = threadRef.current
    if (!c) return
    c.scrollTo({ top: c.scrollHeight, behavior })
  }, [])

  const isNearBottom = useCallback(() => {
    const c = threadRef.current
    if (!c) return true
    return c.scrollHeight - c.scrollTop <= c.clientHeight + 60
  }, [])

  useEffect(() => {
    const c = threadRef.current
    if (!c) return
    const onScroll = () => {
      isNearBottomRef.current = isNearBottom()
    }
    c.addEventListener('scroll', onScroll, { passive: true })
    return () => c.removeEventListener('scroll', onScroll)
  }, [isNearBottom])

  useEffect(() => {
    if (!messages.length) return
    if (shouldAutoScrollRef.current || isNearBottomRef.current)
      scrollToBottom(shouldAutoScrollRef.current ? 'auto' : 'smooth')
    shouldAutoScrollRef.current = false
  }, [messages.length, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [listingId, sellerId])

  const fetchMessages = useCallback(async () => {
    if (!listingId || !sellerId) {
      setLoading(false)
      return
    }
    try {
      const data = await api.getMessages(listingId, sellerId)
      let apiMessages = Array.isArray(data) ? data : data?.messages || []

      // Get stored messages as source of truth
      const storedMessages = getStoredMessages(listingId, sellerId)
      
      // Merge API messages with stored, preferring stored versions
      const merged = mergeMessages(apiMessages, storedMessages)
      
      setMessages(normalize(merged))
      setError(null)
    } catch (err) {
      // Preserve stored messages for continuity if refresh fails.
      const storedMessages = getStoredMessages(listingId, sellerId)

      setMessages(normalize(storedMessages))
      setError(err.message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [listingId, normalize, sellerId])

  useEffect(() => {
    if (!listingId || !sellerId) {
      setLoading(false)
      return
    }
    shouldAutoScrollRef.current = true
    setLoading(true)
    fetchMessages()

    // Poll less frequently to reduce state churn
    const poll = setInterval(fetchMessages, 5000)
    return () => {
      clearInterval(poll)
    }
  }, [listingId, sellerId, fetchMessages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || !listingId || !sellerId) return
    
    const text = messageText.trim()
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      senderId: user?.id,
      senderName: user?.name || 'You',
      text: text,
      createdAt: new Date().toISOString(),
      listingId: listingId,
      isOptimistic: true
    }
    
    // Clear input immediately
    setMessageText('')
    setSubmitting(true)
    
    // Add optimistic message
    setMessages((prev) => {
      const updated = normalize([...prev, optimisticMsg])
      saveMessages(listingId, sellerId, updated)
      shouldAutoScrollRef.current = true
      return updated
    })
    
    try {
      const sent = await api.sendMessage(listingId, sellerId, text)
      // Replace optimistic with real message
      setMessages((prev) => {
        const updated = prev.map((m) => 
          m.id === optimisticMsg.id ? { ...sent, isOptimistic: false } : m
        )
        const normalized = dedupMessages(updated)
        saveMessages(listingId, sellerId, normalized)
        return normalized
      })
      
      shouldAutoScrollRef.current = true
      scrollToBottom('smooth')
      setError(null)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setError(err.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !submitting) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const formatDateGroup = (date) => {
    const d = new Date(date)
    const now = new Date()
    const isToday =
      d.toDateString() === now.toDateString()
    const isYesterday =
      new Date(now.getTime() - 86400000).toDateString() ===
      d.toDateString()

    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDateGroup(msg.createdAt)
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  // Seller initial
  const sellerInitial = (listingTitle || 'S')
    .charAt(0)
    .toUpperCase()

  if (!listingId || !sellerId) {
    return (
      <div className="chat-page">
        <div className="chat-empty">
          <span className="chat-empty__icon icon icon-2xl">💬</span>
          <p className="chat-empty__title">No conversation selected</p>
          <p className="chat-empty__subtitle">
            Select a conversation from your inbox
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-page">
      {/* Header */}
      <div className="chat-page__header">
        <button
          onClick={onBack}
          className="chat-header__back"
          aria-label="Back to inbox"
        >
          <span className="icon icon-lg">←</span>
        </button>
        <div className="chat-header__avatar">{sellerInitial}</div>
        <div className="chat-header__info">
          <h3 className="chat-header__title">{listingTitle || 'Chat'}</h3>
          <p className="chat-header__subtitle">Direct message</p>
        </div>
      </div>

      {error && (
        <div className="error-state" style={{ margin: '0 1rem' }}>
          {error}
        </div>
      )}

      {/* Message thread */}
      <div ref={threadRef} className="chat-thread">
        {loading ? (
          <>
            <SkeletonChatBubble />
            <SkeletonChatBubble mine />
            <SkeletonChatBubble />
            <SkeletonChatBubble mine />
          </>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="chat-empty">
            <span className="chat-empty__icon icon icon-2xl">💬</span>
            <p className="chat-empty__title">No messages yet</p>
            <p className="chat-empty__subtitle">Say hello to start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="chat-message-group__timestamp">
                {date}
              </div>
              {dateMessages.map((msg, idx) => {
                const mine = msg.senderId === user?.id
                return (
                  <div
                    key={msg.id || `${msg.createdAt}-${idx}`}
                    className={`chat-message-group chat-message-group--${mine ? 'mine' : 'theirs'}`}
                    style={{
                      animation: msg.isOptimistic ? 'fadeUp 300ms var(--ease-out)' : 'none',
                      opacity: 1,
                    }}
                  >
                    <div
                      className={`chat-bubble chat-bubble--${mine ? 'mine' : 'theirs'}`}
                    >
                      {msg.senderName && !mine && (
                        <div className="chat-bubble__sender">
                          {msg.senderName}
                        </div>
                      )}
                      <p style={{ margin: 0, wordBreak: 'break-word' }}>{msg.text}</p>
                      <span className="chat-bubble__time">
                        {formatTime(msg.createdAt)}
                        {msg.isOptimistic && <span style={{ marginLeft: '0.4rem' }}>⟳</span>}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <form className="chat-composer" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="chat-composer__input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting || loading}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-composer__send"
          disabled={submitting || !messageText.trim()}
          aria-label="Send message"
        >
          <span className="icon icon-lg">{submitting ? '⟳' : '➤'}</span>
        </button>
      </form>
    </div>
  )
}
