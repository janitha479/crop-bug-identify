// Top navigation bar. Page links + chat button + auth (login/register or dashboard/logout).
import { NavLink, useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { openChat } = useChat()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar navbar-expand-md navbar-light site-navbar sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          🐛 Smart&nbsp;Pest&nbsp;Detection
        </NavLink>

        <button
          className="navbar-toggler"
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
              <button type="button" className="btn btn-brand btn-sm" onClick={openChat}>
                💬 Ask the assistant
              </button>
            </li>

            {user ? (
              <>
                <li className="nav-item ms-md-2">
                  <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                </li>
                <li className="nav-item">
                  <button type="button" className="btn btn-outline-brand btn-sm" onClick={handleLogout}>
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-md-2">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn btn-outline-brand btn-sm" to="/register">Sign up</NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
