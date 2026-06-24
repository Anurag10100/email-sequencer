import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import seed from '../data/seed.json'
import type { AppState, Contact, Settings, Template, TrackingLog, Workflow } from './types'
import { setAnchor } from './format'

const STORAGE_KEY = 'email-sequencer:v2'

const DEFAULT_SETTINGS: Settings = {
  senderName: 'Anurag Gupta',
  senderEmail: 'anurag.gupta@elets.in',
  replyTo: 'anurag.gupta@elets.in',
  dailyCap: 80,
  sendWindowStart: '09:30',
  sendWindowEnd: '18:00',
  sendDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  trackOpens: true,
  trackClicks: true,
  trackingDomain: 'track.eletsonline.com',
  unsubscribeText: 'You received this because Elets identified you as a potential partner. Unsubscribe.',
  timezone: 'Asia/Kolkata (IST)',
}

function loadSeed(): AppState {
  const base = JSON.parse(JSON.stringify(seed)) as AppState
  base.settings = { ...DEFAULT_SETTINGS }
  return base
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
      return parsed
    }
  } catch {
    /* ignore */
  }
  return loadSeed()
}

type Action =
  | { type: 'reset' }
  | { type: 'upsertWorkflow'; workflow: Workflow; originalName?: string }
  | { type: 'setWorkflowStatus'; name: string; status: string }
  | { type: 'upsertTemplate'; template: Template; originalName?: string }
  | { type: 'addContacts'; contacts: Contact[] }
  | { type: 'updateContact'; email: string; patch: Partial<Contact> }
  | { type: 'removeContact'; email: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'replaceState'; state: AppState }
  | { type: 'simStep'; email: string; patch: Partial<Contact>; logs: TrackingLog[] }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'reset':
      return loadSeed()
    case 'upsertWorkflow': {
      const exists = state.workflows.some(
        (w) => w.name === (action.originalName ?? action.workflow.name),
      )
      const workflows = exists
        ? state.workflows.map((w) =>
            w.name === (action.originalName ?? action.workflow.name) ? action.workflow : w,
          )
        : [...state.workflows, action.workflow]
      return { ...state, workflows }
    }
    case 'setWorkflowStatus':
      return {
        ...state,
        workflows: state.workflows.map((w) =>
          w.name === action.name ? { ...w, status: action.status } : w,
        ),
      }
    case 'upsertTemplate': {
      const key = action.originalName ?? action.template.name
      const exists = state.templates.some((t) => t.name === key)
      const templates = exists
        ? state.templates.map((t) => (t.name === key ? action.template : t))
        : [...state.templates, action.template]
      return { ...state, templates }
    }
    case 'addContacts':
      return { ...state, contacts: [...action.contacts, ...state.contacts] }
    case 'updateContact':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.email === action.email ? { ...c, ...action.patch } : c,
        ),
      }
    case 'removeContact':
      return { ...state, contacts: state.contacts.filter((c) => c.email !== action.email) }
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'replaceState':
      return action.state
    case 'simStep': {
      const contacts = state.contacts.map((c) =>
        c.email === action.email ? { ...c, ...action.patch } : c,
      )
      if (!action.logs.length) return { ...state, contacts }
      const addOpens = action.logs.filter((l) => (l.action || '').toLowerCase().includes('open')).length
      const addClicks = action.logs.filter((l) => (l.action || '').toLowerCase().includes('click')).length
      return {
        ...state,
        contacts,
        trackingLogs: [...action.logs, ...state.trackingLogs].slice(0, 600),
        logTotals: {
          opens: state.logTotals.opens + addOpens,
          clicks: state.logTotals.clicks + addClicks,
          total: state.logTotals.total + action.logs.length,
        },
      }
    }
    default:
      return state
  }
}

interface Ctx {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* quota — ignore */
    }
  }, [state])

  // anchor relative-time formatting to the latest event in the dataset
  useEffect(() => {
    const latest = state.trackingLogs.reduce<string | null>(
      (m, l) => (m && m > l.ts ? m : l.ts),
      null,
    )
    setAnchor(latest)
  }, [state.trackingLogs])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
