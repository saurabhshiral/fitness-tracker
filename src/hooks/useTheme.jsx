import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const KEY = 'fitness_theme'

export const THEME_OPTIONS = [
  { value: 'light',  label: 'Day',    icon: 'sun'     },
  { value: 'dark',   label: 'Night',  icon: 'moon'    },
  { value: 'system', label: 'Auto',   icon: 'monitor' },
]

// Must stay in sync with --c-slate-900 in index.css and the boot script in
// index.html — these drive the browser chrome / status bar colour.
export const BG = { light: '#F7F2E9', dark: '#17150F' }

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || 'system' } catch { return 'system' }
}

function prefersLight() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
}

export function resolveTheme(theme) {
  return theme === 'system' ? (prefersLight() ? 'light' : 'dark') : theme
}

/** Flips the class on <html> and repoints the meta theme-color. */
export function applyTheme(theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle('light', resolved === 'light')
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', BG[resolved])
  return resolved
}

const ThemeCtx = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(read)
  const [resolved, setResolved] = useState(() => resolveTheme(read()))

  const setTheme = useCallback(next => {
    setThemeState(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }, [])

  useEffect(() => { setResolved(applyTheme(theme)) }, [theme])

  // Track the OS setting live, but only while the user is on "Auto"
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setResolved(applyTheme('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/** Resolves a palette token to a concrete rgb() string.
 *  Needed for canvas-based output (Chart.js) which can't read CSS classes. */
export function paletteColor(token, alpha) {
  if (typeof window === 'undefined') return '#888888'
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--c-${token}`).trim()
  if (!raw) return '#888888'
  return alpha == null ? `rgb(${raw})` : `rgb(${raw} / ${alpha})`
}
