// Shows the full outbreak forecast for ONE saved farm, without making the farmer
// re-enter the location - it fetches straight from the farm's stored coordinates.
import { useEffect, useState } from 'react'
import Modal from './Modal'
import OutbreakCard from './OutbreakCard'
import { getForecast } from '../api'

export default function FarmForecastModal({ farm, onClose }) {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    let alive = true
    getForecast(farm.latitude, farm.longitude, 3).then((data) => {
      if (!alive) return
      setState(data ? { status: 'ok', data } : { status: 'error', data: null })
    })
    return () => { alive = false }
  }, [farm.latitude, farm.longitude])

  const { status, data } = state

  return (
    <Modal title={`Pest forecast: ${farm.name}`} onClose={onClose} wide>
      <p className="text-secondary small mb-3">
        📍 {farm.place_label || `${farm.latitude.toFixed(2)}, ${farm.longitude.toFixed(2)}`}
      </p>

      {status === 'loading' && (
        <div className="text-secondary py-4">🔮 Building the forecast for this farm…</div>
      )}

      {status === 'error' && (
        <div className="alert alert-light border mb-0">
          Couldn’t load the forecast right now. Make sure the backend is running.
        </div>
      )}

      {status === 'ok' && data && (
        <>
          {data.current_climate && (
            <div className="forecast-summary card shadow-sm mb-3">
              <div className="card-body d-flex flex-wrap align-items-center gap-3 py-2">
                <span className="fw-semibold">Window:</span>
                <span>{data.window_months.join(' → ')}</span>
                <span className="text-secondary ms-sm-auto">
                  Now: {Math.round(data.current_climate.temperature)}°C ·{' '}
                  {Math.round(data.current_climate.humidity)}% humidity
                </span>
              </div>
            </div>
          )}

          {data.warnings.length === 0 ? (
            <div className="alert alert-success border mb-0">
              No significant pest surges predicted here in the next {data.months_ahead} months.
            </div>
          ) : (
            <div className="row g-3">
              {data.warnings.map((w) => (
                <div className="col-md-6" key={w.pest}>
                  <OutbreakCard warning={w} />
                </div>
              ))}
            </div>
          )}

          <p className="text-muted small mt-3 mb-0">⚠️ {data.data_note}</p>
        </>
      )}
    </Modal>
  )
}
