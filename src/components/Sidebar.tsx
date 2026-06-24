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
  ChevronsUpDown,
} from 'lucide-react'
import { classNames } from '../lib/format'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { useUI, type View } from '../lib/ui'
import { bouncedSet, stageOf } from '../lib/stats'
import { useMemo } from 'react'

const NAV: { id: View; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Overview' },
  { id: 'activity', label: 'Activity', icon: Activity, group: 'Overview' },
  { id: 'sequences', label: 'Sequences', icon: Workflow, group: 'Build' },
  { id: 'templates', label: 'Templates', icon: FileText, group: 'Build' },
  { id: 'contacts', label: 'Recipients', icon: Users, group: 'Build' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, group: 'Engage' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, group: 'Engage' },
]

export function Sidebar() {
  const { state, dispatch } = useStore()
  const { view, setView } = useUI()
  const { toast } = useToast()

  const replyCount = useMemo(() => {
    const b = bouncedSet(state)
    return state.contacts.filter((c) => stageOf(c, b) === 'replied').length
  }, [state])

  const groups = [...new Set(NAV.map((n) => n.group))]

  return (
    <aside className="relative flex w-64 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-gradient-to-b from-[#0b1020] via-[#0d1326] to-[#0a0f1f] text-slate-300">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl" />

      {/* workspace header */}
      <div className="relative px-3 pb-2 pt-4">
        <button className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-glow">
            <Mail size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">Sequence</div>
            <div className="truncate text-[11px] text-slate-400">Elets Technomedia</div>
          </div>
          <ChevronsUpDown size={14} className="text-slate-500" />
        </button>
      </div>

      <nav className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        {groups.map((g) => (
          <div key={g} className="mb-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {g}
            </div>
            {NAV.filter((n) => n.group === g).map((n) => {
              const Icon = n.icon
              const active = view === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={classNames(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500" />
                  )}
                  <Icon
                    size={17}
                    className={classNames(
                      'transition-colors',
                      active ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                  />
                  <span className="flex-1 text-left">{n.label}</span>
                  {n.id === 'inbox' && replyCount > 0 && (
                    <span className="rounded-full bg-emerald-400/20 px-1.5 text-[10px] font-semibold text-emerald-300">
                      {replyCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="relative border-t border-white/5 p-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Campaign
          </div>
          <div className="mt-1 text-xs font-medium leading-snug text-slate-200">{state.campaign.name}</div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
            <span className="text-[11px] text-slate-400">Live · {state.contacts.length} recipients</span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Command size={12} /> Command menu
          </span>
          <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 font-medium text-slate-300">⌘K</kbd>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset all data back to the imported sheet?')) {
              dispatch({ type: 'reset' })
              toast('Data reset', { desc: 'Restored the original imported sheet.' })
            }
          }}
          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300"
        >
          <RotateCcw size={12} /> Reset to imported data
        </button>
      </div>
    </aside>
  )
}
