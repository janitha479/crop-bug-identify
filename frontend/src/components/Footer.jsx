// Site footer.
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-5">
            <div className="footer-brand h5 mb-2">🐛 Smart Pest Detection</div>
            <p className="small mb-0" style={{ maxWidth: '30rem', opacity: 0.85 }}>
              An AI assistant that helps Sri Lankan farmers identify crop pests from a photo and
              act on them with practical, knowledge-base-backed advice — plus live agriculture news.
            </p>
          </div>
          <div className="col-6 col-md-3">
            <div className="fw-semibold mb-2 text-white">Explore</div>
            <ul className="list-unstyled small mb-0">
              <li className="mb-1"><Link to="/">Home</Link></li>
              <li className="mb-1"><Link to="/news">News &amp; tips</Link></li>
              <li className="mb-1"><Link to="/bugs">Bugs &amp; pests</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-4">
            <div className="fw-semibold mb-2 text-white">About</div>
            <p className="small mb-0" style={{ opacity: 0.85 }}>
              Final-year project · Smart Pest Detection &amp; Prediction System.
              Built with a custom CNN and an on-project pest knowledge base.
            </p>
          </div>
        </div>
        <hr style={{ borderColor: 'rgba(255,255,255,0.15)' }} />
        <div className="small text-center" style={{ opacity: 0.75 }}>
          © {new Date().getFullYear()} Smart Pest Detection &amp; Prediction System · Helping farmers protect their crops.
        </div>
      </div>
    </footer>
  )
}
