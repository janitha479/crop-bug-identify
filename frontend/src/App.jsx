// Site shell: navbar + routed pages + footer, with the floating chat widget layered on top.
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { LocationProvider } from './context/LocationContext'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import ChatWidget from './components/ChatWidget'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import News from './pages/News'
import Bugs from './pages/Bugs'
import Forecast from './pages/Forecast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <LocationProvider>
          <div className="site-shell">
            <NavBar />
            <main className="site-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/news" element={<News />} />
                <Route path="/bugs" element={<Bugs />} />
                <Route path="/forecast" element={<Forecast />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </LocationProvider>
      </ChatProvider>
    </AuthProvider>
  )
}
