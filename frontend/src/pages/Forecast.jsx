// Outbreak Forecast page: predicts which pests are likely to surge in the coming
// months at the farmer's location, using device geolocation + the /api/forecast
// endpoint (seasonal calendar blended with live climate).
import { useEffect, useState } from 'react'
import OutbreakCard from '../components/OutbreakCard'
import LocationPicker from '../components/LocationPicker'
import { getForecast } from '../api'
import { useLocation } from '../context/LocationContext'

const MONTHS = 3

export default function Forecast() {
  const { location } = useLocation()
  const [state, setState] = useState({ status: 'idle', data: null })

  useEffect(() => {
    if (!location) {
      setState({ status: 'idle', data: null })
      return
    }
    let alive = true
    setState({ status: 'loading', data: null })
    getForecast(location.lat, location.lon, MONTHS).then((data) => {
      if (!alive) return
      setState(data ? { status: 'ok', data } : { status: 'error', data: null })
    })
    return () => { alive = false }
  }, [location])

  const { status, data } = state

  return (
    <div className="container py-5">
      <header className="mb-4">
        <div className="eyebrow">Prediction</div>
        <h1 className="section-title display-6 fw-bold mt-1">Pest outbreak forecast</h1>
        <p className="text-secondary col-lg-8">
          A look ahead at which pests are likely to appear on your farm over the next few
          months, based on Sri Lanka&apos;s cropping seasons and the current weather at your
          location. Warned early, you can act before an outbreak takes hold.
        </p>
      </header>

      <LocationPicker />

      {status === 'idle' && (
        <div className="alert alert-light border" role="status">
          Choose a location above — detect it automatically or type a town/district — to get a
          forecast tailored to your area.
        </div>
      )}

      {status === 'loading' && (
        <div className="text-secondary py-4">🔮 Building the forecast for {location?.label}…</div>
      )}

      {status === 'error' && (
        <div className="alert alert-light border" role="status">
          The forecast service isn’t reachable right now — make sure the backend is running.
          Meanwhile, you can still browse pests and tips across the site.
        </div>
      )}

      {status === 'ok' && data && (
        <>
          {data.current_climate && (
            <div className="forecast-summary card shadow-sm mb-4">
              <div className="card-body d-flex flex-wrap align-items-center gap-3">
                <span className="fw-semibold">Forecast window:</span>
                <span>{data.window_months.join(' → ')}</span>
                <span className="text-secondary ms-sm-auto">
                  Current climate: {Math.round(data.current_climate.temperature)}°C ·
                  {' '}{Math.round(data.current_climate.humidity)}% humidity
                </span>
              </div>
            </div>
          )}

          {data.warnings.length === 0 ? (
            <div className="alert alert-success border" role="status">
              Good news — no significant pest surges are predicted for your area in the next
              {' '}{data.months_ahead} months. Keep scouting your fields regularly.
            </div>
          ) : (
            <div className="row g-4">
              {data.warnings.map((w) => (
                <div className="col-md-6 col-xl-4" key={w.pest}>
                  <OutbreakCard warning={w} />
                </div>
              ))}
            </div>
          )}

          <p className="text-muted small mt-4 mb-0">
            ⚠️ {data.data_note} Always confirm with your local agricultural extension officer.
          </p>
        </>
      )}
    </div>
  )
}
