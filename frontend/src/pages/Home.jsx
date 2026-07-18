// Landing page: image hero, feature highlights, how-it-works, news teaser, CTA.
import { Link } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import NewsCard from '../components/NewsCard'
import Img from '../components/Img'
import { NEWS, IMAGES } from '../data/news'

const FEATURES = [
  {
    emoji: '📷',
    title: 'AI pest identification',
    text: 'Snap a photo of the insect on your crop and our own trained model tells you what it is.',
  },
  {
    emoji: '📖',
    title: 'Own knowledge base',
    text: 'Advice from a curated pest knowledge base — symptoms, organic and chemical control, prevention.',
  },
  {
    emoji: '📰',
    title: 'Live agri news & tips',
    text: 'Real Sri Lankan agriculture headlines plus seasonal notes on weather, crops and bugs.',
  },
]

const STEPS = [
  { n: '1', title: 'Snap a photo', text: 'Take a clear, close photo of the pest on your crop.' },
  { n: '2', title: 'Get an ID', text: 'Our CNN identifies the insect and shows how confident it is.' },
  { n: '3', title: 'Act with advice', text: 'Receive treatment and prevention steps from the knowledge base.' },
]

export default function Home() {
  const { openChat } = useChat()
  const latest = NEWS.slice(0, 3)

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${IMAGES.hero})` }} />
        <div className="hero-overlay" />
        <div className="container hero-inner py-5 my-md-4">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex flex-wrap hero-badges mb-3">
                <span className="hero-badge">🇱🇰 Built for Sri Lankan farmers</span>
                <span className="hero-badge">🧠 Own trained CNN</span>
              </div>
              <h1>Identify crop pests in seconds — and know exactly what to do.</h1>
              <p className="lead hero-lead mt-3">
                Upload a photo of a pest on your crop and get an instant identification plus
                practical, local advice on how to deal with it. Free, and works right in your browser.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <button type="button" className="btn btn-light btn-lg fw-semibold" onClick={openChat}>
                  💬 Try the Pest Assistant
                </button>
                <Link to="/bugs" className="btn btn-outline-light btn-lg">Explore bugs</Link>
              </div>
              <div className="d-flex hero-stats mt-5">
                <div>
                  <div className="hero-stat-num">19</div>
                  <div className="hero-stat-label">pest classes</div>
                </div>
                <div>
                  <div className="hero-stat-num">100%</div>
                  <div className="hero-stat-label">free to use</div>
                </div>
                <div>
                  <div className="hero-stat-num">Live</div>
                  <div className="hero-stat-label">agri news</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-5">
        <div className="text-center mb-4">
          <div className="eyebrow">Why use it</div>
          <h2 className="section-title h1 mt-1">Everything you need to protect your harvest</h2>
        </div>
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div className="col-md-4" key={f.title}>
              <div className="card h-100 lift shadow-sm text-center p-2">
                <div className="card-body">
                  <div className="feature-icon" aria-hidden="true">{f.emoji}</div>
                  <h3 className="h5 fw-bold mt-3">{f.title}</h3>
                  <p className="text-secondary small mb-0">{f.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section-alt py-5">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="eyebrow">How it works</div>
              <h2 className="section-title h1 mt-1 mb-4">Three steps from photo to plan</h2>
              <div className="d-flex flex-column gap-3">
                {STEPS.map((s) => (
                  <div className="d-flex gap-3 align-items-start" key={s.n}>
                    <div className="feature-icon flex-shrink-0" style={{ margin: 0 }}>{s.n}</div>
                    <div>
                      <div className="fw-bold">{s.title}</div>
                      <div className="text-secondary small">{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-brand mt-4" onClick={openChat}>
                💬 Start now
              </button>
            </div>
            <div className="col-lg-6">
              <div className="rounded-4 overflow-hidden shadow-lg">
                <Img src={IMAGES.farmer} alt="Farmer inspecting a crop" emoji="🧑‍🌾" ratio="4x3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest news teaser */}
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <div className="eyebrow">News &amp; tips</div>
            <h2 className="section-title h1 mt-1 mb-0">Latest for the field</h2>
          </div>
          <Link to="/news" className="btn btn-outline-brand btn-sm">View all →</Link>
        </div>
        <div className="row g-4">
          {latest.map((item) => (
            <div className="col-md-4" key={item.id}>
              <NewsCard item={item} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="container pb-5">
        <div className="assistant-panel p-4 p-md-5 text-center">
          <div className="assistant-panel-emoji mb-2">🐛💬</div>
          <h2 className="h3 fw-bold">Found a bug on your crop?</h2>
          <p className="mb-4" style={{ opacity: 0.9 }}>
            Open the Pest Assistant and get an identification in seconds.
          </p>
          <button type="button" className="btn btn-light btn-lg fw-semibold" onClick={openChat}>
            💬 Open the Pest Assistant
          </button>
        </div>
      </section>
    </>
  )
}
