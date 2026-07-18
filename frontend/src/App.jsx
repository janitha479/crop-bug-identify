// Site shell: navbar + routed pages + footer, with the floating chat widget layered on top.
import { Routes, Route, Navigate } from 'react-router-dom'
import { ChatProvider } from './context/ChatContext'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import Home from './pages/Home'
import News from './pages/News'
import Bugs from './pages/Bugs'

export default function App() {
  return (
    <ChatProvider>
      <div className="site-shell">
        <NavBar />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/bugs" element={<Bugs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </ChatProvider>
  )
}
