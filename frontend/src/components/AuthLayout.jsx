// Split-screen shell for the Login / Register pages: farm photography on one side,
// the form on the other.
import { motion } from 'framer-motion'
import { Leaf, ShieldCheck, TrendingUp } from 'lucide-react'
import Img from './Img'
import { PAGE_IMAGES } from '../data/images'

const POINTS = [
  { Icon: Leaf, text: 'Save your farms and see them at a glance' },
  { Icon: TrendingUp, text: 'Get pest forecasts for each location' },
  { Icon: ShieldCheck, text: 'Keep a history of every scan and conversation' },
]

export default function AuthLayout({ children }) {
  return (
    <div className="container-fluid px-0">
      <div className="row g-0 auth-split">
        {/* Visual side */}
        <div className="col-lg-6 d-none d-lg-block auth-visual">
          <div className="auth-visual-img">
            <Img src={PAGE_IMAGES.auth} alt="" ratio="3x4" emoji="🌾" className="h-100" />
          </div>
          <div className="auth-visual-overlay" />
          <div className="auth-visual-content d-flex flex-column justify-content-end h-100 p-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="display-6 mb-3" style={{ color: '#fff' }}>
                Your farm, <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>protected</span>
              </h2>
              <p style={{ opacity: 0.85, maxWidth: '42ch' }}>
                Create an account to keep everything in one place: your land, its weather, and what
                is coming next season.
              </p>
              <ul className="list-unstyled mt-4 mb-0">
                {POINTS.map((p, i) => (
                  <motion.li
                    key={p.text}
                    className="d-flex align-items-center gap-3 mb-3"
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.1, duration: 0.45 }}
                  >
                    <span
                      className="d-grid flex-shrink-0"
                      style={{
                        width: 34, height: 34, placeItems: 'center', borderRadius: 10,
                        background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <p.Icon size={16} />
                    </span>
                    <span className="small" style={{ opacity: 0.9 }}>{p.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Form side */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center py-5 px-3 section-warm">
          <motion.div
            className="w-100 d-flex justify-content-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
