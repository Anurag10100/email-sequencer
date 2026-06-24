export type StepType = 'first' | 'followup'

export interface SequenceStep {
  type: StepType
  label?: string
  template: string
  delayDays: number
}

export interface Workflow {
  name: string
  status: string
  steps: SequenceStep[]
}

export interface Template {
  name: string
  body: string | null
  subject: string | null
  sender: string | null
  attachments: string[]
}

export interface Contact {
  workflow: string | null
  scheduleDate: string | null
  title: string | null
  name: string | null
  designation: string | null
  organization: string | null
  email: string
  cc: string | null
  bcc: string | null
  sentAt: string | null
  openedAt: string | null
  clickedAt: string | null
  repliedAt: string | null
  threadId: string | null
  trackingId: string | null
  followUpCount: number
  fu1At: string | null
  fu2At: string | null
  fu3At: string | null
  fu4At: string | null
  opensCount: number
  clicksCount: number
}

export interface TrackingLog {
  ts: string
  email: string
  action: string | null
  url: string | null
  trackingId: string | null
}

export interface ActivityDay {
  date: string
  opens: number
  clicks: number
}

export interface Campaign {
  name: string
  host: string
  partner: string
  webAppUrl: string
}

export interface Settings {
  senderName: string
  senderEmail: string
  replyTo: string
  dailyCap: number
  sendWindowStart: string
  sendWindowEnd: string
  sendDays: string[]
  trackOpens: boolean
  trackClicks: boolean
  trackingDomain: string
  unsubscribeText: string
  timezone: string
}

export interface AppState {
  campaign: Campaign
  settings: Settings
  workflows: Workflow[]
  templates: Template[]
  contacts: Contact[]
  bounced: string[]
  trackingLogs: TrackingLog[]
  activityDaily: ActivityDay[]
  logTotals: { opens: number; clicks: number; total: number }
}

export type ContactStage =
  | 'bounced'
  | 'replied'
  | 'clicked'
  | 'opened'
  | 'sent'
  | 'queued'
