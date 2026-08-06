// Lightweight modal shell (no Bootstrap JS needed). Closes on backdrop click or Esc.
import { useEffect } from 'react'

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="app-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`app-modal ${wide ? 'app-modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="app-modal-header">
          <h2 className="h5 fw-bold mb-0">{title}</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
        <div className="app-modal-body">{children}</div>
      </div>
    </div>
  )
}
