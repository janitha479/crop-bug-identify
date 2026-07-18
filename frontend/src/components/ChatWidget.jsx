// Floating chat launcher + popup, available on every page. The ChatBot inside stays
// mounted once opened so chat history survives closing/reopening (we just hide the panel).
import { useState } from 'react'
import { useChat } from '../context/ChatContext'
import ChatBot from './ChatBot'

export default function ChatWidget() {
  const { open, openChat, closeChat, toggleChat } = useChat()
  // Mount the ChatBot lazily the first time it's opened, then keep it alive.
  const [mounted, setMounted] = useState(false)
  if (open && !mounted) setMounted(true)

  return (
    <>
      {mounted && (
        <div className={`chat-popup ${open ? 'is-open' : ''}`} role="dialog" aria-label="Pest assistant chat">
          <div className="chat-popup-header">
            <div className="d-flex align-items-center gap-2">
              <span aria-hidden="true">🐛</span>
              <strong>Pest Assistant</strong>
            </div>
            <button
              type="button"
              className="chat-popup-close"
              onClick={closeChat}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="chat-popup-body">
            <ChatBot />
          </div>
        </div>
      )}

      <button
        type="button"
        className="chat-launcher"
        onClick={open ? closeChat : openChat}
        aria-label={open ? 'Close chat' : 'Open pest assistant chat'}
        title={open ? 'Close chat' : 'Ask the Pest Assistant'}
        onDoubleClick={toggleChat}
      >
        {open ? '×' : '💬'}
      </button>
    </>
  )
}
