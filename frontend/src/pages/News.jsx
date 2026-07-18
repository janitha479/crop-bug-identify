// News page: LIVE Sri Lanka agriculture headlines (from /api/news) on top, then a
// filterable grid of curated farming tips (always available, offline-safe).
import { useEffect, useMemo, useState } from 'react'
import NewsCard from '../components/NewsCard'
import LiveNewsCard from '../components/LiveNewsCard'
import { getNews } from '../api'
import { NEWS, CATEGORIES } from '../data/news'

export default function News() {
  const [active, setActive] = useState('All')
  const [live, setLive] = useState(null) // null = loading, [] = none

  useEffect(() => {
    let alive = true
    getNews().then((items) => alive && setLive(items))
    return () => { alive = false }
  }, [])

  const tips = useMemo(
    () => (active === 'All' ? NEWS : NEWS.filter((n) => n.category === active)),
    [active],
  )

  return (
    <div className="container py-5">
      <header className="mb-4">
        <div className="eyebrow">News &amp; tips</div>
        <h1 className="section-title display-6 fw-bold mt-1">Agriculture news for Sri Lanka</h1>
        <p className="text-secondary col-lg-8">
          Live headlines from across the web, plus our own evergreen farming tips on weather,
          crops, bugs and good practice.
        </p>
      </header>

      {/* Live headlines */}
      <section className="mb-5">
        <div className="d-flex align-items-center gap-2 mb-3">
          <h2 className="h4 fw-bold mb-0">
            <span className="live-dot"></span>Latest headlines
          </h2>
          <span className="badge bg-light text-secondary border">auto-updated</span>
        </div>

        {live === null && (
          <div className="text-secondary py-4">Loading the latest agriculture news…</div>
        )}

        {live !== null && live.length === 0 && (
          <div className="alert alert-light border" role="status">
            Live news isn’t available right now — make sure the backend is running. Meanwhile,
            explore our farming tips below.
          </div>
        )}

        {live && live.length > 0 && (
          <div className="row g-4">
            {live.map((item, i) => (
              <div className="col-sm-6 col-lg-4" key={item.link || i}>
                <LiveNewsCard item={item} index={i} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Curated tips with filter */}
      <section>
        <h2 className="h4 fw-bold mb-3">Farming tips &amp; guides</h2>
        <div className="d-flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${active === cat ? 'active' : ''}`}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="row g-4">
          {tips.map((item) => (
            <div className="col-sm-6 col-lg-4" key={item.id}>
              <NewsCard item={item} />
            </div>
          ))}
        </div>

        {tips.length === 0 && <p className="text-muted">No items in this category yet.</p>}
      </section>
    </div>
  )
}
