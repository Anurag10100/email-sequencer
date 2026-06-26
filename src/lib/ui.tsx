import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type View =
  | 'dashboard'
  | 'sequences'
  | 'templates'
  | 'contacts'
  | 'inbox'
  | 'mailboxes'
  | 'analytics'
  | 'activity'
  | 'settings'

type Theme = 'light' | 'dark'

interface UICtx {
  view: View
  setView: (v: View) => void
  /** cross-view intent, e.g. "sequences:new", "contacts:add", "contacts:import" */
  action: string | null
  runAction: (a: string) => void
  clearAction: () => void
  theme: Theme
  toggleTheme: () => void
}

const Ctx = createContext<UICtx | null>(null)
const THEME_KEY = 'email-sequencer:theme'

export function UIProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('dashboard')
  const [action, setAction] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as Theme) || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const runAction = useCallback((a: string) => {
    const [v] = a.split(':')
    setView(v as View)
    setAction(a)
  }, [])

  const clearAction = useCallback(() => setAction(null), [])
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])

  return (
    <Ctx.Provider value={{ view, setView, action, runAction, clearAction, theme, toggleTheme }}>
      {children}
    </Ctx.Provider>
  )
}

export function useUI(): UICtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
