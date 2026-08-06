// Farmer registration page.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, UserPlus } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', district: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        district: form.district.trim(),
        password: form.password,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card card shadow-sm w-100">
        <div className="card-body p-4 p-md-5">
          <div className="eyebrow">Get started</div>
          <h1 className="h3 mt-2 mb-2">Create your account</h1>
          <p className="text-secondary small mb-4">
            Save your farms and get pest forecasts tailored to them.
          </p>

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
            <label className="form-label">Full name</label>
            <input
              className="form-control mb-3" value={form.full_name}
              onChange={set('full_name')} placeholder="e.g. Nimal Perera"
            />

            <label className="form-label">Email</label>
            <input
              type="email" className="form-control mb-3" value={form.email} required
              onChange={set('email')} autoComplete="email" placeholder="you@example.com"
            />

            <label className="form-label">
              District <span className="text-faint fw-normal">(optional)</span>
            </label>
            <input
              className="form-control mb-3" value={form.district}
              onChange={set('district')} placeholder="e.g. Kandy"
            />

            <label className="form-label">Password</label>
            <input
              type="password" className="form-control mb-4" value={form.password} required
              minLength={6} onChange={set('password')} autoComplete="new-password"
              placeholder="At least 6 characters"
            />

            <motion.button
              type="submit"
              className="btn btn-brand w-100 d-inline-flex align-items-center justify-content-center gap-2"
              disabled={busy}
              whileHover={{ scale: busy ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus size={16} /> {busy ? 'Creating…' : 'Create account'}
            </motion.button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            Already have an account? <Link to="/login" className="fw-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
