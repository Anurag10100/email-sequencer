import { useEffect, useMemo, useState } from 'react'
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  Mail,
  CornerDownRight,
  Users,
  CalendarRange,
  GripVertical,
} from 'lucide-react'
import { Rocket, Square, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { useUI } from '../lib/ui'
import { useSimulation, pendingCount, makeTestBatch } from '../lib/sim'
import { stepPerformance } from '../lib/stats'
import { classNames } from '../lib/format'
import { Button, Card, Field, inputCls, Modal } from './ui'
import type { Workflow, SequenceStep } from '../lib/types'

function SimButton({ wf }: { wf: Workflow }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const { runningWf, done, total, launch, stop } = useSimulation()
  const pending = pendingCount(state, wf.name)
  const isRunning = runningWf === wf.name

  if (isRunning) {
    return (
      <button
        onClick={stop}
        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
      >
        <Square size={13} className="fill-current" /> Stop · {done}/{total}
      </button>
    )
  }

  if (pending > 0) {
    return (
      <Button onClick={() => launch(wf.name)}>
        <Rocket size={14} /> Simulate sends ({pending})
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        dispatch({ type: 'addContacts', contacts: makeTestBatch(wf.name, 12) })
        toast('Test batch queued', { desc: '12 demo recipients added — launching simulation.' })
        setTimeout(() => launch(wf.name), 80)
      }}
    >
      <Sparkles size={14} /> Queue test batch & run
    </Button>
  )
}

function StatusToggle({ wf }: { wf: Workflow }) {
  const { dispatch } = useStore()
  const { toast } = useToast()
  const running = (wf.status || '').toLowerCase() === 'run'
  return (
    <button
      onClick={() => {
        dispatch({ type: 'setWorkflowStatus', name: wf.name, status: running ? 'Paused' : 'Run' })
        toast(running ? 'Sequence paused' : 'Sequence running', {
          kind: running ? 'info' : 'success',
          desc: `${wf.name} is now ${running ? 'paused' : 'live'}.`,
        })
      }}
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition',
        running
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      )}
    >
      {running ? <Play size={14} /> : <Pause size={14} />}
      {running ? 'Running' : 'Paused'}
    </button>
  )
}

function StepCard({
  step,
  index,
  sent,
  total,
  dayOffset,
  templates,
  onChange,
  onRemove,
  canRemove,
}: {
  step: SequenceStep
  index: number
  sent: number
  total: number
  dayOffset: number
  templates: string[]
  onChange: (patch: Partial<SequenceStep>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const isFirst = step.type === 'first'
  return (
    <div className="relative flex gap-4">
      {/* rail */}
      <div className="flex flex-col items-center">
        <div
          className={classNames(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm',
            isFirst ? 'bg-indigo-600' : 'bg-slate-700',
          )}
        >
          {isFirst ? <Mail size={17} /> : <CornerDownRight size={17} />}
        </div>
        <div className="my-1 w-px flex-1 bg-slate-200 last:hidden" />
      </div>

      {/* body */}
      <div className="mb-4 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-slate-300" />
              <span className="text-sm font-semibold text-slate-900">
                {isFirst ? 'Initial Email' : step.label || `Follow-up ${index}`}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                Day {dayOffset}
              </span>
            </div>
            <p className="mt-0.5 pl-6 text-xs text-slate-400">
              {isFirst
                ? 'Sent immediately when a recipient enters the sequence'
                : `Sent ${step.delayDays} day${step.delayDays === 1 ? '' : 's'} after the previous step (if no reply)`}
            </p>
          </div>
          {canRemove && (
            <button
              onClick={onRemove}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3 pl-6">
          <label className="block min-w-[150px] flex-1">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">Template</span>
            <select
              value={step.template}
              onChange={(e) => onChange({ template: e.target.value })}
              className={inputCls}
            >
              {templates.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {!isFirst && (
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-slate-500">Wait</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={step.delayDays}
                  onChange={(e) => onChange({ delayDays: Math.max(0, Number(e.target.value)) })}
                  className={classNames(inputCls, 'w-16 text-center')}
                />
                <span className="text-xs text-slate-500">days</span>
              </div>
            </label>
          )}
          <div className="ml-auto shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-center">
            <div className="text-sm font-semibold text-slate-800">{sent}</div>
            <div className="text-[10px] text-slate-400">of {total} sent</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sequences() {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const { action, clearAction } = useUI()
  const [selected, setSelected] = useState(state.workflows[0]?.name ?? '')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (action === 'sequences:new') {
      setShowNew(true)
      clearAction()
    }
  }, [action, clearAction])

  const wf = state.workflows.find((w) => w.name === selected) ?? state.workflows[0]
  const templateNames = state.templates.map((t) => t.name)
  const perf = useMemo(() => (wf ? stepPerformance(state, wf.name) : []), [state, wf])
  const recipients = useMemo(
    () => (wf ? state.contacts.filter((c) => c.workflow === wf.name).length : 0),
    [state, wf],
  )

  if (!wf) return null

  // cumulative day offsets
  let cum = 0
  const offsets = wf.steps.map((s) => {
    cum += s.type === 'first' ? 0 : s.delayDays
    return cum
  })
  const totalDuration = offsets[offsets.length - 1] || 0

  const update = (next: Workflow) => dispatch({ type: 'upsertWorkflow', workflow: next })

  const changeStep = (i: number, patch: Partial<SequenceStep>) => {
    const steps = wf.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    update({ ...wf, steps })
  }
  const removeStep = (i: number) => {
    update({ ...wf, steps: wf.steps.filter((_, idx) => idx !== i) })
  }
  const addStep = () => {
    const fuCount = wf.steps.filter((s) => s.type === 'followup').length
    const step: SequenceStep = {
      type: 'followup',
      label: `Follow-Up ${fuCount + 1}`,
      template: templateNames[Math.min(fuCount + 1, templateNames.length - 1)] || templateNames[0],
      delayDays: 2,
    }
    update({ ...wf, steps: [...wf.steps, step] })
    toast('Follow-up step added', { desc: `${wf.name} now has ${wf.steps.length + 1} steps.` })
  }

  const createWorkflow = () => {
    const name = newName.trim()
    if (!name) return
    const newWf: Workflow = {
      name,
      status: 'Paused',
      steps: [{ type: 'first', template: templateNames[0] || 'First_Email', delayDays: 0 }],
    }
    update(newWf)
    setSelected(name)
    setNewName('')
    setShowNew(false)
    toast('Sequence created', { desc: `“${name}” is ready — add your steps and recipients.` })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {state.workflows.map((w) => (
          <button
            key={w.name}
            onClick={() => setSelected(w.name)}
            className={classNames(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition',
              w.name === wf.name
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700',
            )}
          >
            {w.name}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setShowNew(true)}>
          <Plus size={14} /> New sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
        <Card pad={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{wf.name}</h2>
              <p className="text-sm text-slate-500">
                {wf.steps.length} steps · {recipients} recipients
              </p>
            </div>
            <div className="flex items-center gap-2">
              <SimButton wf={wf} />
              <StatusToggle wf={wf} />
            </div>
          </div>
          <div className="p-5">
            {wf.steps.map((s, i) => (
              <StepCard
                key={i}
                step={s}
                index={i}
                dayOffset={offsets[i]}
                sent={perf[i]?.sent ?? 0}
                total={recipients}
                templates={templateNames}
                onChange={(patch) => changeStep(i, patch)}
                onRemove={() => removeStep(i)}
                canRemove={s.type !== 'first'}
              />
            ))}
            <div className="pl-14">
              <Button variant="subtle" onClick={addStep}>
                <Plus size={15} /> Add follow-up step
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-900">Sequence summary</h3>
            <div className="mt-3 space-y-3">
              <SummaryRow icon={Users} label="Recipients" value={String(recipients)} />
              <SummaryRow
                icon={CalendarRange}
                label="Total duration"
                value={`${totalDuration} days`}
              />
              <SummaryRow
                icon={Mail}
                label="Touch points"
                value={`${wf.steps.length} emails`}
              />
              <SummaryRow
                icon={Clock}
                label="Follow-ups"
                value={String(wf.steps.filter((s) => s.type === 'followup').length)}
              />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50">
            <h3 className="text-sm font-semibold text-slate-900">Cadence preview</h3>
            <div className="mt-3 space-y-2">
              {wf.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="grid h-6 w-12 shrink-0 place-items-center rounded bg-white/70 font-semibold text-indigo-700">
                    D{offsets[i]}
                  </span>
                  <span className="truncate text-slate-600">{s.template}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New sequence">
        <div className="space-y-4 p-5">
          <Field label="Sequence name" hint="A short identifier, e.g. World_AI or BFSI_Outreach">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createWorkflow()}
              placeholder="e.g. Pharma_Q3"
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button onClick={createWorkflow} disabled={!newName.trim()}>
              Create sequence
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={15} className="text-slate-400" /> {label}
      </span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}
