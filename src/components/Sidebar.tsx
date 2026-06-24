import {
  LayoutDashboard,
  Workflow,
  FileText,
  Users,
  Activity,
  Inbox,
  BarChart3,
  Settings as SettingsIcon,
  Mail,
  RotateCcw,
  Command,
} from 'lucide-react'
import { classNames } from '../lib/format'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { useUI, type View } from '../lib/ui'
import { bouncedSet, stageOf } from '../lib/stats'
import { useMemo } from 'react'

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sequences', label: 'Sequences', icon: Workflow },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'contacts', label: 'Recipients', icon: Users },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar() {
  const { state, dispatch } = useStore()
  const { view, setView } = useUI()
  const { toast } = useToast()

  const replyCount = useMemo(() => {
    const b = bouncedSet(state)
    return state.contacts.filter((c) => stageOf(c, b) === 'replied').length
  }, [state])

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800/60 bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
          <Mail size={18} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Sequence</div>
          <div className="text-[11px] text-slate-400">Outreach Console</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        {NAV.map((n) => {
          const Icon = n.icon
          const active = view === n.id
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={classNames(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
              )}
            >
              <Icon size={17} className={active ? 'text-indigo-400' : ''} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.id === 'inbox' && replyCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-1.5 text-[10px] font-semibold text-emerald-400">
                  {replyCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-800/60 p-3">
        <div className="rounded-xl bg-slate-800/50 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Campaign</div>
          <div className="mt-1 text-xs font-medium leading-snug text-slate-200">{state.campaign.name}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">Partner · {state.campaign.partner}</div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-800/40 px-3 py-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Command size={12} /> Command menu
          </span>
          <kbd className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-medium text-slate-300">⌘K</kbd>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset all data back to the imported sheet?')) {
              dispatch({ type: 'reset' })
              toast('Data reset', { desc: 'Restored the original imported sheet.' })
            }
          }}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-800/60 hover:text-slate-300"
        >
          <RotateCcw size={12} /> Reset to imported data
        </button>
      </div>
    </aside>
  )
}
