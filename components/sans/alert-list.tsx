'use client'

import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, Check, Info, ShieldAlert } from 'lucide-react'
import { EmptyState } from '@/components/kit/primitives'
import { fmtDateTime } from '@/lib/format'
import type { MonitoringAlert } from '@/lib/sans/alerts'
import type { Severity } from '@/lib/sans/flags'
import { EYE_META } from '@/lib/sans/types'
import { cn } from '@/lib/utils'

const sev: Record<Severity, { icon: typeof Info; cls: string; label: string }> = {
  caution: { icon: ShieldAlert, cls: 'border-l-signal text-signal', label: 'Caution' },
  advisory: { icon: AlertTriangle, cls: 'border-l-amber text-amber', label: 'Advisory' },
  info: { icon: Info, cls: 'border-l-ice/60 text-ice', label: 'Info' },
}

export function AlertList({
  alerts,
  acknowledged,
  onAcknowledge,
  compact,
}: {
  alerts: MonitoringAlert[]
  acknowledged?: Set<string>
  onAcknowledge?: (id: string) => void
  compact?: boolean
}) {
  if (!alerts.length) return <EmptyState title="No active monitoring alerts." description="Alerts are derived from backend flags, schedules and connection state." />
  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {alerts.map((a, i) => {
          const s = sev[a.severity]
          const Icon = s.icon
          const acked = acknowledged?.has(a.id)
          return (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: acked ? 0.5 : 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className={cn('flex gap-3 border border-l-2 border-border bg-midnight/60 px-3 py-2.5', s.cls)}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="label-mono text-[10px]">{s.label}</span>
                  <span className="label-mono text-[10px] text-silver">{a.category}</span>
                  {a.eye && <span className="font-mono text-[10px] text-silver">{EYE_META[a.eye].code}</span>}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-star">{a.message}</p>
                {!compact && (
                  <p className="mt-1 text-[11px] text-silver">
                    {a.timestamp ? fmtDateTime(a.timestamp) : 'Current state'} · {a.source}
                    {a.astronautId ? ` · ${a.astronautId}` : ''}
                  </p>
                )}
              </div>
              {onAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(a.id)}
                  disabled={acked}
                  className="label-mono h-7 self-start border border-border px-2 text-[10px] text-silver hover:border-ice hover:text-ice disabled:opacity-60"
                >
                  {acked ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3" aria-hidden />
                      Seen
                    </span>
                  ) : (
                    'Acknowledge'
                  )}
                </button>
              )}
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
