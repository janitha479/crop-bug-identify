// Farmer login page.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, LogIn } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
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
    <AuthLayout>
      <div className="auth-card card shadow-sm w-100">
        <div className="card-body p-4 p-md-5">
          <div className="eyebrow">Welcome back</div>
          <h1 className="h3 mt-2 mb-2">Sign in</h1>
          <p className="text-secondary small mb-4">Continue to your farm dashboard.</p>

          {error && (
            <motion.div
              className="alert alert-danger py-2 small d-flex align-items-center gap-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={15} /> {error}
            </motion.div>
          )}

          <form onSubmit={submit}>
            <label className="form-label">Email</label>
            <input
              type="email" className="form-control mb-3" value={email} required
              onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              placeholder="you@example.com"
            />
            <label className="form-label">Password</label>
            <input
              type="password" className="form-control mb-4" value={password} required
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              placeholder="••••••••"
            />
            <motion.button
              type="submit"
              className="btn btn-brand w-100 d-inline-flex align-items-center justify-content-center gap-2"
              disabled={busy}
              whileHover={{ scale: busy ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            New here? <Link to="/register" className="fw-semibold">Create an account</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
