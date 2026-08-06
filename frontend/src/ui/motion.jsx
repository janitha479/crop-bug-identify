// Shared motion primitives so every page animates with the same rhythm.
// Balanced level: noticeable but never in the way, and disabled automatically
// for users who ask for reduced motion.
//
// Reveals use our own IntersectionObserver plus a safety timer: if IO never
// fires (unsupported, non-composited/headless rendering, print), the content
// still becomes visible instead of being stuck at opacity 0.
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export const EASE = [0.22, 1, 0.36, 1]
const FALLBACK_MS = 1200

// --- Variants ---------------------------------------------------------------
export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE } },
}

export const stagger = (delayChildren = 0, staggerChildren = 0.08) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

/** Returns [ref, shown] — true once scrolled into view, or after a safety timeout. */
export function useReveal(amount = 0.15) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let timer

    // Safety net — never leave content permanently invisible.
    timer = setTimeout(() => setShown(true), FALLBACK_MS)

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return () => clearTimeout(timer)
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
          clearTimeout(timer)
        }
      },
      { threshold: amount },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      clearTimeout(timer)
    }
  }, [amount])

  return [ref, shown]
}

// --- Components -------------------------------------------------------------

/** Reveals its children when scrolled into view (once). */
export function Reveal({ children, variants = fadeUp, delay = 0, className = '', as = 'div' }) {
  const reduce = useReducedMotion()
  const [ref, shown] = useReveal(0.15)
  const Tag = motion[as] || motion.div

  if (reduce) return <div className={className}>{children}</div>

  return (
    <Tag
      ref={ref}
      className={className}
      initial="hidden"
      animate={shown ? 'show' : 'hidden'}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Tag>
  )
}

/** Staggered container — pair with <RevealItem> children. */
export function RevealGroup({ children, className = '', delayChildren = 0, gap = 0.08 }) {
  const reduce = useReducedMotion()
  const [ref, shown] = useReveal(0.1)

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={shown ? 'show' : 'hidden'}
      variants={stagger(delayChildren, gap)}
    >
      {children}
    </motion.div>
  )
}

/** A single item inside a RevealGroup. */
export function RevealItem({ children, className = '', variants = fadeUp }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}

/** Wraps a route so pages cross-fade instead of snapping. */
export function PageTransition({ children }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
