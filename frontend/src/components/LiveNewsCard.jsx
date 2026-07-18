// Card for a LIVE headline from /api/news (Google News RSS). These come with no
// image, so we pair each with a rotating agriculture stock photo for a consistent look.
import Img from './Img'
import { IMAGES } from '../data/news'

const STOCK = [IMAGES.field, IMAGES.crops, IMAGES.farmer, IMAGES.hero]

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str)
  if (isNaN(d)) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LiveNewsCard({ item, index = 0 }) {
  const img = STOCK[index % STOCK.length]
  return (
    <a
      className="news-card card h-100 lift shadow-sm text-decoration-none text-reset"
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="position-relative">
        <span className="news-cat-badge"><span className="live-dot"></span>Live</span>
        <Img src={img} alt="" emoji="📰" ratio="16x9" />
      </div>
      <div className="card-body">
        <h3 className="fw-bold">{item.title}</h3>
        <div className="d-flex justify-content-between align-items-center news-meta mt-3">
          {item.source && <span className="news-source">{item.source}</span>}
          <span>{formatDate(item.published)}</span>
        </div>
      </div>
    </a>
  )
}
