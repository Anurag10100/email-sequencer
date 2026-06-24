import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FileText,
  Paperclip,
  ExternalLink,
  Code2,
  Eye,
  Plus,
  Save,
  Braces,
  Copy,
  Pencil,
  Layers,
  Mail,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import { useUI } from '../lib/ui'
import { classNames, avatarColor, initials } from '../lib/format'
import { Button, Card, Field, inputCls, Modal } from './ui'
import type { Template } from '../lib/types'

const MERGE_VARS = ['{Name}', '{Organization}', '{Designation}', '{Title}', '{Email}']
const SAMPLE: Record<string, string> = {
  Name: 'Priya Sharma',
  Organization: 'Acme AI',
  Designation: 'VP Marketing',
  Title: 'Ms.',
  Email: 'priya@acme.ai',
}

function extractVars(...texts: (string | null | undefined)[]): string[] {
  const set = new Set<string>()
  for (const t of texts) {
    if (!t) continue
    for (const m of t.matchAll(/\{[^}]+\}/g)) set.add(m[0])
  }
  return [...set]
}

function isLink(body: string | null): boolean {
  return !!body && /^https?:\/\//i.test(body.trim())
}

function fillVars(s: string | null): string {
  if (!s) return ''
  return s.replace(/\{(\w+)\}/g, (m, k) => SAMPLE[k] ?? m)
}

function previewHtml(body: string | null): string {
  if (!body) return '<p style="color:#94a3b8">No content yet</p>'
  return fillVars(body)
}

/** Some templates use white text (built for a dark/branded email background). */
function prefersDark(body: string | null): boolean {
  if (!body) return false
  return /color:\s*(rgb\(\s*255\s*,\s*255\s*,\s*255|#fff(?:fff)?\b|white)/i.test(body)
}

/** Hide images that fail to load so previews never show broken-image icons. */
function useImageFallback(html: string) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.querySelectorAll('img').forEach((img) => {
      const hide = () => {
        img.style.visibility = 'hidden'
        img.style.maxHeight = '0px'
      }
      if (img.complete && img.naturalWidth === 0) hide()
      img.addEventListener('error', hide, { once: true })
    })
  }, [html])
  return ref
}

/* ------------------------------- thumbnails ------------------------------- */
function GoogleDocThumb() {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col items-center gap-2">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
          <FileText size={22} />
        </div>
        <span className="text-xs font-medium text-blue-700/80">Linked Google Doc</span>
      </div>
      <div className="absolute inset-x-0 top-0 flex gap-1 p-2.5">
        <span className="h-2 w-2 rounded-full bg-white/70" />
        <span className="h-2 w-2 rounded-full bg-white/70" />
        <span className="h-2 w-2 rounded-full bg-white/70" />
      </div>
    </div>
  )
}

function Thumbnail({ template }: { template: Template }) {
  if (isLink(template.body)) return <GoogleDocThumb />
  const dark = prefersDark(template.body)
  const ref = useImageFallback(template.body || '')
  const bg = dark ? '#0f172a' : '#ffffff'
  return (
    <div className="relative h-44 overflow-hidden border-b border-slate-100" style={{ background: bg }}>
      <div
        ref={ref}
        className="pointer-events-none absolute left-0 top-0 origin-top-left text-sm leading-relaxed [&_*]:!max-w-full [&_a]:text-indigo-500 [&_img]:rounded-md [&_p]:my-1.5"
        style={{
          width: '250%',
          transform: 'scale(0.4)',
          padding: '18px 22px',
          color: dark ? '#e2e8f0' : '#334155',
        }}
        dangerouslySetInnerHTML={{ __html: previewHtml(template.body) }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
        style={{ background: `linear-gradient(to top, ${bg}, transparent)` }}
      />
    </div>
  )
}

/* ------------------------------ email preview ----------------------------- */
function EmailPreview({ template }: { template: Template }) {
  if (isLink(template.body)) {
    return (
      <a
        href={template.body!}
        target="_blank"
        rel="noreferrer"
        className="mx-auto flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300"
      >
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <FileText size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-800">Linked Google Doc</div>
          <div className="truncate text-xs text-slate-400">{template.body}</div>
        </div>
        <ExternalLink size={15} className="ml-auto shrink-0 text-slate-400" />
      </a>
    )
  }
  const dark = prefersDark(template.body)
  const ref = useImageFallback(template.body || '')
  const sender = template.sender || 'Sender'
  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
          style={{ background: avatarColor(sender) }}
        >
          {initials(sender)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-slate-800">
            {sender} <span className="font-normal text-slate-400">&lt;{SAMPLE.Email.replace('priya', 'you')}&gt;</span>
          </div>
          <div className="truncate text-xs text-slate-400">to {SAMPLE.Name} · {SAMPLE.Organization}</div>
        </div>
        <span className="shrink-0 text-[11px] text-slate-300">now</span>
      </div>
      <div className="border-b border-slate-100 px-4 py-2.5">
        <div className="text-[15px] font-semibold text-slate-900">
          {fillVars(template.subject) || <span className="text-slate-400">(continues the thread — no new subject)</span>}
        </div>
      </div>
      <div
        ref={ref}
        className="px-5 py-5 text-sm leading-relaxed [&_a]:text-indigo-500 [&_a]:underline [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_p]:my-2"
        style={{ background: dark ? '#0f172a' : '#ffffff', color: dark ? '#e2e8f0' : '#334155' }}
        dangerouslySetInnerHTML={{ __html: previewHtml(template.body) }}
      />
      {template.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2.5">
          {template.attachments.map((a, i) => (
            <a
              key={i}
              href={a}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:border-indigo-300"
            >
              <Paperclip size={12} className="text-slate-400" />
              Attachment {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------- editor ---------------------------------- */
function TemplateEditor({ template, onClose }: { template: Template; onClose: () => void }) {
  const { dispatch } = useStore()
  const { toast } = useToast()
  const [draft, setDraft] = useState<Template>({ ...template, attachments: [...template.attachments] })
  const [tab, setTab] = useState<'preview' | 'code'>(isLink(template.body) ? 'code' : 'preview')
  const vars = extractVars(draft.subject, draft.body)

  const set = (patch: Partial<Template>) => setDraft((d) => ({ ...d, ...patch }))
  const insertVar = (v: string) =>
    set({ subject: (draft.subject || '') + (draft.subject ? ' ' : '') + v })

  const save = () => {
    dispatch({ type: 'upsertTemplate', template: draft, originalName: template.name })
    toast('Template saved', { desc: `“${draft.name}” was updated.` })
    onClose()
  }

  return (
    <div className="grid max-h-[80vh] grid-cols-1 overflow-hidden lg:grid-cols-2">
      {/* editor */}
      <div className="space-y-4 overflow-y-auto border-r border-slate-100 p-5">
        <Field label="Template name">
          <input value={draft.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Subject line" hint="Use merge variables for personalization">
          <input
            value={draft.subject || ''}
            onChange={(e) => set({ subject: e.target.value })}
            placeholder="(inherits subject / thread)"
            className={inputCls}
          />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {MERGE_VARS.map((v) => (
            <button
              key={v}
              onClick={() => insertVar(v)}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-100"
            >
              <Braces size={11} /> {v}
            </button>
          ))}
        </div>
        <Field label="Sender name">
          <input value={draft.sender || ''} onChange={(e) => set({ sender: e.target.value })} className={inputCls} />
        </Field>
        <Field
          label="Email body"
          hint={isLink(draft.body) ? 'This template links to a Google Doc' : 'HTML supported · white-text emails preview on a dark canvas'}
        >
          <textarea
            value={draft.body || ''}
            onChange={(e) => set({ body: e.target.value })}
            rows={10}
            className={classNames(inputCls, 'font-mono text-xs leading-relaxed')}
          />
        </Field>
      </div>

      {/* preview */}
      <div className="flex flex-col overflow-hidden bg-slate-100/70">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
            <button
              onClick={() => setTab('preview')}
              className={classNames(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
                tab === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500',
              )}
            >
              <Eye size={13} /> Preview
            </button>
            <button
              onClick={() => setTab('code')}
              className={classNames(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
                tab === 'code' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500',
              )}
            >
              <Code2 size={13} /> Source
            </button>
          </div>
          {vars.length > 0 && (
            <span className="text-[11px] text-slate-400">
              {vars.length} merge var{vars.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'preview' ? (
            <EmailPreview template={draft} />
          ) : (
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-[11px] leading-relaxed text-slate-200">
              {draft.body || '(empty)'}
            </pre>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            <Save size={14} /> Save template
          </Button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------- gallery --------------------------------- */
const STEP_TINTS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b']

export function Templates() {
  const { state, dispatch } = useStore()
  const { action, clearAction } = useUI()
  const { toast } = useToast()
  const [editing, setEditing] = useState<Template | null>(null)

  const usage = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const w of state.workflows) for (const s of w.steps) (map[s.template] ||= []).push(w.name)
    return map
  }, [state.workflows])

  const stepInfo = useMemo(() => {
    const m: Record<string, { label: string; num: number }> = {}
    for (const w of state.workflows) {
      w.steps.forEach((s, i) => {
        if (!m[s.template])
          m[s.template] = { label: s.type === 'first' ? 'Initial email' : s.label || `Follow-up ${i}`, num: i + 1 }
      })
    }
    return m
  }, [state.workflows])

  const newTemplate = () => {
    let n = 1
    let name = 'New Template'
    while (state.templates.some((t) => t.name === name)) name = `New Template ${++n}`
    const t: Template = {
      name,
      subject: 'A quick idea for {Organization}',
      sender: state.templates[0]?.sender || 'Anurag Gupta',
      body: '<p>Hi {Name},</p>\n<p>I noticed {Organization} is doing great work in AI…</p>\n<p>Worth a quick chat?</p>',
      attachments: [],
    }
    dispatch({ type: 'upsertTemplate', template: t })
    setEditing(t)
  }

  const duplicate = (t: Template) => {
    let name = `${t.name} copy`
    let n = 1
    while (state.templates.some((x) => x.name === name)) name = `${t.name} copy ${++n}`
    const copy: Template = { ...t, name, attachments: [...t.attachments] }
    dispatch({ type: 'upsertTemplate', template: copy })
    toast('Template duplicated', { desc: `Created “${name}”.` })
  }

  useEffect(() => {
    if (action === 'templates:new') {
      newTemplate()
      clearAction()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <Layers size={17} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{state.templates.length} templates</p>
            <p className="text-xs text-slate-400">
              Used across {state.workflows.length} sequence{state.workflows.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <Button onClick={newTemplate}>
          <Plus size={15} /> New template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {state.templates.map((t, idx) => {
          const vars = extractVars(t.subject, t.body)
          const usedIn = [...new Set(usage[t.name] || [])]
          const step = stepInfo[t.name]
          const tint = STEP_TINTS[(step ? step.num - 1 : idx) % STEP_TINTS.length]
          return (
            <div
              key={t.name}
              onClick={() => setEditing(t)}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"
            >
              <Thumbnail template={t} />

              {/* hover actions */}
              <div className="absolute right-2.5 top-2.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditing(t)
                  }}
                  title="Edit"
                  className="grid h-7 w-7 place-items-center rounded-lg bg-white/95 text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-indigo-600"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicate(t)
                  }}
                  title="Duplicate"
                  className="grid h-7 w-7 place-items-center rounded-lg bg-white/95 text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-indigo-600"
                >
                  <Copy size={13} />
                </button>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {step && (
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white"
                        style={{ background: tint }}
                      >
                        {step.num}
                      </span>
                    )}
                    <h3 className="truncate text-sm font-semibold text-slate-900">{t.name}</h3>
                  </div>
                  <span
                    className={classNames(
                      'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                      isLink(t.body) ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {isLink(t.body) ? 'Doc' : 'HTML'}
                  </span>
                </div>

                <p className="mt-1.5 line-clamp-1 text-xs font-medium text-slate-600">
                  {fillVars(t.subject) || (
                    <span className="font-normal text-slate-400">Continues the thread — no new subject</span>
                  )}
                </p>
                {step && <p className="mt-0.5 text-[11px] text-slate-400">{step.label}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-50 pt-3">
                  {t.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                      <Paperclip size={10} /> {t.attachments.length}
                    </span>
                  )}
                  {vars.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">
                      <Braces size={10} /> {vars.length}
                    </span>
                  )}
                  {usedIn.length > 0 ? (
                    usedIn.map((u) => (
                      <span
                        key={u}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600"
                      >
                        <Mail size={9} /> {u}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                      Unused
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* new template tile */}
        <button
          onClick={newTemplate}
          className="flex min-h-[18rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 group-hover:bg-indigo-100">
            <Plus size={20} />
          </div>
          <span className="text-sm font-medium">New template</span>
        </button>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit template" wide>
        {editing && <TemplateEditor template={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
