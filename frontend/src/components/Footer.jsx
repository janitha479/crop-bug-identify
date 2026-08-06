// Site footer.
import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-5">
            <div className="footer-brand h5 mb-3">
              <span
                className="d-grid"
                style={{
                  width: 30, height: 30, placeItems: 'center', borderRadius: 9,
                  background: 'rgba(255,255,255,0.12)',
                }}
              >
                <Sprout size={17} />
              </span>
              Smart Pest Detection
            </div>
            <p className="small mb-0" style={{ maxWidth: '30rem', opacity: 0.8, lineHeight: 1.7 }}>
              An AI assistant that helps Sri Lankan farmers identify crop pests from a photo, act on
              them with knowledge-base-backed advice, and see which pests are likely to arrive next
              season.
            </p>
          </div>

          <div className="col-6 col-md-3">
            <div className="fw-semibold mb-3 text-white small text-uppercase" style={{ letterSpacing: '0.08em' }}>
              Explore
            </div>
            <ul className="list-unstyled small mb-0" style={{ lineHeight: 2 }}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/news">News &amp; tips</Link></li>
              <li><Link to="/bugs">Bugs &amp; pests</Link></li>
              <li><Link to="/forecast">Outbreak forecast</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-4">
            <div className="fw-semibold mb-3 text-white small text-uppercase" style={{ letterSpacing: '0.08em' }}>
              About
            </div>
            <p className="small mb-0" style={{ opacity: 0.8, lineHeight: 1.7 }}>
              Final-year project · Smart Pest Detection &amp; Prediction System. Built with a custom
              CNN, an on-project pest knowledge base, real GBIF sighting data and live weather.
            </p>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '2.5rem 0 1.5rem' }} />
        <div className="small text-center" style={{ opacity: 0.65 }}>
          © {new Date().getFullYear()} Smart Pest Detection &amp; Prediction System · Helping farmers
          protect their crops.
        </div>
      </div>
    </footer>
  )
}
