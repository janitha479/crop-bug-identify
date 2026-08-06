// Card for a curated "farming tip" item (has an image, category and summary).
import { motion } from 'framer-motion'
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
    <motion.article
      className="news-card card h-100"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="position-relative img-zoom">
        <span className="news-cat-badge">{item.category}</span>
        <Img src={item.image} alt={item.title} emoji={item.emoji} ratio="16x9" />
      </div>
      <div className="card-body d-flex flex-column p-4">
        <h3 className="fw-bold mb-2">{item.title}</h3>
        <p className="text-secondary small flex-grow-1 mb-3">{item.summary}</p>
        <div className="d-flex justify-content-between align-items-center news-meta pt-2"
             style={{ borderTop: '1px solid var(--line)' }}>
          <span>{formatDate(item.date)}</span>
          {item.source && <span className="news-source">{item.source}</span>}
        </div>
      </div>
    </motion.article>
  )
}
