// Gate for authenticated-only pages. Waits for the initial token check, then
// redirects to /login if there's no signed-in user.
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return <div className="container py-5 text-secondary">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}
