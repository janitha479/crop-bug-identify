// Reusable image with a shimmer placeholder while loading and graceful fallbacks.
//
// `src` may be a single URL or an ARRAY of candidates — they're tried in order, so a
// card can accept e.g. ['/bugs/ants.jpg', '/bugs/ants.png'] and use whichever the user
// actually dropped in. If every candidate fails we show a themed gradient + emoji, so
// a card never looks broken.
import { useEffect, useState } from 'react'

export default function Img({ src, alt, className = '', emoji = '🌿', ratio = '16x9', zoom = false }) {
  const list = (Array.isArray(src) ? src : [src]).filter(Boolean)
  const key = list.join('|')

  const [idx, setIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)

  // Restart the candidate chain whenever the source list changes.
  useEffect(() => {
    setIdx(0)
    setLoaded(false)
  }, [key])

  const current = list[idx]
  const exhausted = !current

  return (
    <div className={`img-frame ratio-${ratio} ${zoom ? 'img-zoom' : ''} ${className}`}>
      {!exhausted ? (
        <>
          {!loaded && <div className="img-skeleton" aria-hidden="true" />}
          <img
            // Keying on the URL forces a fresh element when we fall through to the
            // next candidate, so the browser actually retries.
            key={current}
            src={current}
            alt={alt || ''}
            loading="lazy"
            className="img-cover"
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setLoaded(false)
              setIdx((i) => i + 1) // try the next extension / URL
            }}
          />
        </>
      ) : (
        <div className="img-fallback" aria-hidden="true">
          <span>{emoji}</span>
        </div>
      )}
    </div>
  )
}
