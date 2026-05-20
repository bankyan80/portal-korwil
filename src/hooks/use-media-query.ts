import * as React from "react"

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
  return useMediaQuery(query)
}

export function useIsMobile(): boolean {
  return !useBreakpoint('md')
}

export function useIsTablet(): boolean {
  const md = useBreakpoint('md')
  const lg = useBreakpoint('lg')
  return md && !lg
}

export function useIsDesktop(): boolean {
  return useBreakpoint('lg')
}

export function useIsLargeDesktop(): boolean {
  return useBreakpoint('xl')
}

export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()

    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return size
}
