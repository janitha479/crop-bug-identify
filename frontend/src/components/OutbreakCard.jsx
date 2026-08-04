// One pest-outbreak warning card for the Forecast page. Colour and label follow
// the risk level from the backend (severe / high / moderate / low).
const RISK = {
  severe: { label: 'Severe risk', emoji: '🔴' },
  high: { label: 'High risk', emoji: '🟠' },
  moderate: { label: 'Moderate risk', emoji: '🟡' },
  low: { label: 'Low risk', emoji: '🟢' },
}

export default function OutbreakCard({ warning }) {
  const risk = RISK[warning.risk_level] || RISK.low
  const crops = (warning.crops_affected || []).slice(0, 4)

  return (
    <div className={`outbreak-card card h-100 shadow-sm risk-${warning.risk_level}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
          <h3 className="h5 fw-bold mb-0">{warning.common_name}</h3>
          <span className={`risk-badge risk-badge-${warning.risk_level}`}>
            {risk.emoji} {risk.label}
          </span>
        </div>

        <div className="outbreak-when text-secondary mb-2">
          📅 {warning.when_label}
          {warning.season ? ` · ${warning.season}` : ''}
        </div>

        <p className="mb-2">{warning.reason}</p>
        <p className="outbreak-climate small mb-1">🌡️ {warning.climate_note}</p>
        {warning.data_source && (
          <p className="outbreak-source small mb-3">📊 {warning.data_source}</p>
        )}

        {crops.length > 0 && (
          <div className="mb-3">
            <div className="outbreak-sub-label">Crops at risk</div>
            <div className="d-flex flex-wrap gap-1 mt-1">
              {crops.map((c) => (
                <span className="chip chip-static" key={c}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {warning.prevention?.length > 0 && (
          <div className="mt-auto">
            <div className="outbreak-sub-label">Act early</div>
            <ul className="outbreak-tips mb-0 mt-1">
              {warning.prevention.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
