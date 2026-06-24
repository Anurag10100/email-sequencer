import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Workflow,
  FileText,
  Users,
  Activity,
  Inbox,
  BarChart3,
  Settings,
  Plus,
  Upload,
  Moon,
  Sun,
  RotateCcw,
  Search,
  CornerDownLeft,
} from 'lucide-react'
import { useUI, type View } from '../lib/ui'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { classNames } from '../lib/format'

interface Cmd {
  id: string
  label: string
  hint?: string
  icon: typeof Search
  group: string
  run: () => void
  keywords?: string
}

export function CommandPalette() {
  const { setView, runAction } = useUI()
  const { dispatch } = useStore()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const go = (v: View) => () => {
    setView(v)
    setOpen(false)
  }

  const commands: Cmd[] = useMemo(
    () => [
      { id: 'nav-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, group: 'Navigate', run: go('dashboard') },
      { id: 'nav-sequences', label: 'Go to Sequences', icon: Workflow, group: 'Navigate', run: go('sequences') },
      { id: 'nav-templates', label: 'Go to Templates', icon: FileText, group: 'Navigate', run: go('templates') },
      { id: 'nav-contacts', label: 'Go to Recipients', icon: Users, group: 'Navigate', run: go('contacts') },
      { id: 'nav-inbox', label: 'Go to Inbox', icon: Inbox, group: 'Navigate', run: go('inbox') },
      { id: 'nav-analytics', label: 'Go to Analytics', icon: BarChart3, group: 'Navigate', run: go('analytics') },
      { id: 'nav-activity', label: 'Go to Activity', icon: Activity, group: 'Navigate', run: go('activity') },
      { id: 'nav-settings', label: 'Go to Settings', icon: Settings, group: 'Navigate', run: go('settings') },
      {
        id: 'new-sequence',
        label: 'Create new sequence',
        icon: Plus,
        group: 'Actions',
        run: () => {
          runAction('sequences:new')
          setOpen(false)
        },
      },
      {
        id: 'new-template',
        label: 'Create new template',
        icon: Plus,
        group: 'Actions',
        run: () => {
          runAction('templates:new')
          setOpen(false)
        },
      },
      {
        id: 'add-recipient',
        label: 'Add a recipient',
        icon: Plus,
        group: 'Actions',
        run: () => {
          runAction('contacts:add')
          setOpen(false)
        },
      },
      {
        id: 'import-recipients',
        label: 'Import recipients from CSV',
        icon: Upload,
        group: 'Actions',
        run: () => {
          runAction('contacts:import')
          setOpen(false)
        },
      },
      {
        id: 'reset',
        label: 'Reset to imported data',
        icon: RotateCcw,
        group: 'Preferences',
        run: () => {
          if (confirm('Reset all data back to the imported sheet?')) {
            dispatch({ type: 'reset' })
            toast('Data reset', { desc: 'Restored the original imported sheet.' })
          }
          setOpen(false)
        },
      },
    ],
    [dispatch, runAction, toast],
  )

  const filtered = useMemo(() => {
    const n = q.toLowerCase().trim()
    if (!n) return commands
    return commands.filter((c) => (c.label + ' ' + c.group + ' ' + (c.keywords || '')).toLowerCase().includes(n))
  }, [q, commands])

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  if (!open) return null

  const groups = [...new Set(filtered.map((c) => c.group))]

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="animate-fade-up w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
          <Search size={17} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                filtered[active]?.run()
              }
            }}
            placeholder="Search commands…"
            className="h-12 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-slate-400">No matching commands</div>
          )}
          {groups.map((g) => (
            <div key={g} className="mb-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {g}
              </div>
              {filtered
                .filter((c) => c.group === g)
                .map((c) => {
                  const idx = filtered.indexOf(c)
                  const Icon = c.icon
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={c.run}
                      className={classNames(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm',
                        idx === active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      <Icon size={16} className={idx === active ? 'text-indigo-500' : 'text-slate-400'} />
                      <span className="flex-1">{c.label}</span>
                      {idx === active && <CornerDownLeft size={14} className="text-indigo-400" />}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
