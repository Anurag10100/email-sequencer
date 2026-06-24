import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: ToastKind
  title: string
  desc?: string
}

interface ToastCtx {
  toast: (title: string, opts?: { kind?: ToastKind; desc?: string }) => void
}

const Ctx = createContext<ToastCtx | null>(null)
let counter = 0

const META: Record<ToastKind, { icon: typeof Info; color: string; ring: string }> = {
  success: { icon: CheckCircle2, color: '#10b981', ring: 'ring-emerald-100' },
  error: { icon: XCircle, color: '#ef4444', ring: 'ring-rose-100' },
  info: { icon: Info, color: '#6366f1', ring: 'ring-indigo-100' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback<ToastCtx['toast']>(
    (title, opts) => {
      const id = ++counter
      const t: Toast = { id, title, kind: opts?.kind ?? 'success', desc: opts?.desc }
      setToasts((prev) => [...prev, t])
      setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => {
          const m = META[t.kind]
          const Icon = m.icon
          return (
            <div
              key={t.id}
              className={`animate-fade-up pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg ring-1 ${m.ring}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" style={{ color: m.color }} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800">{t.title}</div>
                {t.desc && <div className="mt-0.5 text-xs text-slate-500">{t.desc}</div>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 rounded p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
