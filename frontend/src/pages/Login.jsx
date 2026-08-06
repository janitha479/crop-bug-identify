// Farmer login page.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="auth-card card shadow-sm mx-auto">
        <div className="card-body p-4">
          <h1 className="h4 fw-bold mb-1">Welcome back</h1>
          <p className="text-secondary mb-4">Sign in to your farm dashboard.</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={submit}>
            <label className="form-label">Email</label>
            <input
              type="email" className="form-control mb-3" value={email} required
              onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            />
            <label className="form-label">Password</label>
            <input
              type="password" className="form-control mb-4" value={password} required
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
            />
            <button type="submit" className="btn btn-brand w-100" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-secondary mt-4 mb-0">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
