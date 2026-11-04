import { useCallback, useEffect, useSyncExternalStore } from 'react'

type Pref = 'light' | 'dark' | null
const KEY = 'kaagada-theme'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function readPref(): Pref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function resolved(): 'light' | 'dark' {
  const p = readPref()
  return p ?? (mq().matches ? 'dark' : 'light')
}

function apply() {
  const dark = resolved() === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const snapshot = () => `${resolved()}|${readPref() ?? 'system'}`

export function useTheme() {
  const snap = useSyncExternalStore(subscribe, snapshot)
  const [theme, pref] = snap.split('|') as ['light' | 'dark', 'light' | 'dark' | 'system']

  useEffect(() => {
    const m = mq()
    const onChange = () => apply()
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next = resolved() === 'dark' ? 'light' : 'dark'
    try {
      // Back to "follow the OS" if the toggle lands on what the OS already wants.
      if ((mq().matches ? 'dark' : 'light') === next) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      /* private mode: still flip for this page */
      document.documentElement.classList.toggle('dark', next === 'dark')
    }
    apply()
  }, [])

  const followSystem = useCallback(() => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    apply()
  }, [])

  return { theme, pref, toggle, followSystem }
}
