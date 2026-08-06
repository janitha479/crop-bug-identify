// Top navigation bar. Page links + chat button + auth (login/register or dashboard/logout).
// Adds a glass/scrolled state and real SVG icons instead of emoji.
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bug, LayoutDashboard, LogOut, MessageCircle, Sprout } from 'lucide-react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { openChat } = useChat()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav
      className={`navbar navbar-expand-md navbar-light site-navbar sticky-top ${
        scrolled ? 'is-scrolled' : ''
      }`}
    >
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          <motion.span
            className="brand-mark"
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Sprout size={19} strokeWidth={2.2} />
          </motion.span>
          <span>Smart&nbsp;Pest&nbsp;Detection</span>
        </NavLink>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-md-center gap-md-1">
            <li className="nav-item">
              <NavLink end className="nav-link" to="/">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/news">News</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/bugs">Bugs</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/forecast">Forecast</NavLink>
            </li>

            <li className="nav-item ms-md-2">
              <button
                type="button"
                className="btn btn-brand btn-sm d-inline-flex align-items-center gap-2"
                onClick={openChat}
              >
                <MessageCircle size={15} /> Ask the assistant
              </button>
            </li>

            {user ? (
              <>
                <li className="nav-item ms-md-1">
                  <NavLink className="nav-link d-inline-flex align-items-center gap-1" to="/dashboard">
                    <LayoutDashboard size={15} /> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-outline-brand btn-sm d-inline-flex align-items-center gap-1"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-md-1">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className="btn btn-outline-brand btn-sm d-inline-flex align-items-center gap-1"
                    to="/register"
                  >
                    <Bug size={14} /> Sign up
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
