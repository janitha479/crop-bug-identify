// Lightweight modal shell (no Bootstrap JS needed). Closes on backdrop click or Esc,
// and springs in rather than snapping.
import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, wide = false }) {
  const reduce = useReducedMotion()

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
    <motion.div
      className="app-modal-backdrop"
      onClick={onClose}
      role="presentation"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`app-modal ${wide ? 'app-modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduce ? false : { opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="app-modal-header">
          <h2 className="h5 fw-bold mb-0">{title}</h2>
          <button
            type="button"
            className="btn btn-sm p-1 text-secondary"
            style={{ lineHeight: 0 }}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="app-modal-body">{children}</div>
      </motion.div>
    </motion.div>
  )
}
