// Farmer registration page.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
    <div className="container py-5">
      <div className="auth-card card shadow-sm mx-auto">
        <div className="card-body p-4">
          <h1 className="h4 fw-bold mb-1">Create your account</h1>
          <p className="text-secondary mb-4">Save your farms and get tailored pest forecasts.</p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={submit}>
            <label className="form-label">Full name</label>
            <input className="form-control mb-3" value={form.full_name} onChange={set('full_name')} />

            <label className="form-label">Email</label>
            <input type="email" className="form-control mb-3" value={form.email} required
              onChange={set('email')} autoComplete="email" />

            <label className="form-label">District <span className="text-secondary">(optional)</span></label>
            <input className="form-control mb-3" value={form.district} onChange={set('district')}
              placeholder="e.g. Kandy" />

            <label className="form-label">Password</label>
            <input type="password" className="form-control mb-4" value={form.password} required
              minLength={6} onChange={set('password')} autoComplete="new-password"
              placeholder="At least 6 characters" />

            <button type="submit" className="btn btn-brand w-100" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-secondary mt-4 mb-0">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
