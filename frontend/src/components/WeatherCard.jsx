// Current-weather panel. Reads the chosen location from LocationContext (set via
// the shared LocationPicker: auto-detect or by name) and fetches live weather for it.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CloudRain, CloudSun, Droplets, Thermometer, Wind } from 'lucide-react'
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
      <div className="weather-banner text-secondary d-flex align-items-center gap-2">
        <CloudSun size={18} /> Choose a location above to see live weather for your farm.
      </div>
    )
  }

  if (state.status === 'loading') {
    return <div className="skeleton" style={{ height: 108, borderRadius: 'var(--radius)' }} />
  }

  if (state.status !== 'ok') {
    return (
      <div className="weather-banner text-secondary d-flex align-items-center gap-2">
        <CloudRain size={18} /> Couldn’t load weather right now — make sure the backend is running.
      </div>
    )
  }

  const w = state.data
  const round = (v) => (v === null || v === undefined ? '—' : Math.round(v))

  const STATS = [
    { Icon: Thermometer, label: 'Feels like', value: `${round(w.feels_like)}${w.units.temperature}` },
    { Icon: Droplets, label: 'Humidity', value: `${round(w.humidity)}${w.units.humidity}` },
    { Icon: Wind, label: 'Wind', value: `${round(w.wind_speed)} ${w.units.wind_speed}` },
    { Icon: CloudRain, label: 'Rain', value: `${w.precipitation ?? 0} ${w.units.precipitation}` },
  ]

  return (
    <motion.div
      className="weather-banner card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="card-body d-flex flex-wrap align-items-center gap-4 p-4">
        <div className="d-flex align-items-center gap-3">
          <span className="weather-emoji" aria-hidden="true">{w.emoji}</span>
          <div>
            <div className="weather-temp fw-bold" style={{ lineHeight: 1 }}>
              {round(w.temperature)}{w.units.temperature}
            </div>
            <div className="text-secondary small mt-1">
              {w.description} · {location.label}
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-4 ms-sm-auto">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="weather-stat-label d-flex align-items-center gap-1">
                <s.Icon size={12} /> {s.label}
              </div>
              <div className="fw-semibold mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
