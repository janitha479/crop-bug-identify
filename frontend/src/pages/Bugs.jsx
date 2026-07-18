// Bugs section: intro, a prominent assistant CTA, and a polished gallery of the
// pests the assistant recognises. Pest cards are icon-based on purpose — showing a
// generic insect photo on a specific species would be misleading for an ID tool.
import { useChat } from '../context/ChatContext'
import { BUGS } from '../data/bugs'

export default function Bugs() {
  const { openChat } = useChat()
  const beneficial = BUGS.filter((b) => b.beneficial).length

  return (
    <div className="container py-5">
      {/* Intro */}
      <header className="mb-4">
        <div className="eyebrow">Bugs &amp; crop pests</div>
        <h1 className="section-title display-6 fw-bold mt-1">Know the bug, save the harvest</h1>
        <p className="text-secondary col-lg-9">
          Some insects — like bees, earthworms and many wasps — are friends you should protect;
          others quietly damage leaves, stems, fruit and stored grain. The trick is to{' '}
          <strong>identify first, then treat only the real problem</strong>. Below are the pests our
          assistant knows about. Not sure which one you have? Ask the assistant with a photo.
        </p>
      </header>

      {/* Assistant CTA panel */}
      <section className="assistant-panel mb-5">
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center gap-3 p-4">
          <div className="assistant-panel-emoji" aria-hidden="true">🐛💬</div>
          <div className="flex-grow-1">
            <h2 className="h4 fw-bold mb-1">Identify a pest with the Pest Assistant</h2>
            <p className="small mb-0" style={{ opacity: 0.9 }}>
              Upload a photo of the insect on your crop and get an instant identification plus
              treatment and prevention advice from our knowledge base.
            </p>
          </div>
          <button type="button" className="btn btn-light btn-lg fw-semibold flex-shrink-0" onClick={openChat}>
            💬 Open the Pest Assistant
          </button>
        </div>
      </section>

      {/* Gallery header */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-3">
        <h2 className="h4 fw-bold mb-0">Pests the assistant can recognise</h2>
        <span className="text-secondary small">
          {BUGS.length} classes · <span className="text-success fw-semibold">{beneficial} beneficial</span>
        </span>
      </div>

      {/* Pest gallery */}
      <div className="row g-3">
        {BUGS.map((bug) => (
          <div className="col-sm-6 col-lg-4" key={bug.label}>
            <div className={`bug-card card h-100 lift shadow-sm ${bug.beneficial ? 'beneficial' : ''}`}>
              <div className="bug-head">
                <span className="bug-emoji-badge" aria-hidden="true">{bug.emoji}</span>
                <h3 className="h6 fw-bold mb-0">{bug.name}</h3>
                {bug.beneficial && (
                  <span className="badge bg-success ms-auto">Beneficial</span>
                )}
              </div>
              <div className="card-body">
                <p className="text-secondary small mb-0">{bug.blurb}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
