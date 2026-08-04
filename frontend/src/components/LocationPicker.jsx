// Location chooser shared by the Weather and Forecast pages. Lets the user either
// auto-detect their location (browser GPS) or type a place name and pick from
// geocoded matches. The choice is stored in LocationContext and reused on both pages.
import { useState } from 'react'
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
    <div className="location-picker card shadow-sm mb-4">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold me-1">📍 Location:</span>
          <span className="location-current">
            {location ? location.label : 'not set'}
          </span>

          <button
            type="button"
            className="btn btn-outline-brand btn-sm ms-sm-auto"
            onClick={detect}
            disabled={busy}
          >
            {busy ? 'Detecting…' : 'Use my location'}
          </button>
        </div>

        <form className="d-flex gap-2 mt-3" onSubmit={search} role="search">
          <input
            type="text"
            className="form-control"
            placeholder="Or type a town / district (e.g. Kandy, Anuradhapura)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search location by name"
          />
          <button type="submit" className="btn btn-brand" disabled={busy || query.trim().length < 2}>
            Search
          </button>
        </form>

        {geoError && <div className="text-danger small mt-2">{geoError}</div>}

        {results !== null && (
          <div className="location-results mt-2">
            {results.length === 0 ? (
              <div className="text-secondary small">No places found — try a different spelling.</div>
            ) : (
              <ul className="list-group">
                {results.map((p, i) => (
                  <li key={`${p.latitude},${p.longitude},${i}`} className="list-group-item p-0">
                    <button
                      type="button"
                      className="location-result-btn"
                      onClick={() => choose(p)}
                    >
                      <span className="fw-semibold">{p.name}</span>
                      <span className="text-secondary small">
                        {[p.admin1, p.country].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
