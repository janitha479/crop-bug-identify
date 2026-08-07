// Bugs section: a reading guide to the insects Sri Lankan farmers meet. This is
// deliberately BROADER than the model's 19 classes - cards the CNN can identify from
// a photo carry a "Photo ID" badge, the rest are reference-only.
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, ExternalLink, MessageCircle, Search, ShieldCheck, X } from 'lucide-react'
import { useChat } from '../context/ChatContext'
import Img from '../components/Img'
import Modal from '../components/Modal'
import { Reveal, RevealGroup, RevealItem, EASE } from '../ui/motion'
import { BUGS, BUG_GROUPS } from '../data/bugs'
import { PAGE_IMAGES } from '../data/images'

export default function Bugs() {
  const { openChat } = useChat()
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [onlyIdentifiable, setOnlyIdentifiable] = useState(false)
  const [detail, setDetail] = useState(null)

  const identifiable = BUGS.filter((b) => b.inModel).length
  const beneficial = BUGS.filter((b) => b.beneficial).length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BUGS.filter((b) => {
      if (onlyIdentifiable && !b.inModel) return false
      if (group !== 'All' && b.group !== group) return false
      if (q && !`${b.name} ${b.scientific} ${b.blurb}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [group, query, onlyIdentifiable])

  return (
    <div className="pb-5">
      {/* Banner */}
      <section className="position-relative overflow-hidden mb-5" style={{ background: 'var(--forest-900)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
          <Img src={PAGE_IMAGES.bugs} alt="" ratio="16x9" emoji="🍃" />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(120deg, rgba(14,43,26,0.95), rgba(20,59,37,0.72))',
          }}
        />
        <div className="container position-relative py-5" style={{ zIndex: 2 }}>
          <Reveal>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Bugs &amp; crop pests</div>
            <h1 className="display-6 mt-2 mb-3" style={{ color: '#fff' }}>
              Know the bug, save the harvest
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '64ch' }}>
              A field guide to the insects you meet on Sri Lankan farms: the ones that damage
              crops and the ones quietly protecting them. The trick is to{' '}
              <strong style={{ color: '#fff' }}>identify first, then treat only the real problem</strong>.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container">
        {/* Assistant CTA */}
        <Reveal>
          <section className="assistant-panel mb-5 grain">
            <div className="card-body d-flex flex-column flex-md-row align-items-md-center gap-4 p-4 p-md-5">
              <div
                className="d-grid flex-shrink-0"
                style={{
                  width: 58, height: 58, placeItems: 'center', borderRadius: 16,
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <MessageCircle size={26} />
              </div>
              <div className="flex-grow-1">
                <h2 className="h4 fw-bold mb-2">Not sure which one you have?</h2>
                <p className="small mb-0" style={{ opacity: 0.85, maxWidth: '58ch' }}>
                  Send the assistant a photo of the insect on your crop for an instant
                  identification plus treatment and prevention advice.
                </p>
              </div>
              <motion.button
                type="button"
                className="btn btn-light btn-lg fw-semibold flex-shrink-0 d-inline-flex align-items-center gap-2"
                onClick={openChat}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageCircle size={18} /> Open assistant
              </motion.button>
            </div>
          </section>
        </Reveal>

        {/* Controls */}
        <Reveal className="mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
            <div>
              <h2 className="h4 fw-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Field guide
              </h2>
              <span className="text-secondary small">
                {BUGS.length} insects ·{' '}
                <span className="fw-semibold" style={{ color: 'var(--brand-dark)' }}>
                  {identifiable} identifiable from a photo
                </span>{' '}
                · {beneficial} beneficial
              </span>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              <div className="position-relative">
                <Search
                  size={15}
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--ink-faint)',
                  }}
                />
                <input
                  className="form-control form-control-sm"
                  style={{ paddingLeft: 34, borderRadius: 999, minWidth: 220 }}
                  placeholder="Search name or species…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search pests"
                />
              </div>
              <button
                type="button"
                className={`chip d-inline-flex align-items-center gap-1 ${onlyIdentifiable ? 'active' : ''}`}
                onClick={() => setOnlyIdentifiable((v) => !v)}
                title="Show only pests the model can identify from a photo"
              >
                <Camera size={13} /> Photo ID only
              </button>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {BUG_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip ${group === g ? 'active' : ''}`}
                onClick={() => setGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Gallery */}
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={24} /></div>
            <div className="fw-semibold">No insects match those filters</div>
            <div className="text-secondary small mt-1">Try another word, or reset the filters.</div>
            <button
              type="button"
              className="btn btn-sm btn-outline-brand mt-3"
              onClick={() => { setQuery(''); setGroup('All'); setOnlyIdentifiable(false) }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <RevealGroup className="row g-4" gap={0.04}>
            {visible.map((bug) => (
              <RevealItem className="col-sm-6 col-lg-4 col-xl-3" key={bug.label}>
                <motion.button
                  type="button"
                  className={`bug-card card h-100 text-start w-100 ${bug.beneficial ? 'beneficial' : ''}`}
                  onClick={() => setDetail(bug)}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  style={{ border: '1px solid var(--line)', padding: 0 }}
                >
                  <div className="position-relative img-zoom">
                    <Img src={bug.image} alt={bug.name} emoji={bug.emoji} ratio="4x3" />
                    <div className="bug-badges">
                      {bug.inModel && (
                        <span className="bug-badge bug-badge-id" title="The model can identify this from a photo">
                          <Camera size={11} /> Photo ID
                        </span>
                      )}
                      {bug.beneficial && (
                        <span className="bug-badge bug-badge-good">
                          <ShieldCheck size={11} /> Beneficial
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-body p-3">
                    <h3 className="h6 fw-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {bug.name}
                    </h3>
                    <div className="bug-sci mb-2">{bug.scientific}</div>
                    <p className="text-secondary small mb-0 bug-blurb">{bug.blurb}</p>
                  </div>
                </motion.button>
              </RevealItem>
            ))}
          </RevealGroup>
        )}

        <p className="text-muted small mt-4 mb-0">
          <Camera size={13} className="me-1" />
          “Photo ID” marks the {identifiable} pests the trained model recognises from an uploaded
          photo. The others are included for reference and learning.
        </p>
      </div>

      {/* Detail modal */}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="row g-4">
            <div className="col-sm-5">
              <div className="rounded-3 overflow-hidden">
                <Img src={detail.image} alt={detail.name} emoji={detail.emoji} ratio="4x3" />
              </div>
            </div>
            <div className="col-sm-7">
              <div className="bug-sci mb-2">{detail.scientific}</div>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="chip chip-static" style={{ fontSize: '0.74rem' }}>{detail.group}</span>
                {detail.inModel && (
                  <span className="bug-badge bug-badge-id" style={{ position: 'static' }}>
                    <Camera size={11} /> Photo ID
                  </span>
                )}
                {detail.beneficial && (
                  <span className="bug-badge bug-badge-good" style={{ position: 'static' }}>
                    <ShieldCheck size={11} /> Beneficial
                  </span>
                )}
              </div>
              <p className="mb-3">{detail.blurb}</p>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-brand btn-sm d-inline-flex align-items-center gap-2"
                  onClick={() => { setDetail(null); openChat() }}
                >
                  <MessageCircle size={15} /> Ask about this pest
                </button>
                {detail.learnMore && (
                  <a
                    className="btn btn-outline-brand btn-sm d-inline-flex align-items-center gap-2"
                    href={detail.learnMore}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more <ExternalLink size={13} />
                  </a>
                )}
              </div>

              {!detail.inModel && (
                <p className="text-muted small mt-3 mb-0">
                  Note: this one isn’t in the photo-identification model yet, but the assistant can
                  still answer questions about it by name.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
