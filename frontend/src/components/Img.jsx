// Reusable image with a graceful fallback: if a remote (stock) image fails to load,
// we hide it and show a themed gradient + emoji instead, so a card never looks broken.
import { useState } from 'react'

export default function Img({ src, alt, className = '', emoji = '🌿', ratio = '16x9' }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={`img-frame ratio-${ratio} ${className}`}>
      {!failed && src ? (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          className="img-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="img-fallback" aria-hidden="true">
          <span>{emoji}</span>
        </div>
      )}
    </div>
  )
}
