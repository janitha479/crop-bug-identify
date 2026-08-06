// One pest-outbreak warning card. Colour, icon and meter follow the risk level
// from the backend (severe / high / moderate / low).
import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertOctagon, AlertTriangle, CalendarDays, Info, Leaf, ShieldCheck, Thermometer,
} from 'lucide-react'
import { useReveal } from '../ui/motion'

const RISK = {
  severe: { label: 'Severe risk', Icon: AlertOctagon },
  high: { label: 'High risk', Icon: AlertTriangle },
  moderate: { label: 'Moderate risk', Icon: Info },
  low: { label: 'Low risk', Icon: ShieldCheck },
}

// The backend score tops out around 6; map it to a bar width.
const pct = (score) => Math.max(8, Math.min(100, Math.round(((score || 0) / 6) * 100)))

export default function OutbreakCard({ warning }) {
  const reduce = useReducedMotion()
  const [meterRef, meterShown] = useReveal(0.2)
  const risk = RISK[warning.risk_level] || RISK.low
  const crops = (warning.crops_affected || []).slice(0, 4)
  const width = pct(warning.risk_score)

  return (
    <div className={`outbreak-card card h-100 risk-${warning.risk_level}`}>
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 fw-bold mb-0" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.35 }}>
            {warning.common_name}
          </h3>
          <span className={`risk-badge risk-badge-${warning.risk_level}`}>
            <risk.Icon size={12} /> {risk.label}
          </span>
        </div>

        {/* Risk meter */}
        <div className="risk-meter mb-3" aria-hidden="true" ref={meterRef}>
          <motion.div
            className={`risk-meter-fill risk-${warning.risk_level}`}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: reduce || meterShown ? `${width}%` : 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </div>

        <div className="outbreak-when text-secondary mb-3 d-flex align-items-center gap-2">
          <CalendarDays size={14} />
          <span>
            {warning.when_label}
            {warning.season ? ` · ${warning.season}` : ''}
          </span>
        </div>

        <p className="small mb-2">{warning.reason}</p>

        <p className="outbreak-climate small mb-1 d-flex align-items-start gap-2">
          <Thermometer size={14} className="flex-shrink-0 mt-1" />
          <span>{warning.climate_note}</span>
        </p>

        {warning.data_source && (
          <p className="outbreak-source mb-3">📊 {warning.data_source}</p>
        )}

        {crops.length > 0 && (
          <div className="mb-3">
            <div className="outbreak-sub-label">Crops at risk</div>
            <div className="d-flex flex-wrap gap-1 mt-2">
              {crops.map((c) => (
                <span className="chip chip-static" style={{ fontSize: '0.74rem' }} key={c}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {warning.prevention?.length > 0 && (
          <div className="mt-auto pt-2">
            <div className="outbreak-sub-label d-flex align-items-center gap-1">
              <Leaf size={11} /> Act early
            </div>
            <ul className="outbreak-tips mb-0 mt-2">
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
