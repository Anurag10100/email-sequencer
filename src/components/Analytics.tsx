import { useMemo, useState } from 'react'
import { TrendingDown, Clock4, Building2, Target } from 'lucide-react'
import { useStore } from '../lib/store'
import { funnelOf, stepPerformance } from '../lib/stats'
import { pct, classNames } from '../lib/format'
import { Card } from './ui'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function Heatmap({ logs }: { logs: { ts: string }[] }) {
  // 7 rows (days) x 24 cols (hours)
  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    let max = 0
    for (const l of logs) {
      const d = new Date(l.ts)
      if (isNaN(d.getTime())) continue
      const day = d.getDay()
      const hr = d.getHours()
      g[day][hr]++
      if (g[day][hr] > max) max = g[day][hr]
    }
    return { g, max: Math.max(1, max) }
  }, [logs])

  const color = (v: number) => {
    if (v === 0) return '#f1f5f9'
    const t = v / grid.max
    // indigo ramp
    const l = 92 - t * 55
    return `hsl(243 75% ${l}%)`
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex">
          <div className="w-9" />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-slate-400">
              {h % 3 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {grid.g.map((row, di) => (
          <div key={di} className="flex items-center">
            <div className="w-9 text-[10px] font-medium text-slate-400">{DOW[di]}</div>
            {row.map((v, hi) => (
              <div key={hi} className="flex-1 px-px py-px">
                <div
                  className="h-4 rounded-sm transition hover:ring-2 hover:ring-indigo-300"
                  style={{ background: color(v) }}
                  title={`${DOW[di]} ${hi}:00 — ${v} events`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Analytics() {
  const { state } = useStore()
  const [wfName, setWfName] = useState(state.workflows[0]?.name || '')
  const wf = state.workflows.find((w) => w.name === wfName) || state.workflows[0]

  const contacts = useMemo(
    () => (wf ? state.contacts.filter((c) => c.workflow === wf.name) : state.contacts),
    [state.contacts, wf],
  )
  const f = useMemo(() => funnelOf(state, contacts), [state, contacts])
  const steps = useMemo(() => (wf ? stepPerformance(state, wf.name) : []), [state, wf])

  const orgRows = useMemo(() => {
    const m = new Map<string, { org: string; n: number; opens: number; clicks: number; replied: number }>()
    for (const c of contacts) {
      const org = c.organization || '—'
      const cur = m.get(org) || { org, n: 0, opens: 0, clicks: 0, replied: 0 }
      cur.n++
      cur.opens += c.opensCount
      cur.clicks += c.clicksCount
      if (c.repliedAt) cur.replied++
      m.set(org, cur)
    }
    return [...m.values()].sort((a, b) => b.clicks + b.opens - (a.clicks + a.opens)).slice(0, 10)
  }, [contacts])

  const maxStep = Math.max(1, ...steps.map((s) => s.sent))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {state.workflows.map((w) => (
          <button
            key={w.name}
            onClick={() => setWfName(w.name)}
            className={classNames(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              w.name === wfName ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/60',
            )}
          >
            {w.name}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{contacts.length} recipients analyzed</span>
      </div>

      {/* headline metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Open rate', value: `${pct(f.opened, f.sent)}%`, tint: '#3b82f6' },
          { label: 'Click rate', value: `${pct(f.clicked, f.sent)}%`, tint: '#8b5cf6' },
          { label: 'Click-to-open', value: `${pct(f.clicked, f.opened)}%`, tint: '#0ea5e9' },
          { label: 'Reply rate', value: `${pct(f.replied, f.sent)}%`, tint: '#10b981' },
        ].map((k) => (
          <Card key={k.label}>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold" style={{ color: k.tint }}>
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* step drop-off */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-900">Step drop-off</h3>
          </div>
          <div className="space-y-3">
            {steps.map((s, i) => {
              const prev = i === 0 ? s.sent : steps[i - 1].sent
              const drop = prev ? Math.round(((prev - s.sent) / prev) * 100) : 0
              return (
                <div key={s.index}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{s.label}</span>
                    <span className="text-slate-400">
                      {s.sent} sent{i > 0 && drop > 0 && <span className="ml-1 text-rose-500">−{drop}%</span>}
                    </span>
                  </div>
                  <div className="h-7 overflow-hidden rounded-lg bg-slate-100">
                    <div
                      className="flex h-full items-center rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-2 text-[11px] font-semibold text-white"
                      style={{ width: `${Math.max(8, (s.sent / maxStep) * 100)}%` }}
                    >
                      {s.sent}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* send-time heatmap */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Clock4 size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900">Engagement by time</h3>
            <span className="ml-auto text-[11px] text-slate-400">when opens & clicks happen</span>
          </div>
          <Heatmap logs={state.trackingLogs} />
          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-slate-400">
            Less
            <span className="h-3 w-3 rounded-sm" style={{ background: '#f1f5f9' }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: 'hsl(243 75% 78%)' }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: 'hsl(243 75% 55%)' }} />
            <span className="h-3 w-3 rounded-sm" style={{ background: 'hsl(243 75% 37%)' }} />
            More
          </div>
        </Card>
      </div>

      {/* org engagement */}
      <Card pad={false}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Building2 size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">Top organizations by engagement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5">Organization</th>
                <th className="px-3 py-2.5 text-right">Recipients</th>
                <th className="px-3 py-2.5 text-right">Opens</th>
                <th className="px-3 py-2.5 text-right">Clicks</th>
                <th className="px-5 py-2.5 text-right">Replied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orgRows.map((r) => (
                <tr key={r.org} className="hover:bg-slate-50">
                  <td className="px-5 py-2.5 font-medium text-slate-700">{r.org}</td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{r.n}</td>
                  <td className="px-3 py-2.5 text-right text-slate-700">{r.opens}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-violet-600">{r.clicks}</td>
                  <td className="px-5 py-2.5 text-right">
                    {r.replied > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <Target size={11} /> {r.replied}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
