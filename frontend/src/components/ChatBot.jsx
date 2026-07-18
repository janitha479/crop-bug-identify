// The pest-assistant chatbot, extracted from the old full-screen App so it can be
// embedded inside the floating widget popup. Logic is unchanged from before — it just
// fills its parent container (.chat-embed) instead of the whole viewport.
import { useEffect, useRef, useState } from 'react'
import { detectPest, chat, health } from '../api'
import PestCard from './PestCard'

const WELCOME = {
  role: 'bot',
  text:
    "👋 Hi! I'm your pest assistant. Upload a photo of the insect or pest on your crop, " +
    "and I'll try to identify it and tell you how to deal with it. You can also just ask me a question.",
}

export default function ChatBot() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // {model, llm}
  const [lastPest, setLastPest] = useState(null) // class label for follow-up context

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
        // clearFile() revokes — otherwise the thumbnail breaks after sending.
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
        const data = await chat(text, lastPest)
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
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            <div className={`bubble ${m.role}`}>
              {m.imageUrl && m.role === 'user' && (
                <img src={m.imageUrl} alt="uploaded" className="uploaded mb-2" />
              )}
              {m.role === 'bot' && m.pest && (
                <PestCard pest={m.pest} topPrediction={m.topPrediction} imageUrl={m.imageUrl} />
              )}
              {m.text && <div>{m.text}</div>}
            </div>
          </div>
        ))}

        {busy && (
          <div className="msg-row bot">
            <div className="bubble bot typing-dots">
              <span>●</span> <span>●</span> <span>●</span>
            </div>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={handleSend}>
        {filePreview && (
          <div className="mb-2">
            <div className="attach-preview">
              <img src={filePreview} alt="preview" />
              <button type="button" onClick={clearFile} title="Remove">×</button>
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
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a pest photo"
            disabled={busy}
          >
            📷
          </button>
          <input
            type="text"
            className="form-control"
            placeholder={file ? 'Add a question (optional) and send…' : 'Ask a question, or attach a photo…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" className="btn btn-success" disabled={busy || (!input.trim() && !file)}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
