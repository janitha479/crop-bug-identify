// Number that counts up when it scrolls into view.
//
// Correctness first: the displayed value must always end up being the REAL number.
// requestAnimationFrame is paused in hidden/background tabs and IntersectionObserver
// doesn't fire there either, so a safety timer force-sets the final value if the
// animation hasn't finished. That way a stat can never sit at a misleading 0.
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export default function CountUp({ value, duration = 1400, suffix = '', className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  const numeric = Number(String(value).replace(/[^\d.-]/g, ''))
  const isNumeric = Number.isFinite(numeric) && /\d/.test(String(value))
  const animate = isNumeric && !reduce

  const [display, setDisplay] = useState(animate ? 0 : value)
  const done = useRef(false)

  useEffect(() => {
    if (!animate) {
      setDisplay(value)
      return
    }

    const el = ref.current
    let frame
    let started = false
    done.current = false

    const finish = () => {
      done.current = true
      setDisplay(numeric)
    }

    const run = () => {
      if (started) return
      started = true
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p) // easeOutExpo
        setDisplay(Math.round(numeric * eased))
        if (p < 1) frame = requestAnimationFrame(tick)
        else done.current = true
      }
      frame = requestAnimationFrame(tick)
    }

    // Safety net: after the animation *should* have finished, make sure the real
    // number is on screen even if rAF/IO never ran (hidden tab, no IO support).
    const safety = setTimeout(() => {
      if (!done.current) finish()
    }, duration + 700)

    let io
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            run()
            io.disconnect()
          }
        },
        { threshold: 0.25 },
      )
      io.observe(el)
    } else {
      run()
    }

    return () => {
      if (io) io.disconnect()
      clearTimeout(safety)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [animate, numeric, duration, value])

  return (
    <span ref={ref} className={className}>
      {animate ? `${display}${suffix}` : value}
    </span>
  )
}
