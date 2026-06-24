import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  X,
  Send,
  MailOpen,
  MousePointerClick,
  Reply,
  AlertTriangle,
  Building2,
  Mail,
  Trash2,
  CornerDownRight,
  Upload,
  FileSpreadsheet,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { useUI } from '../lib/ui'
import { bouncedSet, stageOf, STAGE_META } from '../lib/stats'
import {
  fmtDateTime,
  initials,
  avatarColor,
  classNames,
} from '../lib/format'
import { Button, Field, inputCls, Modal, Empty } from './ui'
import type { Contact, ContactStage } from '../lib/types'

function blankContact(workflow: string, over: Partial<Contact>): Contact {
  return {
    workflow,
    scheduleDate: null,
    title: null,
    name: null,
    designation: null,
    organization: null,
    email: '',
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
    ...over,
  }
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return []
  const split = (l: string) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
  const header = split(lines[0]).map((h) => h.toLowerCase())
  // if first row has no email-ish header, treat all rows as data with positional cols
  const hasHeader = header.some((h) => /email|name|org|company|designation|title/.test(h))
  const rows = hasHeader ? lines.slice(1) : lines
  const cols = hasHeader ? header : ['name', 'email', 'organization', 'designation']
  return rows.map((l) => {
    const vals = split(l)
    const o: Record<string, string> = {}
    cols.forEach((c, i) => (o[c] = vals[i] || ''))
    return o
  })
}

function pick(o: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const found = Object.keys(o).find((x) => x.includes(k))
    if (found && o[found]) return o[found]
  }
  return ''
}

const FILTERS: { id: ContactStage | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'opened', label: 'Opened' },
  { id: 'clicked', label: 'Clicked' },
  { id: 'replied', label: 'Replied' },
  { id: 'bounced', label: 'Bounced' },
]

function StagePill({ stage }: { stage: ContactStage }) {
  const m = STAGE_META[stage]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: m.color, background: m.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  )
}

function FollowupDots({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={classNames(
            'h-1.5 w-1.5 rounded-full',
            i <= count ? 'bg-indigo-500' : 'bg-slate-200',
          )}
          title={`Follow-up ${i} ${i <= count ? 'sent' : 'pending'}`}
        />
      ))}
    </div>
  )
}

function TimelineRow({
  icon: Icon,
  label,
  time,
  tint,
  done,
}: {
  icon: typeof Send
  label: string
  time: string | null
  tint: string
  done: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={classNames(
          'grid h-7 w-7 shrink-0 place-items-center rounded-full',
          done ? 'text-white' : 'bg-slate-100 text-slate-300',
        )}
        style={done ? { background: tint } : undefined}
      >
        <Icon size={13} />
      </div>
      <div className="flex-1 pb-3">
        <div className={classNames('text-sm font-medium', done ? 'text-slate-800' : 'text-slate-400')}>
          {label}
        </div>
        <div className="text-xs text-slate-400">{done ? fmtDateTime(time) : 'Pending'}</div>
      </div>
    </div>
  )
}

function ContactDrawer({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const bounced = bouncedSet(state)
  const stage = stageOf(contact, bounced)
  const fuTimes = [contact.fu1At, contact.fu2At, contact.fu3At, contact.fu4At]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-up relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div
              className="grid h-12 w-12 place-items-center rounded-full text-sm font-semibold text-white"
              style={{ background: avatarColor(contact.email) }}
            >
              {initials(contact.name || contact.organization)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {contact.name || contact.email}
              </h3>
              <p className="text-sm text-slate-500">{contact.designation || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <StagePill stage={stage} />
            <span className="text-xs text-slate-400">in {contact.workflow}</span>
          </div>

          <div className="mb-5 space-y-2 rounded-xl bg-slate-50 p-4">
            <InfoRow icon={Mail} value={contact.email} />
            <InfoRow icon={Building2} value={contact.organization || '—'} />
            <div className="flex gap-4 pt-1 text-xs">
              <span className="text-slate-500">
                <b className="text-slate-800">{contact.opensCount}</b> opens
              </span>
              <span className="text-slate-500">
                <b className="text-violet-600">{contact.clicksCount}</b> clicks
              </span>
              <span className="text-slate-500">
                <b className="text-slate-800">{contact.followUpCount}</b>/4 follow-ups
              </span>
            </div>
          </div>

          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Engagement timeline
          </h4>
          <div>
            <TimelineRow
              icon={Send}
              label="Initial email sent"
              time={contact.sentAt}
              tint="#64748b"
              done={!!contact.sentAt}
            />
            {fuTimes.map((t, i) =>
              t ? (
                <TimelineRow
                  key={i}
                  icon={CornerDownRight}
                  label={`Follow-up ${i + 1} sent`}
                  time={t}
                  tint="#6366f1"
                  done
                />
              ) : null,
            )}
            <TimelineRow
              icon={MailOpen}
              label="Opened email"
              time={contact.openedAt}
              tint="#3b82f6"
              done={!!contact.openedAt}
            />
            <TimelineRow
              icon={MousePointerClick}
              label="Clicked a link"
              time={contact.clickedAt}
              tint="#8b5cf6"
              done={!!contact.clickedAt}
            />
            <TimelineRow
              icon={Reply}
              label="Replied"
              time={contact.repliedAt}
              tint="#10b981"
              done={!!contact.repliedAt}
            />
            {stage === 'bounced' && (
              <TimelineRow
                icon={AlertTriangle}
                label="Email bounced"
                time={contact.sentAt}
                tint="#ef4444"
                done
              />
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 p-4">
          <Button
            variant="ghost"
            className="w-full text-rose-500 hover:bg-rose-50"
            onClick={() => {
              if (confirm(`Remove ${contact.name || contact.email}?`)) {
                dispatch({ type: 'removeContact', email: contact.email })
                toast('Recipient removed', { kind: 'info' })
                onClose()
              }
            }}
          >
            <Trash2 size={14} /> Remove recipient
          </Button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Icon size={14} className="shrink-0 text-slate-400" />
      <span className="truncate">{value}</span>
    </div>
  )
}

function AddRecipientModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: '',
    email: '',
    organization: '',
    designation: '',
    workflow: state.workflows[0]?.name || '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = /\S+@\S+\.\S+/.test(form.email)

  const add = () => {
    if (!valid) return
    const c = blankContact(form.workflow, {
      name: form.name || null,
      designation: form.designation || null,
      organization: form.organization || null,
      email: form.email.trim(),
    })
    dispatch({ type: 'addContacts', contacts: [c] })
    toast('Recipient added', { desc: `${form.name || form.email} joined ${form.workflow}.` })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Add recipient">
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name">
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Email *">
            <input
              className={inputCls}
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Organization">
            <input
              className={inputCls}
              value={form.organization}
              onChange={(e) => set('organization', e.target.value)}
            />
          </Field>
          <Field label="Designation">
            <input
              className={inputCls}
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Add to sequence">
          <select className={inputCls} value={form.workflow} onChange={(e) => set('workflow', e.target.value)}>
            {state.workflows.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} disabled={!valid}>
            <Plus size={14} /> Add to sequence
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [workflow, setWorkflow] = useState(state.workflows[0]?.name || '')

  const parsed = useMemo(() => parseCSV(text), [text])
  const valid = useMemo(
    () =>
      parsed
        .map((r) => ({
          email: pick(r, ['email', 'mail']),
          name: pick(r, ['name']),
          organization: pick(r, ['organization', 'organisation', 'company', 'org']),
          designation: pick(r, ['designation', 'title', 'role']),
        }))
        .filter((r) => /\S+@\S+\.\S+/.test(r.email)),
    [parsed],
  )

  const existing = useMemo(() => new Set(state.contacts.map((c) => c.email.toLowerCase())), [state.contacts])
  const fresh = valid.filter((r) => !existing.has(r.email.toLowerCase()))

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result || ''))
    reader.readAsText(file)
  }

  const doImport = () => {
    if (fresh.length === 0) return
    const contacts = fresh.map((r) =>
      blankContact(workflow, {
        email: r.email.trim(),
        name: r.name || null,
        organization: r.organization || null,
        designation: r.designation || null,
      }),
    )
    dispatch({ type: 'addContacts', contacts })
    toast('Recipients imported', { desc: `Added ${contacts.length} to ${workflow}.` })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Import recipients" wide>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Field label="Paste CSV" hint="Columns: name, email, organization, designation">
              <textarea
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'name,email,organization,designation\nPriya Sharma,priya@acme.ai,Acme AI,VP Marketing'}
                className={classNames(inputCls, 'font-mono text-xs')}
              />
            </Field>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-xs font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600">
              <Upload size={14} /> Or upload a .csv file
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>
          </div>
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Preview</span>
              <span className="text-xs text-slate-400">
                {fresh.length} new · {valid.length - fresh.length} duplicate
              </span>
            </div>
            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-2" style={{ maxHeight: 220 }}>
              {valid.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 py-8 text-center text-xs text-slate-400">
                  <FileSpreadsheet size={20} />
                  Rows with a valid email appear here
                </div>
              ) : (
                <div className="space-y-1">
                  {valid.slice(0, 50).map((r, i) => {
                    const dup = existing.has(r.email.toLowerCase())
                    return (
                      <div
                        key={i}
                        className={classNames(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                          dup ? 'bg-amber-50 text-amber-700' : 'bg-white text-slate-700',
                        )}
                      >
                        <span className="truncate font-medium">{r.name || r.email}</span>
                        <span className="truncate text-slate-400">{r.organization}</span>
                        {dup && <span className="ml-auto shrink-0 text-[10px]">dup</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Add to</span>
            <select value={workflow} onChange={(e) => setWorkflow(e.target.value)} className={classNames(inputCls, 'w-auto')}>
              {state.workflows.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={doImport} disabled={fresh.length === 0}>
              <Upload size={14} /> Import {fresh.length || ''}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function Contacts() {
  const { state } = useStore()
  const { action, clearAction } = useUI()
  const bounced = useMemo(() => bouncedSet(state), [state])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<ContactStage | 'all'>('all')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (action === 'contacts:add') {
      setAdding(true)
      clearAction()
    } else if (action === 'contacts:import') {
      setImporting(true)
      clearAction()
    }
  }, [action, clearAction])

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim()
    return state.contacts.filter((c) => {
      const stage = stageOf(c, bounced)
      if (filter !== 'all' && stage !== filter) return false
      if (!needle) return true
      return (
        (c.name || '').toLowerCase().includes(needle) ||
        (c.email || '').toLowerCase().includes(needle) ||
        (c.organization || '').toLowerCase().includes(needle)
      )
    })
  }, [state.contacts, bounced, q, filter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.contacts.length }
    for (const ct of state.contacts) {
      const s = stageOf(ct, bounced)
      c[s] = (c[s] || 0) + 1
    }
    return c
  }, [state.contacts, bounced])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, company…"
            className={classNames(inputCls, 'pl-9')}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImporting(true)}>
            <Upload size={15} /> Import CSV
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus size={15} /> Add recipient
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={classNames(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              filter === f.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {f.label}
            <span
              className={classNames(
                'rounded-full px-1.5 text-[10px]',
                filter === f.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500',
              )}
            >
              {counts[f.id] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Follow-ups</th>
                <th className="px-4 py-3 text-right">Opens</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => {
                const stage = stageOf(c, bounced)
                return (
                  <tr
                    key={c.email}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                          style={{ background: avatarColor(c.email) }}
                        >
                          {initials(c.name || c.organization)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-800">
                            {c.name || '—'}
                          </div>
                          <div className="truncate text-xs text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="truncate text-slate-700">{c.organization || '—'}</div>
                      <div className="truncate text-xs text-slate-400">{c.designation || ''}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <StagePill stage={stage} />
                    </td>
                    <td className="px-4 py-2.5">
                      <FollowupDots count={c.followUpCount} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-700">
                      {c.opensCount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-violet-600">
                      {c.clicksCount}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {fmtDateTime(c.sentAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <Empty icon={<Search size={20} />} title="No recipients match" hint="Try a different search or filter." />
        )}
      </div>
      <p className="px-1 text-xs text-slate-400">
        Showing {filtered.length} of {state.contacts.length} recipients
      </p>

      {selected && <ContactDrawer contact={selected} onClose={() => setSelected(null)} />}
      {adding && <AddRecipientModal onClose={() => setAdding(false)} />}
      {importing && <ImportModal onClose={() => setImporting(false)} />}
    </div>
  )
}
