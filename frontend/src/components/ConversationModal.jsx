// Read-only transcript of a saved chat, reopened from the dashboard.
import { useEffect, useState } from 'react'
import Modal from './Modal'
import { getConversation } from '../api'

export default function ConversationModal({ conversationId, title, onClose }) {
  const [state, setState] = useState({ status: 'loading', messages: [] })

  useEffect(() => {
    let alive = true
    getConversation(conversationId)
      .then((d) => alive && setState({ status: 'ok', messages: d.conversation.messages }))
      .catch(() => alive && setState({ status: 'error', messages: [] }))
    return () => { alive = false }
  }, [conversationId])

  return (
    <Modal title={title || 'Saved conversation'} onClose={onClose}>
      {state.status === 'loading' && <div className="text-secondary py-3">Loading…</div>}
      {state.status === 'error' && (
        <div className="alert alert-light border mb-0">Couldn’t load this conversation.</div>
      )}
      {state.status === 'ok' && (
        <div className="transcript">
          {state.messages.map((m) => (
            <div key={m.id} className={`msg-row ${m.role}`}>
              <div className={`bubble ${m.role}`}>{m.text}</div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
