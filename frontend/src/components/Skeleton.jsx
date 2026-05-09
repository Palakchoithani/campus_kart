import './Skeleton.css'

export function Skeleton({ width = '100%', height = '1rem', radius = '8px', className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton width="100%" height="180px" radius="16px 16px 0 0" />
      <div className="skeleton-card__body">
        <Skeleton width="70%" height="1rem"   radius="6px" />
        <Skeleton width="45%" height="0.8rem" radius="6px" />
        <div className="skeleton-card__footer">
          <Skeleton width="30%" height="1rem" radius="6px" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonInboxItem() {
  return (
    <div className="skeleton-inbox-item" aria-hidden="true">
      <Skeleton width="42px" height="42px" radius="50%" />
      <div className="skeleton-inbox-item__content">
        <Skeleton width="55%" height="0.85rem" radius="5px" />
        <Skeleton width="80%" height="0.75rem" radius="5px" />
      </div>
    </div>
  )
}

export function SkeletonChatBubble({ mine = false }) {
  return (
    <div
      className={`skeleton-bubble ${mine ? 'skeleton-bubble--mine' : 'skeleton-bubble--theirs'}`}
      aria-hidden="true"
    >
      <Skeleton width={mine ? '55%' : '65%'} height="2.4rem" radius="16px" />
    </div>
  )
}
