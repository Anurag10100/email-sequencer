import {
  Send,
  MailOpen,
  MousePointerClick,
  Reply,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { useMemo } from 'react'
import { useStore } from '../lib/store'
import { funnelOf, stepPerformance, topEngaged, stageOf, bouncedSet, STAGE_META } from '../lib/stats'
import { pct, initials, avatarColor, timeAgo, classNames } from '../lib/format'
import { Card } from './ui'
import { useUI } from '../lib/ui'

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: typeof Send
  label: string
  value: string
  sub: string
  tint: string
}) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-opacity group-hover:opacity-20"
        style={{ background: tint }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <p className="tabular mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{sub}</p>
        </div>
        <div
          className="grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${tint}, ${tint}cc)` }}
        >
          <Icon size={18} />
        </div>
      </div>
    </Card>
  )
}

function ActivityChart({ data }: { data: { date: string; opens: number; clicks: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.opens + d.clicks))
  return (
    <div className="flex h-40 items-end gap-1.5">
      {data.map((d) => {
        const oh = (d.opens / max) * 100
        const ch = (d.clicks / max) * 100
        return (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-0.5">
            <div className="flex w-full flex-col-reverse items-stretch" style={{ height: 130 }}>
              <div
                className="rounded-b bg-indigo-500/80"
                style={{ height: `${oh}%`, minHeight: d.opens ? 2 : 0 }}
              />
              <div
                className="rounded-t bg-violet-400"
                style={{ height: `${ch}%`, minHeight: d.clicks ? 2 : 0 }}
              />
            </div>
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-lg transition group-hover:opacity-100">
              {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              <br />
              {d.opens} opens · {d.clicks} clicks
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Dashboard() {
  const { state } = useStore()
  const { setView } = useUI()
  const f = useMemo(() => funnelOf(state), [state])
  const bounced = useMemo(() => bouncedSet(state), [state])
  const steps = useMemo(
    () => (state.workflows[0] ? stepPerformance(state, state.workflows[0].name) : []),
    [state],
  )
  const engaged = useMemo(() => topEngaged(state, 6), [state])
  const recent = state.trackingLogs.slice(0, 8)
  const daily = state.activityDaily.slice(-30)

  const funnelRows = [
    { label: 'Sent', value: f.sent, color: '#64748b' },
    { label: 'Opened', value: f.opened, color: '#3b82f6' },
    { label: 'Clicked', value: f.clicked, color: '#8b5cf6' },
    { label: 'Replied', value: f.replied, color: '#10b981' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          icon={Send}
          label="Emails Sent"
          value={String(f.sent)}
          sub={`${state.contacts.length} recipients`}
          tint="#6366f1"
        />
        <Kpi
          icon={MailOpen}
          label="Open Rate"
          value={`${pct(f.opened, f.sent)}%`}
          sub={`${f.opened} unique opens`}
          tint="#3b82f6"
        />
        <Kpi
          icon={MousePointerClick}
          label="Click Rate"
          value={`${pct(f.clicked, f.sent)}%`}
          sub={`${f.clicked} clicked through`}
          tint="#8b5cf6"
        />
        <Kpi
          icon={Reply}
          label="Reply Rate"
          value={`${pct(f.replied, f.sent)}%`}
          sub={`${f.replied} replied`}
          tint="#10b981"
        />
        <Kpi
          icon={AlertTriangle}
          label="Bounced"
          value={String(state.bounced.length)}
          sub={`${pct(state.bounced.length, f.sent + state.bounced.length)}% of volume`}
          tint="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Funnel */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Engagement funnel</h2>
              <p className="text-sm text-slate-500">How recipients move through the sequence</p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {pct(f.opened, f.sent)}% open · {pct(f.clicked, f.sent)}% click
            </span>
          </div>
          <div className="space-y-3">
            {funnelRows.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <div className="w-16 text-sm font-medium text-slate-600">{r.label}</div>
                <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className="flex h-full items-center rounded-lg px-3 text-xs font-semibold text-white transition-all"
                    style={{
                      width: `${Math.max(6, pct(r.value, f.sent))}%`,
                      background: r.color,
                    }}
                  >
                    {r.value}
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-semibold text-slate-700">
                  {pct(r.value, f.sent)}%
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top engaged */}
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-900">Most engaged</h2>
          </div>
          <div className="space-y-1">
            {engaged.map((c) => (
              <div
                key={c.email}
                className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 hover:bg-slate-50"
              >
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: avatarColor(c.email) }}
                >
                  {initials(c.name || c.organization)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {c.name || c.email}
                  </div>
                  <div className="truncate text-xs text-slate-400">{c.organization || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-700">{c.opensCount} opens</div>
                  <div className="text-[11px] text-violet-500">{c.clicksCount} clicks</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Activity chart */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Activity over time</h2>
              <p className="text-sm text-slate-500">
                {state.logTotals.opens.toLocaleString()} opens ·{' '}
                {state.logTotals.clicks.toLocaleString()} clicks tracked
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-sm bg-indigo-500/80" /> Opens
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> Clicks
              </span>
            </div>
          </div>
          <ActivityChart data={daily} />
        </Card>

        {/* Recent activity */}
        <Card pad={false} className="flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Live activity</h2>
            <button
              onClick={() => setView('activity')}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="flex-1 divide-y divide-slate-50">
            {recent.map((l, i) => {
              const isClick = (l.action || '').toLowerCase().includes('click')
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  <span
                    className={classNames(
                      'grid h-7 w-7 shrink-0 place-items-center rounded-lg',
                      isClick ? 'bg-violet-50 text-violet-500' : 'bg-blue-50 text-blue-500',
                    )}
                  >
                    {isClick ? <MousePointerClick size={13} /> : <MailOpen size={13} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-slate-700">{l.email}</div>
                    <div className="text-[11px] text-slate-400">
                      {isClick ? 'Clicked a link' : 'Opened the email'}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(l.ts)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Sequence step performance */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sequence step performance</h2>
            <p className="text-sm text-slate-500">{state.workflows[0]?.name} cadence</p>
          </div>
          <button
            onClick={() => setView('sequences')}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Edit sequence <ArrowRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {steps.map((s) => (
            <div key={s.index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {s.type === 'first' ? 'Step 1' : `Step ${s.index + 1}`}
                </span>
                {s.delayDays > 0 && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                    +{s.delayDays}d
                  </span>
                )}
              </div>
              <div className="mt-1.5 truncate text-sm font-semibold text-slate-800">{s.label}</div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{s.sent}</div>
              <div className="text-[11px] text-slate-400">delivered</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
