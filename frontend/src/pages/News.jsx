// News page: LIVE Sri Lanka agriculture headlines (from /api/news) on top, then a
// filterable grid of curated farming tips (always available, offline-safe).
import { useEffect, useMemo, useState } from 'react'
import { CloudSun, Newspaper, Radio } from 'lucide-react'
import NewsCard from '../components/NewsCard'
import LiveNewsCard from '../components/LiveNewsCard'
import WeatherCard from '../components/WeatherCard'
import LocationPicker from '../components/LocationPicker'
import Img from '../components/Img'
import { Reveal, RevealGroup, RevealItem } from '../ui/motion'
import { getNews } from '../api'
import { NEWS, CATEGORIES } from '../data/news'
import { PAGE_IMAGES } from '../data/images'

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
    <div className="pb-5">
      {/* Banner */}
      <section className="position-relative overflow-hidden mb-5" style={{ background: 'var(--forest-900)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.32 }}>
          <Img src={PAGE_IMAGES.news} alt="" ratio="16x9" emoji="☁️" />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(120deg, rgba(14,43,26,0.95), rgba(20,59,37,0.7))',
          }}
        />
        <div className="container position-relative py-5" style={{ zIndex: 2 }}>
          <Reveal>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>News &amp; tips</div>
            <h1 className="display-6 mt-2 mb-3" style={{ color: '#fff' }}>
              Agriculture news for Sri Lanka
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '62ch' }}>
              Live headlines from across the web, plus our own evergreen farming tips on weather,
              crops, bugs and good practice.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container">
        {/* Weather */}
        <section className="mb-5">
          <Reveal className="d-flex align-items-center gap-2 mb-3">
            <CloudSun size={20} style={{ color: 'var(--brand)' }} />
            <h2 className="h5 fw-bold mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
              Weather at your location
            </h2>
            <span className="chip chip-static" style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem' }}>
              live
            </span>
          </Reveal>
          <Reveal><LocationPicker /></Reveal>
          <Reveal><WeatherCard /></Reveal>
        </section>

        {/* Live headlines */}
        <section className="mb-5">
          <Reveal className="d-flex align-items-center gap-2 mb-3">
            <span className="live-dot" />
            <h2 className="h5 fw-bold mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
              Latest headlines
            </h2>
            <span className="chip chip-static d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem' }}>
              <Radio size={11} /> auto-updated
            </span>
          </Reveal>

          {live === null && (
            <div className="row g-4">
              {[0, 1, 2].map((i) => (
                <div className="col-sm-6 col-lg-4" key={i}>
                  <div className="skeleton skeleton-card" />
                </div>
              ))}
            </div>
          )}

          {live !== null && live.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Newspaper size={24} /></div>
              <div className="fw-semibold">Live news unavailable</div>
              <div className="text-secondary small mt-1">
                Make sure the backend is running. Meanwhile, explore the tips below.
              </div>
            </div>
          )}

          {live && live.length > 0 && (
            <RevealGroup className="row g-4" gap={0.05}>
              {live.map((item, i) => (
                <RevealItem className="col-sm-6 col-lg-4" key={item.link || i}>
                  <LiveNewsCard item={item} index={i} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </section>

        {/* Curated tips */}
        <section>
          <Reveal>
            <h2 className="h5 fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              Farming tips &amp; guides
            </h2>
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
          </Reveal>

          <RevealGroup className="row g-4" gap={0.05}>
            {tips.map((item) => (
              <RevealItem className="col-sm-6 col-lg-4" key={item.id}>
                <NewsCard item={item} />
              </RevealItem>
            ))}
          </RevealGroup>

          {tips.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Newspaper size={24} /></div>
              <div className="fw-semibold">Nothing in this category yet</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
