import { useMemo, useState } from 'react'
import {
  User,
  Clock,
  Radar,
  ShieldCheck,
  Save,
  Gauge,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { Card, Button, Field, inputCls } from './ui'
import { classNames } from '../lib/format'
import type { Settings as SettingsType } from '../lib/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={classNames(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        on ? 'bg-indigo-600' : 'bg-slate-300',
      )}
    >
      <span
        className={classNames(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

/** A 0-100 deliverability heuristic from the configured settings. */
function deliverabilityScore(s: SettingsType): { score: number; checks: { ok: boolean; label: string }[] } {
  const checks = [
    { ok: s.dailyCap <= 120, label: `Daily cap ${s.dailyCap}/day is within a safe warm-up range` },
    { ok: s.trackingDomain.length > 3 && !s.trackingDomain.includes(' '), label: 'Custom tracking domain configured' },
    { ok: s.unsubscribeText.toLowerCase().includes('unsubscribe'), label: 'Unsubscribe link present in footer' },
    { ok: /\S+@\S+\.\S+/.test(s.senderEmail), label: 'Valid sender address' },
    { ok: s.sendDays.length <= 5, label: 'Sending limited to weekdays' },
    { ok: s.trackOpens || s.trackClicks, label: 'Engagement tracking enabled' },
  ]
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100)
  return { score, checks }
}

export function Settings() {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [draft, setDraft] = useState<SettingsType>({ ...state.settings })
  const set = <K extends keyof SettingsType>(k: K, v: SettingsType[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.settings)
  const { score, checks } = useMemo(() => deliverabilityScore(draft), [draft])
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  const save = () => {
    dispatch({ type: 'updateSettings', patch: draft })
    toast('Settings saved', { desc: 'Your sending configuration was updated.' })
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <User size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sender identity</h3>
              <p className="text-xs text-slate-400">How your emails appear in the inbox</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Sender name">
              <input className={inputCls} value={draft.senderName} onChange={(e) => set('senderName', e.target.value)} />
            </Field>
            <Field label="From address">
              <input className={inputCls} value={draft.senderEmail} onChange={(e) => set('senderEmail', e.target.value)} />
            </Field>
            <Field label="Reply-to">
              <input className={inputCls} value={draft.replyTo} onChange={(e) => set('replyTo', e.target.value)} />
            </Field>
            <Field label="Timezone">
              <input className={inputCls} value={draft.timezone} onChange={(e) => set('timezone', e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Clock size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sending schedule</h3>
              <p className="text-xs text-slate-400">Throttle and time your sends to protect deliverability</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Daily send cap" hint="Emails per day, per sequence">
              <input
                type="number"
                min={1}
                className={inputCls}
                value={draft.dailyCap}
                onChange={(e) => set('dailyCap', Math.max(1, Number(e.target.value)))}
              />
            </Field>
            <Field label="Window start">
              <input type="time" className={inputCls} value={draft.sendWindowStart} onChange={(e) => set('sendWindowStart', e.target.value)} />
            </Field>
            <Field label="Window end">
              <input type="time" className={inputCls} value={draft.sendWindowEnd} onChange={(e) => set('sendWindowEnd', e.target.value)} />
            </Field>
          </div>
          <div className="mt-3">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Sending days</span>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const on = draft.sendDays.includes(d)
                return (
                  <button
                    key={d}
                    onClick={() =>
                      set('sendDays', on ? draft.sendDays.filter((x) => x !== d) : [...draft.sendDays, d])
                    }
                    className={classNames(
                      'h-9 w-12 rounded-lg text-xs font-medium transition',
                      on ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    )}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600">
              <Radar size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Tracking</h3>
              <p className="text-xs text-slate-400">Open and click measurement</p>
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
              <span className="text-sm text-slate-700">Track opens (pixel)</span>
              <Toggle on={draft.trackOpens} onChange={(v) => set('trackOpens', v)} />
            </label>
            <label className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
              <span className="text-sm text-slate-700">Track link clicks</span>
              <Toggle on={draft.trackClicks} onChange={(v) => set('trackClicks', v)} />
            </label>
            <Field label="Tracking domain" hint="A custom domain improves inbox placement">
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className={classNames(inputCls, 'pl-9')}
                  value={draft.trackingDomain}
                  onChange={(e) => set('trackingDomain', e.target.value)}
                />
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck size={17} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Compliance</h3>
              <p className="text-xs text-slate-400">Unsubscribe footer appended to every email</p>
            </div>
          </div>
          <Field label="Unsubscribe footer text">
            <textarea
              rows={3}
              className={inputCls}
              value={draft.unsubscribeText}
              onChange={(e) => set('unsubscribeText', e.target.value)}
            />
          </Field>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Deliverability</h3>
          </div>
          <div className="my-4 flex flex-col items-center">
            <div className="relative grid h-28 w-28 place-items-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 264} 264`}
                />
              </svg>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{score}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">score</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {c.ok ? (
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                )}
                <span className={c.ok ? 'text-slate-600' : 'text-slate-500'}>{c.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Button onClick={save} disabled={!dirty} className="w-full">
          <Save size={15} /> {dirty ? 'Save changes' : 'All changes saved'}
        </Button>
      </div>
    </div>
  )
}
