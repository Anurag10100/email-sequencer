import { Bell, ExternalLink, Radio } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { ToastProvider } from './lib/toast'
import { SimulationProvider, useSimulation } from './lib/sim'
import { UIProvider, useUI, type View } from './lib/ui'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { Dashboard } from './components/Dashboard'
import { Sequences } from './components/Sequences'
import { Templates } from './components/Templates'
import { Contacts } from './components/Contacts'
import { Activity } from './components/Activity'
import { Settings } from './components/Settings'
import { Inbox } from './components/Inbox'
import { Analytics } from './components/Analytics'
import { Mailboxes } from './components/Mailboxes'

const TITLES: Record<View, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Campaign performance at a glance' },
  sequences: { title: 'Sequences', sub: 'Design and tune your email cadence' },
  templates: { title: 'Templates', sub: 'Reusable, personalized email content' },
  contacts: { title: 'Recipients', sub: 'Everyone in your outreach pipeline' },
  inbox: { title: 'Inbox', sub: 'Replies and high-intent recipients to action' },
  mailboxes: { title: 'Mailboxes', sub: 'Connect Gmail / Outlook inboxes to send outbound' },
  analytics: { title: 'Analytics', sub: 'Deep performance breakdowns' },
  activity: { title: 'Activity', sub: 'Real-time open & click tracking' },
  settings: { title: 'Settings', sub: 'Sender identity, schedule & deliverability' },
}

function LivePill() {
  const { runningWf, done, total } = useSimulation()
  const { setView } = useUI()
  if (!runningWf) return null
  return (
    <button
      onClick={() => setView('activity')}
      className="hidden items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex"
    >
      <Radio size={13} className="animate-pulse-dot" />
      Sending {runningWf} · {done}/{total}
    </button>
  )
}

function Topbar() {
  const { state } = useStore()
  const { view } = useUI()
  const t = TITLES[view]
  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200/60 px-6 py-3.5">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight text-slate-900">{t.title}</h1>
        <p className="text-[13px] text-slate-500">{t.sub}</p>
      </div>
      <div className="flex items-center gap-2.5">
        <LivePill />
        <a
          href={state.campaign.webAppUrl}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex"
        >
          <ExternalLink size={13} /> Sending engine
        </a>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-soft transition hover:bg-slate-50 hover:text-slate-700">
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-glow ring-2 ring-white">
          AG
        </div>
      </div>
    </header>
  )
}

function ViewRouter() {
  const { view } = useUI()
  switch (view) {
    case 'dashboard':
      return <Dashboard />
    case 'sequences':
      return <Sequences />
    case 'templates':
      return <Templates />
    case 'contacts':
      return <Contacts />
    case 'inbox':
      return <Inbox />
    case 'mailboxes':
      return <Mailboxes />
    case 'analytics':
      return <Analytics />
    case 'activity':
      return <Activity />
    case 'settings':
      return <Settings />
    default:
      return <Dashboard />
  }
}

function Shell() {
  const { view } = useUI()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div key={view} className="animate-fade-up mx-auto max-w-7xl">
            <ViewRouter />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}

export default function App() {
  return (
    <UIProvider>
      <ToastProvider>
        <StoreProvider>
          <SimulationProvider>
            <Shell />
          </SimulationProvider>
        </StoreProvider>
      </ToastProvider>
    </UIProvider>
  )
}
