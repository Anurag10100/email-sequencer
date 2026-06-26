import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  RefreshCw,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Send,
  AlertTriangle,
  CheckCircle2,
  Server,
  ExternalLink,
  Inbox as InboxIcon,
} from 'lucide-react'
import { api, type Health, type Mailbox } from '../lib/api'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { classNames, avatarColor, initials } from '../lib/format'
import { Card, Button, Empty, Modal, Field, inputCls } from './ui'

function providerLabel(p: string): string {
  const u = p.toUpperCase()
  if (u.includes('GOOGLE') || u.includes('GMAIL')) return 'Gmail'
  if (u.includes('OUTLOOK') || u.includes('EXCHANGE')) return 'Outlook'
  if (u.includes('MAIL') || u.includes('IMAP')) return 'IMAP / SMTP'
  return p
}

function TestSendModal({ mailbox, onClose }: { mailbox: Mailbox; onClose: () => void }) {
  const { state } = useStore()
  const { toast } = useToast()
  const [to, setTo] = useState(state.settings.senderEmail || '')
  const [subject, setSubject] = useState('Test from Sequence ✓')
  const [body, setBody] = useState('<p>This is a test send from the Sequence console.</p>')
  const [sending, setSending] = useState(false)

  const send = async () => {
    setSending(true)
    const r = await api.send({ accountId: mailbox.id, to, subject, body })
    setSending(false)
    if (r.ok && r.dryRun) {
      toast('Logged (DRY-RUN)', { kind: 'info', desc: 'Safe mode is on — nothing was actually delivered.' })
    } else if (r.ok) {
      toast('Test email sent', { desc: `Delivered via ${mailbox.email}.` })
    } else {
      toast('Send failed', { kind: 'error', desc: r.error })
    }
    if (r.ok) onClose()
  }

  return (
    <Modal open onClose={onClose} title={`Send a test from ${mailbox.email}`}>
      <div className="space-y-4 p-5">
        <Field label="To">
          <input className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Field label="Subject">
          <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Body (HTML)">
          <textarea className={classNames(inputCls, 'font-mono text-xs')} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending || !to.trim()}>
            <Send size={14} /> {sending ? 'Sending…' : 'Send test'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function Mailboxes() {
  const { toast } = useToast()
  const [health, setHealth] = useState<Health | null>(null)
  const [accounts, setAccounts] = useState<Mailbox[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState<Mailbox | null>(null)
  const [reachable, setReachable] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const h = await api.health()
    setReachable(h.ok || h.error !== 'backend-unreachable')
    setHealth(h.ok ? h : null)
    if (h.ok && h.configured) {
      const a = await api.accounts()
      if (a.ok) setAccounts(a.accounts || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    // returning from the hosted-auth wizard
    const params = new URLSearchParams(window.location.search)
    if (params.get('inbox') === 'connected') {
      toast('Inbox connected', { desc: 'Your mailbox is now linked.' })
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(refresh, 800)
    }
  }, [refresh, toast])

  const connect = async () => {
    setConnecting(true)
    const r = await api.connectLink()
    setConnecting(false)
    if (r.ok && r.url) {
      window.open(r.url, '_blank', 'noopener')
      toast('Opening secure connect…', { desc: 'Authorize your inbox in the new tab, then return here.' })
    } else {
      toast('Could not start connection', { kind: 'error', desc: r.error || 'Unknown error' })
    }
  }

  // ---- backend not running ----
  if (!reachable) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Server size={18} />
          </div>
          <div className="text-sm">
            <h3 className="font-semibold text-slate-900">Backend not running</h3>
            <p className="mt-1 text-slate-500">
              Inbox connection needs the backend. Start it alongside the app:
            </p>
            <pre className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-200">
              cd ~/email-sequencer && npm run dev:full
            </pre>
            <Button className="mt-3" variant="outline" onClick={refresh}>
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* status banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          {health?.configured ? (
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck size={17} />
            </div>
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert size={17} />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-800">
              {health?.configured ? 'Unipile connected' : 'Unipile not configured'}
            </p>
            <p className="text-xs text-slate-400">
              {health?.configured
                ? 'Connect Gmail / Outlook inboxes to send outbound mail'
                : health?.reason || 'Add UNIPILE_DSN and UNIPILE_API_KEY to .env'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={classNames(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              health?.dryRun ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
            )}
          >
            {health?.dryRun ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            {health?.dryRun ? 'DRY-RUN (safe)' : 'LIVE sending'}
          </span>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button onClick={connect} disabled={connecting || !health?.configured}>
            <Plus size={15} /> {connecting ? 'Opening…' : 'Connect inbox'}
          </Button>
        </div>
      </div>

      {/* connected inboxes */}
      {accounts.length === 0 ? (
        <Card>
          <Empty
            icon={<InboxIcon size={20} />}
            title="No inboxes connected yet"
            hint={
              health?.configured
                ? 'Click “Connect inbox” to link a Gmail or Outlook account. You can connect several and rotate sends across them.'
                : 'Configure Unipile first, then connect an inbox.'
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((m) => {
            const ok = /ok|connected|active/i.test(m.status)
            return (
              <Card key={m.id} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ background: avatarColor(m.email) }}
                  >
                    {initials(m.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{m.email}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail size={11} /> {providerLabel(m.provider)}
                    </div>
                  </div>
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                    )}
                  >
                    <span className={classNames('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-rose-500')} />
                    {ok ? 'Healthy' : m.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-mono text-[10px] text-slate-300">{m.id.slice(0, 12)}…</span>
                  <Button size="sm" variant="subtle" onClick={() => setTesting(m)}>
                    <Send size={12} /> Send test
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* how it works */}
      <Card className="bg-gradient-to-br from-indigo-50/60 to-violet-50/60">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <ExternalLink size={16} />
          </div>
          <div className="text-sm">
            <h3 className="font-semibold text-slate-900">How connecting works</h3>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-600">
              <li>Click <b>Connect inbox</b> — a secure Unipile window opens.</li>
              <li>Sign in to Google / Microsoft and approve access.</li>
              <li>You're redirected back here and the inbox appears above.</li>
              <li>Repeat to add more inboxes — sequences rotate sends across them.</li>
            </ol>
            <p className="mt-2 text-xs text-slate-400">
              Sending stays in DRY-RUN until you flip <code>DRY_RUN=false</code> in <code>.env</code>.
            </p>
          </div>
        </div>
      </Card>

      {testing && <TestSendModal mailbox={testing} onClose={() => setTesting(null)} />}
    </div>
  )
}
