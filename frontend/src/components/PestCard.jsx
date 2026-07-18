// Compact identification card shown with the bot's reply after a detection.

function severityColor(sev) {
  switch (sev) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'secondary'
  }
}

export default function PestCard({ pest, topPrediction, imageUrl }) {
  if (!pest) return null
  const confidence = Math.round((topPrediction?.confidence ?? 0) * 100)
  const crops = pest.crops_affected || []

  return (
    <div className="pest-card">
      {imageUrl && <img src={imageUrl} alt={pest.common_name} className="pest-thumb" />}
      <div className="pest-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="fw-bold">{pest.common_name}</div>
            {pest.scientific_name && (
              <div className="text-muted fst-italic small">{pest.scientific_name}</div>
            )}
          </div>
          <span className="badge bg-success confidence-badge">{confidence}% match</span>
        </div>

        <div className="mt-2 d-flex flex-wrap gap-1">
          {pest.beneficial ? (
            <span className="badge bg-success-subtle text-success-emphasis border border-success">
              Beneficial — don't kill
            </span>
          ) : (
            pest.severity && pest.severity !== 'none' && (
              <span className={`badge bg-${severityColor(pest.severity)}-subtle text-${severityColor(pest.severity)}-emphasis border border-${severityColor(pest.severity)}`}>
                Severity: {pest.severity}
              </span>
            )
          )}
          {crops.slice(0, 4).map((c) => (
            <span key={c} className="badge bg-light text-dark border">{c}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
