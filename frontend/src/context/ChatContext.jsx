// Shared open/close state for the floating chat widget, so the NavBar button, the
// Home hero CTA and the Bugs page can all open the same popup.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openChat = useCallback(() => setOpen(true), [])
  const closeChat = useCallback(() => setOpen(false), [])
  const toggleChat = useCallback(() => setOpen((o) => !o), [])

  const value = useMemo(
    () => ({ open, openChat, closeChat, toggleChat }),
    [open, openChat, closeChat, toggleChat],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within a ChatProvider')
  return ctx
}
