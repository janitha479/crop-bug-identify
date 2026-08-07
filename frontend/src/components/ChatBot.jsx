// The pest-assistant chatbot, extracted from the old full-screen App so it can be
// embedded inside the floating widget popup. Logic is unchanged from before - it just
// fills its parent container (.chat-embed) instead of the whole viewport.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Send, X } from 'lucide-react'
import { detectPest, chat, health } from '../api'
import { useLocation } from '../context/LocationContext'
import PestCard from './PestCard'

const WELCOME = {
  role: 'bot',
  text:
    "👋 Hi! I'm your farming assistant. Upload a photo of an insect or pest and I'll " +
    "identify it and tell you how to deal with it. You can also ask me anything about " +
    "your crops: watering, planting, the weather today, or what pests to expect next.",
}

export default function ChatBot() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // {model, llm}
  const [lastPest, setLastPest] = useState(null) // class label for follow-up context
  // Server-side conversation id - set on the first reply when signed in, then sent
  // back with each message so the whole thread is saved together.
  const [conversationId, setConversationId] = useState(null)
  const { location } = useLocation()

  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    health().then(setStatus).catch(() => setStatus(null))
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages, busy])

  function pushMessage(msg) {
    setMessages((prev) => [...prev, msg])
  }

  function onPickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  function clearFile() {
    setFile(null)
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFilePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSend(e) {
    e?.preventDefault()
    if (busy) return
    const text = input.trim()
    if (!text && !file) return

    setBusy(true)
    setInput('')

    try {
      if (file) {
        // Own object URL for the message, independent of the preview URL that
        // clearFile() revokes - otherwise the thumbnail breaks after sending.
        const imageUrl = URL.createObjectURL(file)
        pushMessage({ role: 'user', text, imageUrl })
        clearFile()

        const data = await detectPest(file, text)
        setLastPest(data.confident ? data.top_prediction.label : null)
        pushMessage({
          role: 'bot',
          text: data.reply,
          pest: data.pest,
          topPrediction: data.top_prediction,
          imageUrl,
          predictions: data.predictions,
        })
      } else {
        pushMessage({ role: 'user', text })
        const data = await chat(text, lastPest, {
          lat: location?.lat,
          lon: location?.lon,
          conversationId,
        })
        if (data.conversation_id) setConversationId(data.conversation_id)
        pushMessage({ role: 'bot', text: data.reply })
      }
    } catch (err) {
      pushMessage({ role: 'bot', text: `⚠️ ${err.message}` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chat-embed">
      {status && (
        <div className="chat-status px-3 py-1 d-flex gap-1 justify-content-end">
          <span className="badge bg-light text-dark status-pill">model: {status.model}</span>
          <span className="badge bg-light text-dark status-pill">llm: {status.llm}</span>
        </div>
      )}

      <div className="chat-scroll" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              className={`msg-row ${m.role}`}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`bubble ${m.role}`}>
                {m.imageUrl && m.role === 'user' && (
                  <img src={m.imageUrl} alt="uploaded" className="uploaded mb-2" />
                )}
                {m.role === 'bot' && m.pest && (
                  <PestCard pest={m.pest} topPrediction={m.topPrediction} imageUrl={m.imageUrl} />
                )}
                {m.text && <div>{m.text}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <motion.div className="msg-row bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bubble bot typing-dots">
              <span>●</span> <span>●</span> <span>●</span>
            </div>
          </motion.div>
        )}
      </div>

      <form className="composer" onSubmit={handleSend}>
        {filePreview && (
          <div className="mb-2">
            <div className="attach-preview">
              <img src={filePreview} alt="preview" />
              <button type="button" onClick={clearFile} title="Remove" aria-label="Remove attachment">
                <X size={11} />
              </button>
            </div>
          </div>
        )}
        <div className="d-flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={onPickFile}
          />
          <motion.button
            type="button"
            className="btn btn-outline-brand d-inline-flex align-items-center"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a pest photo"
            disabled={busy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera size={18} />
          </motion.button>
          <input
            type="text"
            className="form-control"
            placeholder={file ? 'Add a question (optional) and send…' : 'Ask a question, or attach a photo…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <motion.button
            type="submit"
            className="btn btn-brand d-inline-flex align-items-center gap-1"
            disabled={busy || (!input.trim() && !file)}
            whileHover={{ scale: busy ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </form>
    </div>
  )
}
