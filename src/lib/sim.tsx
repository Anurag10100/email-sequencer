import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useStore } from './store'
import { useToast } from './toast'
import type { AppState, Contact, TrackingLog, Workflow } from './types'

/* ---------- deterministic pseudo-randomness (stable per contact) ---------- */
function rand01(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

const P_OPEN = 0.82
const P_CLICK = 0.46
const P_REPLY = 0.09

const FU_FIELDS: (keyof Contact)[] = ['fu1At', 'fu2At', 'fu3At', 'fu4At']

export type Micro =
  | { kind: 'send'; step: number }
  | { kind: 'open' }
  | { kind: 'click' }
  | { kind: 'reply' }

/** What should happen next for this contact, or null when fully processed. */
export function nextMicro(c: Contact, numFollowups: number): Micro | null {
  if (!c.sentAt) return { kind: 'send', step: 0 }
  if (!c.openedAt && rand01(c.email + ':open') < P_OPEN) return { kind: 'open' }
  if (c.openedAt && !c.clickedAt && rand01(c.email + ':click') < P_CLICK) return { kind: 'click' }
  if (!c.repliedAt && c.followUpCount < numFollowups)
    return { kind: 'send', step: c.followUpCount + 1 }
  if (!c.repliedAt && (c.openedAt || c.clickedAt) && rand01(c.email + ':reply') < P_REPLY)
    return { kind: 'reply' }
  return null
}

function numFollowups(wf: Workflow): number {
  return wf.steps.filter((s) => s.type === 'followup').length
}

/** Count of contacts in a workflow that still have work to do. */
export function pendingCount(state: AppState, wfName: string): number {
  const wf = state.workflows.find((w) => w.name === wfName)
  if (!wf) return 0
  const n = numFollowups(wf)
  return state.contacts.filter((c) => c.workflow === wfName && nextMicro(c, n) !== null).length
}

function genId(seed: string): string {
  // stable-ish id without Math.random for the tracking id
  const a = rand01(seed + 'a').toString(36).slice(2, 8)
  const b = rand01(seed + 'b').toString(36).slice(2, 8)
  return `${a}-${b}`
}

function applyMicro(c: Contact, micro: Micro, now: string): { patch: Partial<Contact>; logs: TrackingLog[] } {
  const tid = c.trackingId || genId(c.email)
  switch (micro.kind) {
    case 'send':
      if (micro.step === 0) return { patch: { sentAt: now, trackingId: tid }, logs: [] }
      return { patch: { [FU_FIELDS[micro.step - 1]]: now, followUpCount: micro.step } as Partial<Contact>, logs: [] }
    case 'open':
      return {
        patch: { openedAt: c.openedAt || now, opensCount: c.opensCount + 1 },
        logs: [{ ts: now, email: c.email, action: 'Open', url: null, trackingId: tid }],
      }
    case 'click':
      return {
        patch: { clickedAt: c.clickedAt || now, clicksCount: c.clicksCount + 1 },
        logs: [{ ts: now, email: c.email, action: 'Click', url: 'https://worldaisummit.in', trackingId: tid }],
      }
    case 'reply':
      return { patch: { repliedAt: now }, logs: [] }
  }
}

/* ---------- synthetic test batch so any sequence can be demoed ---------- */
const FIRST = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Kabir', 'Ishaan', 'Saanvi', 'Reyansh', 'Myra', 'Arjun', 'Aadhya', 'Vihaan']
const LAST = ['Sharma', 'Patel', 'Nair', 'Reddy', 'Iyer', 'Mehta', 'Gupta', 'Rao', 'Bose', 'Khanna', 'Joshi', 'Verma']
const ORGS = ['NeuralEdge AI', 'Cognisys', 'DataForge', 'Lumen Labs', 'Synapse.io', 'Quantic', 'VectorMind', 'Helix AI', 'Northstar Tech', 'Aether Systems', 'Brightwave', 'Cortex Cloud']
const ROLES = ['VP Marketing', 'Founder', 'Head of Growth', 'CMO', 'Partnerships Lead', 'CEO', 'Brand Director']

export function makeTestBatch(wfName: string, n: number): Contact[] {
  const out: Contact[] = []
  for (let i = 0; i < n; i++) {
    const f = FIRST[i % FIRST.length]
    const l = LAST[(i * 7) % LAST.length]
    const org = ORGS[(i * 5) % ORGS.length]
    const slug = `${f}.${l}`.toLowerCase()
    const domain = org.replace(/[^a-z]/gi, '').toLowerCase().slice(0, 10) + '.ai'
    out.push({
      workflow: wfName,
      scheduleDate: null,
      title: null,
      name: `${f} ${l}`,
      designation: ROLES[(i * 3) % ROLES.length],
      organization: org,
      email: `${slug}.${i}@${domain}`,
      cc: null,
      bcc: null,
      sentAt: null,
      openedAt: null,
      clickedAt: null,
      repliedAt: null,
      threadId: null,
      trackingId: null,
      followUpCount: 0,
      fu1At: null,
      fu2At: null,
      fu3At: null,
      fu4At: null,
      opensCount: 0,
      clicksCount: 0,
    })
  }
  return out
}

/* ---------------------------- the engine context ---------------------------- */
interface SimCtx {
  runningWf: string | null
  done: number
  total: number
  launch: (wfName: string) => void
  stop: () => void
}

const Ctx = createContext<SimCtx | null>(null)
const TICK_MS = 420

export function SimulationProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const stateRef = useRef(state)
  stateRef.current = state

  const [runningWf, setRunningWf] = useState<string | null>(null)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setRunningWf(null)
  }, [])

  const launch = useCallback(
    (wfName: string) => {
      const wf = stateRef.current.workflows.find((w) => w.name === wfName)
      if (!wf) return
      const n = numFollowups(wf)
      const startPending = pendingCount(stateRef.current, wfName)
      if (startPending === 0) {
        toast('Nothing to send', { kind: 'info', desc: 'All recipients in this sequence are fully processed.' })
        return
      }
      if (timer.current) clearInterval(timer.current)
      setRunningWf(wfName)
      setDone(0)
      setTotal(startPending)
      toast('Sequence launched', { desc: `Simulating sends to ${startPending} recipient${startPending === 1 ? '' : 's'}…` })

      let processed = 0
      timer.current = setInterval(() => {
        const s = stateRef.current
        const contact = s.contacts.find((c) => c.workflow === wfName && nextMicro(c, n) !== null)
        if (!contact) {
          if (timer.current) clearInterval(timer.current)
          timer.current = null
          setRunningWf(null)
          toast('Simulation complete', { desc: `${wfName} finished — check the Dashboard & Inbox.` })
          return
        }
        const micro = nextMicro(contact, n)!
        const { patch, logs } = applyMicro(contact, micro, new Date().toISOString())
        dispatch({ type: 'simStep', email: contact.email, patch, logs })
        if (micro.kind === 'reply') {
          toast(`${contact.name || contact.email} replied 🎉`, { desc: contact.organization || undefined })
        }
        // progress tracks how many contacts have reached "done"
        const remaining = s.contacts.filter(
          (c) => c.workflow === wfName && c.email !== contact.email && nextMicro(c, n) !== null,
        ).length
        processed = Math.max(processed, total - remaining)
        setDone(Math.min(startPending, startPending - remaining))
      }, TICK_MS)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, toast],
  )

  useEffect(() => () => stop(), [stop])

  return <Ctx.Provider value={{ runningWf, done, total, launch, stop }}>{children}</Ctx.Provider>
}

export function useSimulation(): SimCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider')
  return ctx
}
