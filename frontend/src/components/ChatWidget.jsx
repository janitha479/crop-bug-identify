// Floating chat launcher + popup, available on every page. The ChatBot inside stays
// mounted once opened so chat history survives closing/reopening (we keep it in the
// tree and animate the panel's visibility).
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, Sprout, X } from 'lucide-react'
import { useChat } from '../context/ChatContext'
import ChatBot from './ChatBot'

export default function ChatWidget() {
  const { open, openChat, closeChat, toggleChat } = useChat()
  const reduce = useReducedMotion()
  // Mount the ChatBot lazily the first time it's opened, then keep it alive.
  const [mounted, setMounted] = useState(false)
  if (open && !mounted) setMounted(true)

  return (
    <>
      {/* Keep ChatBot mounted once opened; hide the panel with display so state persists. */}
      {mounted && (
        <div style={{ display: open ? 'block' : 'none' }}>
          <AnimatePresence>
            {open && (
              <motion.div
                className="chat-popup"
                role="dialog"
                aria-label="Pest assistant chat"
                initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              >
                <div className="chat-popup-header">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="d-grid"
                      style={{
                        width: 28, height: 28, placeItems: 'center', borderRadius: 8,
                        background: 'rgba(255,255,255,0.14)',
                      }}
                    >
                      <Sprout size={15} />
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>Pest Assistant</strong>
                      <div style={{ fontSize: '0.7rem', opacity: 0.75, lineHeight: 1 }}>
                        Ask anything about your crops
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="chat-popup-close"
                    onClick={closeChat}
                    aria-label="Close chat"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="chat-popup-body">
                  <ChatBot />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <motion.button
        type="button"
        className="chat-launcher"
        onClick={open ? closeChat : openChat}
        aria-label={open ? 'Close chat' : 'Open pest assistant chat'}
        title={open ? 'Close chat' : 'Ask the Pest Assistant'}
        onDoubleClick={toggleChat}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={reduce ? undefined : { y: [0, -4, 0] }}
        transition={{ y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'grid', placeItems: 'center' }}
          >
            {open ? <X size={24} /> : <MessageCircle size={24} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  )
}
