// Reusable client-side pagination for the dashboard history lists.
//
// usePaginated(items, perPage) slices the list and keeps the current page valid
// when the underlying data changes (e.g. after a refresh or a delete).
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function usePaginated(items = [], perPage = 10) {
  const [page, setPage] = useState(1)
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / perPage))

  // If the list shrank (deleted the last row on a page), step back into range.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const slice = useMemo(
    () => items.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    [items, page, perPage],
  )

  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return {
    page, setPage, pageCount, total, from, to, slice,
    next: () => setPage((p) => Math.min(p + 1, pageCount)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
  }
}

export default function Pagination({ page, pageCount, total, from, to, next, prev, label = 'records' }) {
  if (total === 0) return null

  return (
    <div className="pager d-flex flex-wrap align-items-center gap-2 justify-content-between">
      <span className="pager-count">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> {label}
      </span>

      {pageCount > 1 && (
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-brand d-inline-flex align-items-center gap-1"
            onClick={prev}
            disabled={page === 1}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <span className="pager-page">
            Page {page} of {pageCount}
          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-brand d-inline-flex align-items-center gap-1"
            onClick={next}
            disabled={page === pageCount}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
