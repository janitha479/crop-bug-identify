// Farmer dashboard: saved farms with live weather + top pest risk (all fetched in
// one call), an add-farm form (reusing the shared LocationPicker), saved
// conversations, recent pest scans, and a PDF export.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle, Bug, Droplets, FileDown, MapPin, MessageSquare, Plus,
  RefreshCw, Sprout, Thermometer, TrendingUp, X,
} from 'lucide-react'
import LocationPicker from '../components/LocationPicker'
import FarmForecastModal from '../components/FarmForecastModal'
import ConversationModal from '../components/ConversationModal'
import CountUp from '../ui/CountUp'
import Pagination, { usePaginated } from '../ui/Pagination'
import { Reveal, RevealGroup, RevealItem, EASE } from '../ui/motion'
import { useAuth } from '../context/AuthContext'
import { useLocation } from '../context/LocationContext'
import {
  createFarm,
  deleteConversation,
  deleteFarm,
  downloadReport,
  farmsOverview,
  listConversations,
  listDetections,
} from '../api'

const RISK_DOT = {
  severe: '#b32d2d', high: '#cf6d1f', moderate: '#c99a25', low: 'var(--brand)',
}

const PER_PAGE = 10

export default function Dashboard() {
  const { user } = useAuth()
  const { location } = useLocation()
  const [overview, setOverview] = useState(null) // null = loading
  const [detections, setDetections] = useState([])
  const [conversations, setConversations] = useState([])
  const [farmName, setFarmName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [forecastFarm, setForecastFarm] = useState(null)
  const [openConv, setOpenConv] = useState(null)

  const refresh = async () => {
    setOverview(null)
    // Settled (not all-or-nothing): one failing panel shouldn't blank the dashboard.
    const [ov, det, convs] = await Promise.allSettled([
      farmsOverview(),
      listDetections(),
      listConversations(),
    ])
    setOverview(ov.status === 'fulfilled' ? ov.value.farms : [])
    setDetections(det.status === 'fulfilled' ? det.value.detections : [])
    setConversations(convs.status === 'fulfilled' ? convs.value.conversations : [])
    setError(ov.status === 'rejected' ? (ov.reason?.message || 'Could not load your farms') : '')
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

  const atRisk = (overview || []).filter(
    (f) => f.top_risk && ['severe', 'high'].includes(f.top_risk.risk_level),
  ).length

  // History lists show 10 at a time with prev/next paging.
  const scanPage = usePaginated(detections, PER_PAGE)
  const convPage = usePaginated(conversations, PER_PAGE)

  const STATS = [
    { Icon: Sprout, value: overview?.length ?? 0, label: 'farms saved' },
    { Icon: TrendingUp, value: atRisk, label: 'at high risk' },
    { Icon: Bug, value: detections.length, label: 'pest scans' },
    { Icon: MessageSquare, value: conversations.length, label: 'conversations' },
  ]

  return (
    <div className="container py-5 ui-face">
      {/* Header */}
      <Reveal>
        <div className="dash-hero p-4 p-md-5 mb-4 grain">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>Dashboard</div>
              <h1 className="h2 mt-2 mb-1">
                Hello{user?.full_name ? `, ${user.full_name}` : ''} 👋
              </h1>
              <p className="mb-0 small" style={{ opacity: 0.8 }}>
                Everything about your land in one place.
              </p>
            </div>
            <div className="d-flex gap-2 ms-auto flex-wrap">
              <motion.button
                type="button"
                className="btn btn-light btn-sm d-inline-flex align-items-center gap-2"
                onClick={() => downloadReport().catch((e) => setError(e.message))}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              >
                <FileDown size={15} /> PDF report
              </motion.button>
              <motion.button
                type="button"
                className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2"
                onClick={refresh}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              >
                <RefreshCw size={15} /> Refresh
              </motion.button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stat tiles */}
      <RevealGroup className="row g-3 mb-5" gap={0.06}>
        {STATS.map((s) => (
          <RevealItem className="col-6 col-lg-3" key={s.label}>
            <div className="stat-tile h-100 d-flex align-items-center gap-3">
              <span className="stat-tile-icon flex-shrink-0"><s.Icon size={18} /></span>
              <div>
                <div className="stat-tile-num"><CountUp value={s.value} duration={900} /></div>
                <div className="stat-tile-label">{s.label}</div>
              </div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      {error && (
        <motion.div
          className="alert alert-danger py-2 small d-flex align-items-center gap-2"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle size={15} /> {error}
        </motion.div>
      )}

      {/* Add a farm */}
      <Reveal className="mb-5">
        <h2 className="h5 fw-bold mb-3 d-flex align-items-center gap-2">
          <Plus size={18} style={{ color: 'var(--brand)' }} /> Add a farm
        </h2>
        <LocationPicker />
        <form className="d-flex flex-wrap gap-2" onSubmit={addFarm}>
          <input
            className="form-control" style={{ maxWidth: 320 }}
            placeholder="Farm name (e.g. Home paddy field)"
            value={farmName} onChange={(e) => setFarmName(e.target.value)}
          />
          <motion.button
            type="submit" className="btn btn-brand d-inline-flex align-items-center gap-2"
            disabled={busy} whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: 0.98 }}
          >
            <Plus size={16} /> {busy ? 'Saving…' : 'Save farm'}
          </motion.button>
          {location && (
            <span className="align-self-center text-secondary small d-flex align-items-center gap-1">
              <MapPin size={13} /> {location.label}
            </span>
          )}
        </form>
      </Reveal>

      {/* Farms */}
      <section className="mb-5">
        <h2 className="h5 fw-bold mb-3">Your farms</h2>

        {overview === null && (
          <div className="row g-4">
            {[0, 1, 2].map((i) => (
              <div className="col-md-6 col-xl-4" key={i}>
                <div className="skeleton skeleton-card" />
              </div>
            ))}
          </div>
        )}

        {overview && overview.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Sprout size={24} /></div>
            <div className="fw-semibold">No farms yet</div>
            <div className="text-secondary small mt-1">
              Add your first one above to see its weather and pest risk.
            </div>
          </div>
        )}

        {overview && overview.length > 0 && (
          <RevealGroup className="row g-4" gap={0.06}>
            {overview.map(({ farm, weather, top_risk }) => (
              <RevealItem className="col-md-6 col-xl-4" key={farm.id}>
                <motion.div
                  className="farm-card card h-100"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  <div className="farm-card-top d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <h3 className="h6 fw-bold mb-1">{farm.name}</h3>
                      <div className="text-secondary small d-flex align-items-center gap-1">
                        <MapPin size={12} /> {farm.place_label}
                      </div>
                    </div>
                    <button
                      type="button" className="btn btn-sm p-1 text-secondary"
                      style={{ lineHeight: 0 }} aria-label="Remove farm"
                      onClick={() => removeFarm(farm.id)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="card-body">
                    {weather ? (
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <span className="farm-weather-emoji">{weather.emoji}</span>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '1.35rem', lineHeight: 1.1 }}>
                            {Math.round(weather.temperature)}{weather.units.temperature}
                          </div>
                          <div className="text-secondary small">{weather.description}</div>
                        </div>
                        <div className="ms-auto text-end">
                          <div className="text-secondary small d-flex align-items-center gap-1 justify-content-end">
                            <Droplets size={13} /> {Math.round(weather.humidity)}%
                          </div>
                          <div className="text-secondary small d-flex align-items-center gap-1 justify-content-end mt-1">
                            <Thermometer size={13} /> {Math.round(weather.feels_like)}°
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-secondary small mb-3">Weather unavailable</div>
                    )}

                    {top_risk && (
                      <div className="farm-risk pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                        <div className="outbreak-sub-label">Top pest risk</div>
                        <div className="mt-2 d-flex align-items-center gap-2">
                          <span
                            style={{
                              width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                              background: RISK_DOT[top_risk.risk_level] || 'var(--brand)',
                            }}
                          />
                          <strong className="small">{top_risk.common_name}</strong>
                        </div>
                        <div className="text-secondary small mt-1">{top_risk.when_label}</div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-brand mt-3 w-100 d-inline-flex align-items-center justify-content-center gap-2"
                      onClick={() => setForecastFarm(farm)}
                    >
                      <TrendingUp size={14} /> Full forecast
                    </button>
                  </div>
                </motion.div>
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {/* Saved conversations */}
      <section className="mb-5">
        <h2 className="h5 fw-bold mb-3">Saved conversations</h2>
        {conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><MessageSquare size={24} /></div>
            <div className="fw-semibold">No conversations yet</div>
            <div className="text-secondary small mt-1">
              Your chats with the assistant are saved here automatically.
            </div>
          </div>
        ) : (
          <>
          <ul className="list-group conversation-list">
            {convPage.slice.map((c) => (
              <li key={c.id} className="list-group-item d-flex align-items-center gap-2">
                <span
                  className="d-grid flex-shrink-0"
                  style={{
                    width: 32, height: 32, placeItems: 'center', borderRadius: 9,
                    background: 'var(--brand-light)', color: 'var(--brand-dark)',
                  }}
                >
                  <MessageSquare size={15} />
                </span>
                <button
                  type="button"
                  className="conversation-open flex-grow-1 text-start"
                  onClick={() => setOpenConv(c)}
                >
                  <span className="fw-semibold small">{c.title}</span>
                  <span className="text-secondary d-block" style={{ fontSize: '0.78rem' }}>
                    {c.updated_at ? new Date(c.updated_at).toLocaleString() : ''}
                  </span>
                </button>
                <button
                  type="button" className="btn btn-sm p-1 text-secondary" style={{ lineHeight: 0 }}
                  aria-label="Delete conversation"
                  onClick={async () => {
                    try { await deleteConversation(c.id); await refresh() }
                    catch (err) { setError(err.message) }
                  }}
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Pagination {...convPage} label="conversations" />
          </div>
          </>
        )}
      </section>

      {/* Recent scans */}
      <section>
        <h2 className="h5 fw-bold mb-3">Recent pest scans</h2>
        {detections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bug size={24} /></div>
            <div className="fw-semibold">No scans yet</div>
            <div className="text-secondary small mt-1">
              Use the assistant to identify a pest from a photo — it will show up here.
            </div>
          </div>
        ) : (
          <div className="card p-3">
            <div className="table-responsive">
              <table className="table data-table mb-0">
                <thead>
                  <tr><th>Date</th><th>Pest</th><th>Confidence</th><th>Certain</th></tr>
                </thead>
                <tbody>
                  {scanPage.slice.map((d) => (
                    <tr key={d.id}>
                      <td className="text-secondary">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                      </td>
                      <td className="fw-semibold">{d.common_name || d.pest_label}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="risk-meter flex-grow-1" style={{ maxWidth: 70 }}>
                            <div
                              className="risk-meter-fill risk-low"
                              style={{ width: `${Math.round(d.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="small text-secondary">
                            {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`risk-badge risk-badge-${d.confident ? 'low' : 'moderate'}`}>
                          {d.confident ? 'Confident' : 'Unsure'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
              <Pagination {...scanPage} label="scans" />
            </div>
          </div>
        )}
      </section>

      {forecastFarm && (
        <FarmForecastModal farm={forecastFarm} onClose={() => setForecastFarm(null)} />
      )}
      {openConv && (
        <ConversationModal
          conversationId={openConv.id}
          title={openConv.title}
          onClose={() => setOpenConv(null)}
        />
      )}
    </div>
  )
}
