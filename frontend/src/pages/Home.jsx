// Landing page: cinematic hero, feature highlights, how-it-works, news teaser, CTA.
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, BookOpen, Camera, ChevronDown, CloudSun, Leaf,
  MessageCircle, Newspaper, ShieldCheck, TrendingUp,
} from 'lucide-react'
import { useChat } from '../context/ChatContext'
import NewsCard from '../components/NewsCard'
import Img from '../components/Img'
import CountUp from '../ui/CountUp'
import { Reveal, RevealGroup, RevealItem, fadeUp, EASE } from '../ui/motion'
import { NEWS } from '../data/news'
import { PHOTOS } from '../data/images'

const FEATURES = [
  {
    Icon: Camera,
    title: 'AI pest identification',
    text: 'Photograph the insect on your crop and our own trained model tells you what it is, with a confidence score.',
    image: PHOTOS.inspectLeaf,
  },
  {
    Icon: BookOpen,
    title: 'Grounded expert advice',
    text: 'Guidance from a curated knowledge base: symptoms, organic and chemical control, and prevention.',
    image: PHOTOS.farmerHands,
  },
  {
    Icon: TrendingUp,
    title: 'Outbreak prediction',
    text: 'See which pests are likely to appear on your land in the months ahead, from real sighting data and live weather.',
    image: PHOTOS.sunriseField,
  },
]

const STEPS = [
  { n: '1', Icon: Camera, title: 'Snap a photo', text: 'Take a clear, close photo of the pest on your crop.' },
  { n: '2', Icon: Leaf, title: 'Get an identification', text: 'Our CNN names the insect and shows how confident it is.' },
  { n: '3', Icon: ShieldCheck, title: 'Act with confidence', text: 'Receive treatment and prevention steps you can use today.' },
]

const STATS = [
  { value: 19, label: 'pest classes' },
  { value: 14, label: 'GBIF-backed forecasts' },
  { value: 'Free', label: 'to use' },
]

export default function Home() {
  const { openChat } = useChat()
  const latest = NEWS.slice(0, 3)
  const heroRef = useRef(null)
  const reduce = useReducedMotion()

  // Gentle parallax: the hero photo drifts slower than the page scrolls.
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.16])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="hero grain" ref={heroRef}>
        <motion.div
          className="hero-bg"
          style={
            reduce
              ? { backgroundImage: `url(${PHOTOS.heroField})`, transform: 'scale(1.05)' }
              : { backgroundImage: `url(${PHOTOS.heroField})`, y: bgY, scale: bgScale }
          }
        />
        <div className="hero-overlay" />

        <motion.div
          className="container hero-inner py-5"
          style={reduce ? undefined : { opacity: contentOpacity }}
        >
          <motion.div
            className="row align-items-center"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
          >
            <div className="col-lg-8">
              <motion.div className="d-flex flex-wrap hero-badges mb-4" variants={fadeUp}>
                <span className="hero-badge"><Leaf size={13} /> Built for Sri Lankan farmers</span>
                <span className="hero-badge"><ShieldCheck size={13} /> Own trained CNN</span>
              </motion.div>

              <motion.h1 variants={fadeUp}>
                Identify crop pests in seconds, and know <span className="accent-word">exactly</span> what to do.
              </motion.h1>

              <motion.p className="lead hero-lead mt-4" variants={fadeUp}>
                Upload a photo of a pest on your crop for an instant identification, practical local
                advice, and a forecast of what is coming next season. Free, and it works right in
                your browser.
              </motion.p>

              <motion.div className="d-flex flex-wrap gap-3 mt-4" variants={fadeUp}>
                <motion.button
                  type="button"
                  className="btn btn-light btn-lg fw-semibold d-inline-flex align-items-center gap-2"
                  onClick={openChat}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle size={18} /> Try the Pest Assistant
                </motion.button>
                <Link
                  to="/forecast"
                  className="btn btn-outline-light btn-lg d-inline-flex align-items-center gap-2"
                >
                  See the forecast <ArrowRight size={17} />
                </Link>
              </motion.div>

              <motion.div className="d-flex hero-stats mt-5 pt-2" variants={fadeUp}>
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="hero-stat-num">
                      <CountUp value={s.value} />
                    </div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {!reduce && (
          <motion.div
            className="hero-scroll-hint"
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={26} />
          </motion.div>
        )}
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="container py-6 py-5">
        <Reveal className="text-center mb-5">
          <div className="eyebrow">Why use it</div>
          <h2 className="section-title display-6 mt-2">Everything you need to protect your harvest</h2>
          <p className="lead-muted mx-auto mt-3">
            Three tools working together (vision, knowledge and prediction) so you can act early
            instead of reacting to damage.
          </p>
        </Reveal>

        <RevealGroup className="row g-4">
          {FEATURES.map((f) => (
            <RevealItem className="col-md-4" key={f.title}>
              <motion.div
                className="card h-100 overflow-hidden"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <div className="img-zoom">
                  <Img src={f.image} alt={f.title} emoji="🌿" ratio="16x9" />
                </div>
                <div className="card-body p-4">
                  <div className="feature-icon feature-icon-start mb-3">
                    <f.Icon size={22} strokeWidth={1.9} />
                  </div>
                  <h3 className="h5 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{f.title}</h3>
                  <p className="text-secondary small mb-0">{f.text}</p>
                </div>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="section-alt py-5 position-relative grain">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <Reveal>
                <div className="eyebrow">How it works</div>
                <h2 className="section-title display-6 mt-2 mb-4">Three steps from photo to plan</h2>
              </Reveal>

              <RevealGroup className="d-flex flex-column gap-4" gap={0.12}>
                {STEPS.map((s) => (
                  <RevealItem key={s.n}>
                    <div className="d-flex gap-3 align-items-start">
                      <div className="step-num">{s.n}</div>
                      <div>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <s.Icon size={16} className="text-secondary" /> {s.title}
                        </div>
                        <div className="text-secondary small mt-1">{s.text}</div>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>

              <Reveal delay={0.15}>
                <motion.button
                  type="button"
                  className="btn btn-brand mt-4 d-inline-flex align-items-center gap-2"
                  onClick={openChat}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle size={16} /> Start now
                </motion.button>
              </Reveal>
            </div>

            <div className="col-lg-6">
              <Reveal variants={fadeUp} delay={0.1}>
                <div className="rounded-4 overflow-hidden shadow-lg img-zoom">
                  <Img src={PHOTOS.farmerField} alt="Farmer inspecting a crop" emoji="🧑‍🌾" ratio="4x3" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Forecast teaser ---------------- */}
      <section className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 order-lg-2">
            <Reveal>
              <div className="eyebrow">Prediction</div>
              <h2 className="section-title display-6 mt-2 mb-3">Know what is coming, before it arrives</h2>
              <p className="lead-muted">
                The forecast blends Sri Lanka&apos;s Maha and Yala seasons with real pest sighting
                records and the live weather at your location, ranking which pests are most likely
                to surge on your land in the next three months.
              </p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <span className="chip chip-static"><CloudSun size={13} className="me-1" /> Live weather</span>
                <span className="chip chip-static">📊 Real GBIF records</span>
                <span className="chip chip-static">🌾 Seasonal calendar</span>
              </div>
              <Link to="/forecast" className="btn btn-outline-brand mt-4 d-inline-flex align-items-center gap-2">
                Open the forecast <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
          <div className="col-lg-6 order-lg-1">
            <Reveal delay={0.1}>
              <div className="rounded-4 overflow-hidden shadow-lg img-zoom">
                <Img src={PHOTOS.cropRows} alt="Rows of crops at sunrise" emoji="🌾" ratio="4x3" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------- Latest news ---------------- */}
      <section className="section-warm py-5">
        <div className="container py-3">
          <Reveal className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
            <div>
              <div className="eyebrow"><Newspaper size={12} className="me-1" /> News &amp; tips</div>
              <h2 className="section-title display-6 mt-2 mb-0">Latest for the field</h2>
            </div>
            <Link to="/news" className="btn btn-outline-brand btn-sm d-inline-flex align-items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </Reveal>

          <RevealGroup className="row g-4">
            {latest.map((item) => (
              <RevealItem className="col-md-4" key={item.id}>
                <NewsCard item={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="container py-5">
        <Reveal>
          <div className="assistant-panel p-4 p-md-5 text-center grain">
            <motion.div
              className="d-inline-grid mb-3"
              style={{
                width: 64, height: 64, placeItems: 'center', borderRadius: 18,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              }}
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MessageCircle size={28} />
            </motion.div>
            <h2 className="h3 fw-bold">Found a bug on your crop?</h2>
            <p className="mb-4" style={{ opacity: 0.85, maxWidth: '46ch', margin: '0 auto' }}>
              Open the assistant, send a photo, and get an identification with a treatment plan in
              seconds.
            </p>
            <motion.button
              type="button"
              className="btn btn-light btn-lg fw-semibold d-inline-flex align-items-center gap-2 mt-3"
              onClick={openChat}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <MessageCircle size={18} /> Open the Pest Assistant
            </motion.button>
          </div>
        </Reveal>
      </section>
    </>
  )
}
