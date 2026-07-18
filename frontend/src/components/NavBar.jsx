// Top navigation bar. Links to the three pages + a button that opens the chat widget.
import { NavLink } from 'react-router-dom'
import { useChat } from '../context/ChatContext'

export default function NavBar() {
  const { openChat } = useChat()

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
            <li className="nav-item ms-md-2">
              <button type="button" className="btn btn-brand btn-sm" onClick={openChat}>
                💬 Ask the assistant
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
