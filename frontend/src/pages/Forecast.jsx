// Outbreak Forecast page: predicts which pests are likely to surge in the coming
// months at the farmer's location, using the shared LocationPicker + /api/forecast.
import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarRange, CheckCircle2, Droplets, MapPin, Thermometer } from 'lucide-react'
import OutbreakCard from '../components/OutbreakCard'
import LocationPicker from '../components/LocationPicker'
import Img from '../components/Img'
import { Reveal, RevealGroup, RevealItem } from '../ui/motion'
import { getForecast } from '../api'
import { useLocation } from '../context/LocationContext'
import { PAGE_IMAGES } from '../data/images'

const MONTHS = 3

function SkeletonGrid() {
  return (
    <div className="row g-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div className="col-md-6 col-xl-4" key={i}>
          <div className="skeleton skeleton-card" />
        </div>
      ))}
    </div>
  )
}

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
  const counts = data
    ? data.warnings.reduce((acc, w) => ({ ...acc, [w.risk_level]: (acc[w.risk_level] || 0) + 1 }), {})
    : {}

  return (
    <div className="pb-5 ui-face">
      {/* Banner */}
      <section className="position-relative overflow-hidden mb-5" style={{ background: 'var(--forest-900)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.32 }}>
          <Img src={PAGE_IMAGES.forecast} alt="" ratio="16x9" emoji="🌅" />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(120deg, rgba(14,43,26,0.95), rgba(20,59,37,0.7))',
          }}
        />
        <div className="container position-relative py-5" style={{ zIndex: 2 }}>
          <Reveal>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Prediction</div>
            <h1 className="display-6 mt-2 mb-3" style={{ color: '#fff' }}>Pest outbreak forecast</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '64ch' }}>
              A look ahead at which pests are likely to appear on your farm over the next few months,
              based on Sri Lanka&apos;s cropping seasons, real sighting records and the live weather at
              your location.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container">
        <Reveal><LocationPicker /></Reveal>

        {status === 'idle' && (
          <div className="empty-state">
            <div className="empty-state-icon"><MapPin size={24} /></div>
            <div className="fw-semibold">Choose a location to see your forecast</div>
            <div className="text-secondary small mt-1">
              Detect it automatically or type a town / district above.
            </div>
          </div>
        )}

        {status === 'loading' && (
          <>
            <div className="text-secondary mb-4 d-flex align-items-center gap-2">
              <CalendarRange size={16} /> Building the forecast for {location?.label}…
            </div>
            <SkeletonGrid />
          </>
        )}

        {status === 'error' && (
          <div className="empty-state">
            <div className="empty-state-icon"><AlertTriangle size={24} /></div>
            <div className="fw-semibold">Forecast service unavailable</div>
            <div className="text-secondary small mt-1">
              Make sure the backend is running, then try again.
            </div>
          </div>
        )}

        {status === 'ok' && data && (
          <>
            {/* Summary strip */}
            <Reveal>
              <div className="forecast-summary card mb-4">
                <div className="card-body d-flex flex-wrap align-items-center gap-4 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <CalendarRange size={17} style={{ color: 'var(--brand-dark)' }} />
                    <span className="fw-semibold">{data.window_months.join(' → ')}</span>
                  </div>

                  {data.current_climate && (
                    <div className="d-flex align-items-center gap-3 text-secondary small">
                      <span className="d-flex align-items-center gap-1">
                        <Thermometer size={15} /> {Math.round(data.current_climate.temperature)}°C
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Droplets size={15} /> {Math.round(data.current_climate.humidity)}%
                      </span>
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2 ms-sm-auto">
                    {['severe', 'high', 'moderate', 'low'].map((lvl) =>
                      counts[lvl] ? (
                        <span key={lvl} className={`risk-badge risk-badge-${lvl}`}>
                          {counts[lvl]} {lvl}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>
              </div>
            </Reveal>

            {data.warnings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><CheckCircle2 size={24} /></div>
                <div className="fw-semibold">No significant pest surges predicted</div>
                <div className="text-secondary small mt-1">
                  Nothing expected in the next {data.months_ahead} months — keep scouting regularly.
                </div>
              </div>
            ) : (
              <RevealGroup className="row g-4" gap={0.05}>
                {data.warnings.map((w) => (
                  <RevealItem className="col-md-6 col-xl-4" key={w.pest}>
                    <OutbreakCard warning={w} />
                  </RevealItem>
                ))}
              </RevealGroup>
            )}

            <p className="text-muted small mt-4 mb-0 d-flex align-items-start gap-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-1" />
              <span>{data.data_note} Always confirm with your local agricultural extension officer.</span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
