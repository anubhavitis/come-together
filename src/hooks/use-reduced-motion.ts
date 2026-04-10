import { useState, useEffect } from 'react'

const QUERY = '(prefers-reduced-motion: no-preference)'

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    setPrefersReducedMotion(!mql.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(!event.matches)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}
