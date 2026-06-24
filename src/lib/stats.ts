import type { AppState, Contact, ContactStage } from './types'

export function bouncedSet(state: AppState): Set<string> {
  return new Set(state.bounced.map((e) => (e || '').toLowerCase().trim()))
}

export function stageOf(c: Contact, bounced: Set<string>): ContactStage {
  if (c.email && bounced.has(c.email.toLowerCase().trim())) return 'bounced'
  if (c.repliedAt) return 'replied'
  if (c.clickedAt) return 'clicked'
  if (c.openedAt) return 'opened'
  if (c.sentAt) return 'sent'
  return 'queued'
}

export interface Funnel {
  total: number
  sent: number
  opened: number
  clicked: number
  replied: number
  bounced: number
}

export function funnelOf(state: AppState, contacts?: Contact[]): Funnel {
  const bounced = bouncedSet(state)
  const list = contacts ?? state.contacts
  let sent = 0,
    opened = 0,
    clicked = 0,
    replied = 0,
    bouncedN = 0
  for (const c of list) {
    if (c.sentAt) sent++
    if (c.openedAt) opened++
    if (c.clickedAt) clicked++
    if (c.repliedAt) replied++
    if (c.email && bounced.has(c.email.toLowerCase().trim())) bouncedN++
  }
  return { total: list.length, sent, opened, clicked, replied, bounced: bouncedN }
}

export interface StepPerf {
  index: number
  label: string
  template: string
  delayDays: number
  type: string
  sent: number
}

/** How many contacts have reached each step of a workflow. */
export function stepPerformance(state: AppState, workflowName: string): StepPerf[] {
  const wf = state.workflows.find((w) => w.name === workflowName)
  if (!wf) return []
  const list = state.contacts.filter((c) => c.workflow === workflowName)
  const fuAt = (c: Contact, i: number) =>
    [c.fu1At, c.fu2At, c.fu3At, c.fu4At][i] || (c.followUpCount >= i + 1 ? c.sentAt : null)

  return wf.steps.map((s, i) => {
    let sent = 0
    if (s.type === 'first') {
      sent = list.filter((c) => c.sentAt).length
    } else {
      // followup index = i-1
      const fi = i - 1
      sent = list.filter((c) => fuAt(c, fi)).length
    }
    return {
      index: i,
      label: s.type === 'first' ? 'Initial Email' : s.label || `Follow-up ${i}`,
      template: s.template,
      delayDays: s.delayDays,
      type: s.type,
      sent,
    }
  })
}

/** Engagement leaderboard — most active recipients by opens+clicks. */
export function topEngaged(state: AppState, n = 8): Contact[] {
  return [...state.contacts]
    .sort(
      (a, b) =>
        b.opensCount + b.clicksCount * 3 - (a.opensCount + a.clicksCount * 3),
    )
    .slice(0, n)
}

export const STAGE_META: Record<
  ContactStage,
  { label: string; color: string; bg: string; dot: string }
> = {
  replied: { label: 'Replied', color: '#047857', bg: '#ecfdf5', dot: '#10b981' },
  clicked: { label: 'Clicked', color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  opened: { label: 'Opened', color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  sent: { label: 'Sent', color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' },
  queued: { label: 'Queued', color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
  bounced: { label: 'Bounced', color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
}
