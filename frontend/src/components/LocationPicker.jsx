// Location chooser shared by the Weather, Forecast and Dashboard pages. Lets the user
// either auto-detect their location (browser GPS) or type a place name and pick from
// geocoded matches. The choice is stored in LocationContext and reused everywhere.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, MapPin, Search } from 'lucide-react'
import { useLocation } from '../context/LocationContext'
import { geocode } from '../api'

export default function LocationPicker() {
  const { location, setByCoords, setByPlace } = useLocation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = idle, [] = no matches
  const [busy, setBusy] = useState(false)
  const [geoError, setGeoError] = useState('')

  const detect = () => {
    setGeoError('')
    if (!('geolocation' in navigator)) {
      setGeoError('This device can’t share its location. Search by name instead.')
      return
    }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false)
        setResults(null)
        setByCoords(pos.coords.latitude, pos.coords.longitude, 'My current location')
      },
      () => {
        setBusy(false)
        setGeoError('Location access was blocked. Search by name instead.')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    )
  }

  const search = async (e) => {
    e.preventDefault()
    if (query.trim().length < 2) return
    setBusy(true)
    setGeoError('')
    const found = await geocode(query.trim())
    setBusy(false)
    setResults(found)
  }

  const choose = (place) => {
    setByPlace(place)
    setResults(null)
    setQuery('')
  }

  return (
    <div className="location-picker card mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span
            className="d-grid flex-shrink-0"
            style={{
              width: 36, height: 36, placeItems: 'center', borderRadius: 10,
              background: 'var(--brand-light)', color: 'var(--brand-dark)',
            }}
          >
            <MapPin size={17} />
          </span>
          <div className="me-2">
            <div className="outbreak-sub-label">Location</div>
            <div className="location-current">{location ? location.label : 'Not set'}</div>
          </div>

          <motion.button
            type="button"
            className="btn btn-outline-brand btn-sm ms-sm-auto d-inline-flex align-items-center gap-2"
            onClick={detect}
            disabled={busy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Crosshair size={14} /> {busy ? 'Detecting…' : 'Use my location'}
          </motion.button>
        </div>

        <form className="d-flex gap-2 mt-3" onSubmit={search} role="search">
          <div className="position-relative flex-grow-1">
            <Search
              size={15}
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--ink-faint)',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 34 }}
              placeholder="Or type a town / district (e.g. Kandy, Anuradhapura)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search location by name"
            />
          </div>
          <button type="submit" className="btn btn-brand" disabled={busy || query.trim().length < 2}>
            Search
          </button>
        </form>

        {geoError && <div className="text-danger small mt-2">{geoError}</div>}

        <AnimatePresence>
          {results !== null && (
            <motion.div
              className="location-results mt-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {results.length === 0 ? (
                <div className="text-secondary small">No places found. Try a different spelling.</div>
              ) : (
                <ul className="list-group">
                  {results.map((p, i) => (
                    <li key={`${p.latitude},${p.longitude},${i}`} className="list-group-item p-0">
                      <button type="button" className="location-result-btn" onClick={() => choose(p)}>
                        <span className="fw-semibold d-flex align-items-center gap-2">
                          <MapPin size={13} style={{ color: 'var(--brand)' }} /> {p.name}
                        </span>
                        <span className="text-secondary small" style={{ paddingLeft: 21 }}>
                          {[p.admin1, p.country].filter(Boolean).join(', ')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
