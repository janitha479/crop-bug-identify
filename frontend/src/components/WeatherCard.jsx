// Current-weather panel. Reads the chosen location from LocationContext (set via
// the shared LocationPicker: auto-detect or by name) and fetches live weather for it.
import { useEffect, useState } from 'react'
import { getWeather } from '../api'
import { useLocation } from '../context/LocationContext'

export default function WeatherCard() {
  const { location } = useLocation()
  const [state, setState] = useState({ status: 'idle', data: null })

  useEffect(() => {
    if (!location) {
      setState({ status: 'idle', data: null })
      return
    }
    let alive = true
    setState({ status: 'loading', data: null })
    getWeather(location.lat, location.lon).then((data) => {
      if (!alive) return
      setState(data ? { status: 'ok', data } : { status: 'error', data: null })
    })
    return () => { alive = false }
  }, [location])

  if (state.status === 'idle') {
    return (
      <div className="weather-banner text-secondary">
        🌦️ Choose a location above to see live weather for your farm.
      </div>
    )
  }

  if (state.status === 'loading') {
    return <div className="weather-banner text-secondary">📍 Getting weather for {location.label}…</div>
  }

  if (state.status !== 'ok') {
    return (
      <div className="weather-banner text-secondary">
        Couldn’t load weather right now — make sure the backend is running, then try again.
      </div>
    )
  }

  const w = state.data
  const round = (v) => (v === null || v === undefined ? '—' : Math.round(v))

  return (
    <div className="weather-banner card shadow-sm">
      <div className="card-body d-flex flex-wrap align-items-center gap-4">
        <div className="d-flex align-items-center gap-3">
          <span className="weather-emoji" aria-hidden="true">{w.emoji}</span>
          <div>
            <div className="weather-temp fw-bold">
              {round(w.temperature)}{w.units.temperature}
            </div>
            <div className="text-secondary">{w.description} · {location.label}</div>
          </div>
        </div>

        <div className="weather-stats d-flex flex-wrap gap-4 ms-sm-auto">
          <div>
            <div className="weather-stat-label">Feels like</div>
            <div className="fw-semibold">{round(w.feels_like)}{w.units.temperature}</div>
          </div>
          <div>
            <div className="weather-stat-label">Humidity</div>
            <div className="fw-semibold">{round(w.humidity)}{w.units.humidity}</div>
          </div>
          <div>
            <div className="weather-stat-label">Wind</div>
            <div className="fw-semibold">{round(w.wind_speed)} {w.units.wind_speed}</div>
          </div>
          <div>
            <div className="weather-stat-label">Rain</div>
            <div className="fw-semibold">{w.precipitation ?? 0} {w.units.precipitation}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
