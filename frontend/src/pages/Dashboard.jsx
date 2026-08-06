// Farmer dashboard: saved farms with live weather + top pest risk (all fetched in
// one call), an add-farm form (reusing the shared LocationPicker), recent pest
// scans, and a PDF export.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LocationPicker from '../components/LocationPicker'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import {
  createFarm,
  deleteFarm,
  downloadReport,
  farmsOverview,
  listDetections,
} from '../api'

const RISK_EMOJI = { severe: '🔴', high: '🟠', moderate: '🟡', low: '🟢' }

export default function Dashboard() {
  const { user } = useAuth()
  const { location } = useLocation()
  const [overview, setOverview] = useState(null) // null = loading
  const [detections, setDetections] = useState([])
  const [farmName, setFarmName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    setOverview(null)
    try {
      const [ov, det] = await Promise.all([farmsOverview(), listDetections()])
      setOverview(ov.farms)
      setDetections(det.detections)
    } catch (err) {
      setError(err.message || 'Could not load your dashboard')
      setOverview([])
    }
  }

  useEffect(() => { refresh() }, [])

  const addFarm = async (e) => {
    e.preventDefault()
    setError('')
    if (!location) { setError('Pick a location for the farm first.'); return }
    if (!farmName.trim()) { setError('Give your farm a name.'); return }
    setBusy(true)
    try {
      await createFarm({
        name: farmName.trim(),
        latitude: location.lat,
        longitude: location.lon,
        place_label: location.label,
      })
      setFarmName('')
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not add the farm')
    } finally {
      setBusy(false)
    }
  }

  const removeFarm = async (id) => {
    try {
      await deleteFarm(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not delete the farm')
    }
  }

  return (
    <div className="container py-5">
      <header className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1 className="section-title h2 fw-bold mt-1 mb-0">
            Hello{user?.full_name ? `, ${user.full_name}` : ''} 👋
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-outline-brand btn-sm ms-auto"
          onClick={() => downloadReport().catch((e) => setError(e.message))}
        >
          ⬇ Download PDF report
        </button>
        <button type="button" className="btn btn-brand btn-sm" onClick={refresh}>
          ↻ Refresh all
        </button>
      </header>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Add a farm */}
      <section className="mb-5">
        <h2 className="h5 fw-bold mb-3">Add a farm</h2>
        <LocationPicker />
        <form className="d-flex flex-wrap gap-2" onSubmit={addFarm}>
          <input
            className="form-control" style={{ maxWidth: 320 }}
            placeholder="Farm name (e.g. Home paddy field)"
            value={farmName} onChange={(e) => setFarmName(e.target.value)}
          />
          <button type="submit" className="btn btn-brand" disabled={busy}>
            {busy ? 'Saving…' : 'Save farm'}
          </button>
          {location && (
            <span className="align-self-center text-secondary small">
              📍 {location.label}
            </span>
          )}
        </form>
      </section>

      {/* Farms overview */}
      <section className="mb-5">
        <h2 className="h5 fw-bold mb-3">Your farms</h2>
        {overview === null && <div className="text-secondary py-3">Loading your farms…</div>}
        {overview && overview.length === 0 && (
          <div className="alert alert-light border">
            No farms yet — add your first one above to see its weather and pest risk.
          </div>
        )}
        {overview && overview.length > 0 && (
          <div className="row g-4">
            {overview.map(({ farm, weather, top_risk }) => (
              <div className="col-md-6 col-xl-4" key={farm.id}>
                <div className="farm-card card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h3 className="h5 fw-bold mb-0">{farm.name}</h3>
                        <div className="text-secondary small">{farm.place_label}</div>
                      </div>
                      <button
                        type="button" className="btn-close" aria-label="Remove farm"
                        onClick={() => removeFarm(farm.id)}
                      />
                    </div>

                    {weather ? (
                      <div className="farm-weather d-flex align-items-center gap-2 mt-3">
                        <span className="farm-weather-emoji">{weather.emoji}</span>
                        <span className="fw-bold fs-5">
                          {Math.round(weather.temperature)}{weather.units.temperature}
                        </span>
                        <span className="text-secondary small">
                          {weather.description} · {Math.round(weather.humidity)}% hum
                        </span>
                      </div>
                    ) : (
                      <div className="text-secondary small mt-3">Weather unavailable</div>
                    )}

                    {top_risk && (
                      <div className="farm-risk mt-3">
                        <span className="outbreak-sub-label">Top pest risk</span>
                        <div className="mt-1">
                          {RISK_EMOJI[top_risk.risk_level]} <strong>{top_risk.common_name}</strong>{' '}
                          <span className="text-secondary">— {top_risk.when_label}</span>
                        </div>
                      </div>
                    )}

                    <Link to="/forecast" className="btn btn-sm btn-outline-brand mt-3">
                      Full forecast →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent scans */}
      <section>
        <h2 className="h5 fw-bold mb-3">Recent pest scans</h2>
        {detections.length === 0 ? (
          <div className="alert alert-light border">
            No scans yet. Use the 💬 assistant to identify a pest from a photo — it’ll show up here.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Date</th><th>Pest</th><th>Confidence</th><th>Sure?</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d) => (
                  <tr key={d.id}>
                    <td>{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</td>
                    <td>{d.common_name || d.pest_label}</td>
                    <td>{Math.round(d.confidence * 100)}%</td>
                    <td>{d.confident ? '✅' : '❓'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
