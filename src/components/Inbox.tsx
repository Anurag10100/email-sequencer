import { useMemo, useState } from 'react'
import {
  Reply,
  MousePointerClick,
  MailOpen,
  Send,
  Sparkles,
  Building2,
  Inbox as InboxIcon,
  Flame,
  CheckCheck,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { bouncedSet, stageOf } from '../lib/stats'
import { fmtDateTime, timeAgo, initials, avatarColor, classNames } from '../lib/format'
import { Card, Empty, Button } from './ui'
import type { Contact } from '../lib/types'

type Tab = 'replied' | 'clicked' | 'opened'

const TABS: { id: Tab; label: string; icon: typeof Reply; color: string }[] = [
  { id: 'replied', label: 'Replies', icon: Reply, color: '#10b981' },
  { id: 'clicked', label: 'Hot leads', icon: Flame, color: '#8b5cf6' },
  { id: 'opened', label: 'Opened', icon: MailOpen, color: '#3b82f6' },
]

function Thread({ contact, wfTemplates }: { contact: Contact; wfTemplates: string[] }) {
  const { dispatch } = useStore()
  const { toast } = useToast()
  const [reply, setReply] = useState('')

  const sentSteps = [
    { label: wfTemplates[0] || 'Initial Email', at: contact.sentAt },
    { label: wfTemplates[1] || 'Follow-up 1', at: contact.fu1At },
    { label: wfTemplates[2] || 'Follow-up 2', at: contact.fu2At },
    { label: wfTemplates[3] || 'Follow-up 3', at: contact.fu3At },
    { label: wfTemplates[4] || 'Follow-up 4', at: contact.fu4At },
  ].filter((s) => s.at)

  const send = () => {
    if (!reply.trim()) return
    dispatch({ type: 'updateContact', email: contact.email, patch: { repliedAt: new Date().toISOString() } })
    toast('Reply sent', { desc: `Your message to ${contact.name || contact.email} was queued.` })
    setReply('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4">
        <div
          className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ background: avatarColor(contact.email) }}
        >
          {initials(contact.name || contact.organization)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900">{contact.name || contact.email}</div>
          <div className="flex items-center gap-1.5 truncate text-xs text-slate-400">
            <Building2 size={11} /> {contact.organization || '—'}
            {contact.designation ? ` · ${contact.designation}` : ''}
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>{contact.opensCount} opens</div>
          <div className="text-violet-500">{contact.clicksCount} clicks</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4">
        {sentSteps.map((s, i) => (
          <div key={i} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm text-white shadow-sm">
              <div className="text-[11px] font-medium text-indigo-200">{s.label}</div>
              <div className="mt-0.5">Sent the “{s.label}” email in this sequence.</div>
              <div className="mt-1 text-right text-[10px] text-indigo-200">{fmtDateTime(s.at)}</div>
            </div>
          </div>
        ))}

        {contact.openedAt && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <MailOpen size={12} className="text-blue-500" /> Opened · {fmtDateTime(contact.openedAt)}
          </div>
        )}
        {contact.clickedAt && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <MousePointerClick size={12} className="text-violet-500" /> Clicked a link · {fmtDateTime(contact.clickedAt)}
          </div>
        )}
        {contact.repliedAt && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 shadow-sm">
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <Reply size={11} /> Replied
              </div>
              <div className="mt-0.5">This recipient replied to your sequence.</div>
              <div className="mt-1 text-[10px] text-emerald-500">{fmtDateTime(contact.repliedAt)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            placeholder={`Reply to ${contact.name || 'recipient'}…`}
            className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <Button onClick={send} disabled={!reply.trim()}>
            <Send size={14} /> Send
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Inbox() {
  const { state } = useStore()
  const bounced = useMemo(() => bouncedSet(state), [state])
  const [tab, setTab] = useState<Tab>('replied')

  const buckets = useMemo(() => {
    const b: Record<Tab, Contact[]> = { replied: [], clicked: [], opened: [] }
    for (const c of state.contacts) {
      const s = stageOf(c, bounced)
      if (s === 'replied') b.replied.push(c)
      else if (s === 'clicked') b.clicked.push(c)
      else if (s === 'opened') b.opened.push(c)
    }
    b.clicked.sort((a, c) => c.clicksCount - a.clicksCount)
    b.opened.sort((a, c) => c.opensCount - a.opensCount)
    return b
  }, [state.contacts, bounced])

  const list = buckets[tab]
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const selected = list.find((c) => c.email === selectedEmail) || list[0] || null

  const wfTemplates = useMemo(() => {
    const wf = state.workflows.find((w) => w.name === (selected?.workflow || '')) || state.workflows[0]
    return wf ? wf.steps.map((s) => s.template) : []
  }, [state.workflows, selected])

  return (
    <Card pad={false} className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]" style={{ height: '72vh' }}>
        {/* list */}
        <div className="flex flex-col border-r border-slate-100">
          <div className="flex gap-1 border-b border-slate-100 p-2">
            {TABS.map((t) => {
              const Icon = t.icon
              const count = buckets[t.id].length
              const on = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id)
                    setSelectedEmail(null)
                  }}
                  className={classNames(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition',
                    on ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100',
                  )}
                >
                  <Icon size={13} style={on ? {} : { color: t.color }} />
                  {t.label}
                  <span className={classNames('rounded-full px-1.5 text-[10px]', on ? 'bg-white/20' : 'bg-slate-100')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {list.length === 0 && (
              <Empty icon={<InboxIcon size={20} />} title="Nothing here yet" hint="No recipients in this bucket." />
            )}
            {list.map((c) => {
              const on = selected?.email === c.email
              const last = c.repliedAt || c.clickedAt || c.openedAt || c.sentAt
              return (
                <button
                  key={c.email}
                  onClick={() => setSelectedEmail(c.email)}
                  className={classNames(
                    'flex w-full items-start gap-2.5 border-b border-slate-50 px-3 py-3 text-left transition',
                    on ? 'bg-indigo-50/60' : 'hover:bg-slate-50',
                  )}
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: avatarColor(c.email) }}
                  >
                    {initials(c.name || c.organization)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-800">{c.name || c.email}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(last)}</span>
                    </div>
                    <div className="truncate text-xs text-slate-400">{c.organization || c.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                      {tab === 'replied' ? (
                        <CheckCheck size={11} className="text-emerald-500" />
                      ) : tab === 'clicked' ? (
                        <Sparkles size={11} className="text-violet-500" />
                      ) : (
                        <MailOpen size={11} className="text-blue-500" />
                      )}
                      {tab === 'replied' ? 'Replied to sequence' : tab === 'clicked' ? `${c.clicksCount} link clicks` : `${c.opensCount} opens`}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* thread */}
        {selected ? (
          <Thread contact={selected} wfTemplates={wfTemplates} />
        ) : (
          <Empty icon={<InboxIcon size={20} />} title="Select a conversation" />
        )}
      </div>
    </Card>
  )
}
