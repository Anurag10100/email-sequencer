// Thin client for the Sequence backend (Unipile-backed inbox connection + send).

export interface Health {
  ok: boolean
  configured: boolean
  dryRun: boolean
  reason?: string | null
}
export interface Mailbox {
  id: string
  provider: string
  email: string
  status: string
}

async function call<T>(path: string, init?: RequestInit): Promise<T & { ok: boolean; error?: string }> {
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: data?.error || `HTTP ${res.status}`, ...(data as object) } as never
    return data
  } catch (e) {
    // backend not running / unreachable
    return { ok: false, error: 'backend-unreachable' } as never
  }
}

export const api = {
  health: () => call<Health>('/api/health'),
  accounts: () => call<{ accounts: Mailbox[] }>('/api/inbox/accounts'),
  connectLink: (providers?: string[]) =>
    call<{ url: string | null }>('/api/inbox/connect-link', {
      method: 'POST',
      body: JSON.stringify({ providers }),
    }),
  send: (payload: { accountId: string; to: string; subject: string; body: string; replyTo?: string }) =>
    call<{ dryRun?: boolean; id?: string }>('/api/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
