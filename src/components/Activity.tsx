import { useMemo, useState } from 'react'
import { MailOpen, MousePointerClick, AlertTriangle, Filter } from 'lucide-react'
import { useStore } from '../lib/store'
import { fmtDateTime, timeAgo, classNames, avatarColor, initials } from '../lib/format'
import { Card, Empty } from './ui'

type LogFilter = 'all' | 'open' | 'click'

export function Activity() {
  const { state } = useStore()
  const [filter, setFilter] = useState<LogFilter>('all')

  const nameByEmail = useMemo(() => {
    const m: Record<string, string> = {}
    for (const c of state.contacts) if (c.email) m[c.email.toLowerCase()] = c.name || ''
    return m
  }, [state.contacts])

  const logs = useMemo(() => {
    return state.trackingLogs.filter((l) => {
      const isClick = (l.action || '').toLowerCase().includes('click')
      if (filter === 'open') return !isClick
      if (filter === 'click') return isClick
      return true
    })
  }, [state.trackingLogs, filter])

  const tabs: { id: LogFilter; label: string }[] = [
    { id: 'all', label: 'All events' },
    { id: 'open', label: 'Opens' },
    { id: 'click', label: 'Clicks' },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tracking activity</h2>
            <p className="text-sm text-slate-500">
              {state.logTotals.total.toLocaleString()} total events tracked
            </p>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={classNames(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  filter === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[70vh] divide-y divide-slate-50 overflow-y-auto">
          {logs.map((l, i) => {
            const isClick = (l.action || '').toLowerCase().includes('click')
            const name = nameByEmail[l.email?.toLowerCase()] || ''
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: avatarColor(l.email) }}
                >
                  {initials(name || l.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {name || l.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {isClick ? (
                      <MousePointerClick size={12} className="text-violet-500" />
                    ) : (
                      <MailOpen size={12} className="text-blue-500" />
                    )}
                    {isClick ? 'Clicked a link' : 'Opened the email'}
                    {l.url && (
                      <span className="truncate text-slate-300"> · {l.url.slice(0, 40)}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-medium text-slate-500">{timeAgo(l.ts)}</div>
                  <div className="text-[11px] text-slate-400">{fmtDateTime(l.ts)}</div>
                </div>
              </div>
            )
          })}
          {logs.length === 0 && (
            <Empty icon={<Filter size={20} />} title="No events" hint="No tracking events for this filter." />
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-500">
              <AlertTriangle size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Bounced emails</h3>
              <p className="text-xs text-slate-400">{state.bounced.length} undeliverable addresses</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {state.bounced.map((e) => (
              <div
                key={e}
                className="truncate rounded-lg bg-rose-50/60 px-3 py-1.5 text-xs text-rose-700"
              >
                {e}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-900">Event breakdown</h3>
          <div className="mt-3 space-y-3">
            <BreakRow
              label="Opens"
              value={state.logTotals.opens}
              total={state.logTotals.total}
              color="#3b82f6"
            />
            <BreakRow
              label="Clicks"
              value={state.logTotals.clicks}
              total={state.logTotals.total}
              color="#8b5cf6"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

function BreakRow({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const w = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}
