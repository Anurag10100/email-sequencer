// Minimal backend for Sequence — connects Gmail/Outlook inboxes via Unipile's
// hosted-auth wizard and sends outbound mail. Sends respect DRY_RUN.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { UnipileClient } from 'unipile-node-sdk'

const PORT = process.env.PORT || 3001
const DSN = process.env.UNIPILE_DSN || ''
const API_KEY = process.env.UNIPILE_API_KEY || ''
const DRY_RUN = String(process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5176'

const dsnValid = /^[a-z0-9.-]+:\d+$/i.test(DSN) && !/x{2,}/i.test(DSN)
const configured = Boolean(DSN && API_KEY && dsnValid)
const reason = !DSN || !API_KEY
  ? 'Set UNIPILE_DSN and UNIPILE_API_KEY in .env'
  : !dsnValid
    ? 'UNIPILE_DSN looks like a placeholder — paste your real DSN (e.g. api8.unipile.com:13841) from dashboard.unipile.com'
    : null

let _client = null
function client() {
  if (!configured) throw new Error(reason || 'Unipile is not configured')
  if (!_client) _client = new UnipileClient(`https://${DSN}`, API_KEY)
  return _client
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    const detail = err?.body?.detail || err?.body?.title || err?.message || String(err)
    console.error('[api error]', detail)
    res.status(err?.status || 500).json({ ok: false, error: detail })
  })

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured, dryRun: DRY_RUN, reason })
})

// Generate a hosted-auth wizard link the user opens to connect an inbox.
app.post(
  '/api/inbox/connect-link',
  wrap(async (req, res) => {
    const providers = req.body?.providers || ['GOOGLE', 'OUTLOOK', 'MAIL']
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
    const result = await client().account.createHostedAuthLink({
      type: 'create',
      providers,
      api_url: `https://${DSN}`,
      expiresOn,
      success_redirect_url: `${FRONTEND_URL}/?inbox=connected`,
      failure_redirect_url: `${FRONTEND_URL}/?inbox=failed`,
      notify_url: `${FRONTEND_URL.replace(/:\d+$/, `:${PORT}`)}/api/inbox/notify`,
    })
    res.json({ ok: true, url: result?.url || result?.link || null })
  }),
)

// Unipile calls this when an account finishes connecting (best-effort; localhost
// may not be reachable from Unipile — the UI also polls /accounts).
app.post('/api/inbox/notify', (req, res) => {
  console.log('[unipile notify]', JSON.stringify(req.body || {}))
  res.json({ ok: true })
})

// List connected inboxes (email accounts only).
app.get(
  '/api/inbox/accounts',
  wrap(async (_req, res) => {
    const raw = await client().request.send({ path: ['accounts'], method: 'GET' })
    const items = raw?.items ?? raw?.data ?? []
    const accounts = items
      .map((a) => {
        const type = a.type ?? a.provider ?? 'UNKNOWN'
        const mail =
          a.name ??
          a.connection_params?.mail?.username ??
          a.connection_params?.im?.username ??
          a.username ??
          '—'
        const status = Array.isArray(a.sources)
          ? a.sources.map((s) => s.status).join(',')
          : a.status ?? 'OK'
        return { id: a.id, provider: type, email: mail, status }
      })
      .filter((a) => /GOOGLE|OUTLOOK|MAIL|GMAIL|IMAP|EXCHANGE/i.test(a.provider))
    res.json({ ok: true, accounts })
  }),
)

// Send one email through a connected inbox. DRY_RUN logs instead of delivering.
app.post(
  '/api/send',
  wrap(async (req, res) => {
    const { accountId, to, subject, body, replyTo } = req.body || {}
    if (!accountId || !to || !body) {
      return res.status(400).json({ ok: false, error: 'accountId, to and body are required' })
    }
    if (DRY_RUN) {
      console.log(`[DRY_RUN] email → ${to} | subj: "${subject || '(none)'}"`)
      return res.json({ ok: true, dryRun: true })
    }
    const result = await client().email.send({
      account_id: accountId,
      to: [{ identifier: to }],
      subject: subject || '',
      body,
      ...(replyTo ? { reply_to: replyTo } : {}),
    })
    res.json({ ok: true, dryRun: false, id: result?.id })
  }),
)

app.listen(PORT, () => {
  console.log(`\n  Sequence backend  ·  http://localhost:${PORT}`)
  console.log(`  Unipile: ${configured ? 'configured' : 'NOT configured (set .env)'}`)
  console.log(`  Sending: ${DRY_RUN ? 'DRY_RUN (safe — logs only)' : 'LIVE'}\n`)
})
