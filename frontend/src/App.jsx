// Site shell: navbar + routed pages + footer, with the floating chat widget layered on top.
// Routes are wrapped in AnimatePresence so pages cross-fade instead of snapping.
import { Routes, Route, Navigate, useLocation as useRouterLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { LocationProvider } from './context/LocationContext'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import ProtectedRoute from './components/ProtectedRoute'
import { PageTransition } from './ui/motion'
import Home from './pages/Home'
import News from './pages/News'
import Bugs from './pages/Bugs'
import Forecast from './pages/Forecast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function AnimatedRoutes() {
  const location = useRouterLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/news" element={<PageTransition><News /></PageTransition>} />
        <Route path="/bugs" element={<PageTransition><Bugs /></PageTransition>} />
        <Route path="/forecast" element={<PageTransition><Forecast /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <LocationProvider>
          <div className="site-shell">
            <NavBar />
            <main className="site-main">
              <AnimatedRoutes />
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </LocationProvider>
      </ChatProvider>
    </AuthProvider>
  )
}
