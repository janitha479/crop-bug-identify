// Card for a curated "farming tip" item (has an image, category and summary).
import Img from './Img'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function NewsCard({ item }) {
  return (
    <article className="news-card card h-100 lift shadow-sm">
      <div className="position-relative">
        <span className="news-cat-badge">{item.category}</span>
        <Img src={item.image} alt={item.title} emoji={item.emoji} ratio="16x9" />
      </div>
      <div className="card-body">
        <h3 className="fw-bold">{item.title}</h3>
        <p className="text-secondary small flex-grow-1">{item.summary}</p>
        <div className="d-flex justify-content-between align-items-center news-meta mt-2">
          <span>{formatDate(item.date)}</span>
          {item.source && <span className="fst-italic">{item.source}</span>}
        </div>
      </div>
    </article>
  )
}
