'use client'

import { useMemo, useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { EmptyState, Note, PageHeader, SourceTag } from '@/components/kit/primitives'
import { AlertList } from '@/components/sans/alert-list'
import { fmtDateTime, fmtNum } from '@/lib/format'
import { flagInfo } from '@/lib/sans/flags'
import type { AlertCategory } from '@/lib/sans/alerts'
import { useAstronautId, useDataSource, useSansStatus } from '@/lib/sans/hooks'
import { useAlerts } from '@/lib/sans/use-alerts'
import { EYES, EYE_META } from '@/lib/sans/types'
import { useSessionStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const CATEGORIES: AlertCategory[] = [
  'Measurement quality',
  'Missing measurements',
  'RNFL trend review',
  'Scan scheduling',
  'Connection status',
  'Synchronization',
  'Clinical review',
]

interface LogEvent {
  at: string
  kind: string
  text: string
  tone: 'ice' | 'amber' | 'violet'
}

export default function AlertsPage() {
  const id = useAstronautId()
  const source = useDataSource()
  const { alerts } = useAlerts(id)
  const status = useSansStatus(id)
  const conflicts = useSessionStore((s) => s.conflicts)
  const decisions = useSessionStore((s) => s.decisions)
  const [filter, setFilter] = useState<AlertCategory | 'all'>('all')
  const [acked, setAcked] = useState<Set<string>>(new Set())

  const shown = filter === 'all' ? alerts : alerts.filter((a) => a.category === filter)

  const events = useMemo<LogEvent[]>(() => {
    const out: LogEvent[] = []
    for (const e of EYES) {
      for (const h of status.data?.eyes[e].history ?? []) {
        out.push({
          at: h.timestamp,
          kind: `Scan · ${EYE_META[e].code}`,
          text: `RNFL ${fmtNum(h.rawRnflUm)} µm ${h.accepted ? 'accepted' : 'excluded'}${h.flags.length ? ` (${h.flags.map((f) => flagInfo(f).label).join(', ')})` : ''}`,
          tone: h.accepted ? 'ice' : 'amber',
        })
      }
    }
    for (const c of conflicts.filter((c) => c.astronautId === id)) out.push({ at: c.at, kind: 'Rejected · 409', text: c.detail, tone: 'amber' })
    for (const d of decisions) out.push({ at: d.at, kind: 'Review', text: `${d.action}: ${d.status} by ${d.reviewer}${d.note ? `. ${d.note}` : ''}`, tone: 'violet' })
    return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 60)
  }, [status.data, conflicts, decisions, id])

  return (
    <>
      <PageHeader
        index="06"
        eyebrow="Alerts & Events"
        title="What needs attention"
        description="Alerts are derived from backend flags, schedules, and connection state. They are monitoring notices for human review, not diagnoses."
      >
        <SourceTag source={source} />
      </PageHeader>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter alerts by category">
        {(['all', ...CATEGORIES] as const).map((c) => {
          const n = c === 'all' ? alerts.length : alerts.filter((a) => a.category === c).length
          return (
            <button
              key={c}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
              className={cn(
                'label-mono border px-3 py-1.5 text-[10px] transition-colors',
                filter === c ? 'border-ice bg-ice/10 text-ice' : 'border-border text-silver hover:text-star',
              )}
            >
              {c === 'all' ? 'All' : c} · {n}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <Panel title={`Active alerts · ${id}`}>
          <AlertList alerts={shown} acknowledged={acked} onAcknowledge={(a) => setAcked((s) => new Set(s).add(a))} />
          <Note className="mt-4">Acknowledgements are kept for this session only. Persistent acknowledgement needs a backend audit endpoint.</Note>
        </Panel>
        <Panel title="Event history">
          {events.length === 0 ? (
            <EmptyState title="No events recorded." />
          ) : (
            <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    aria-hidden
                    className={cn('absolute -left-[23px] top-1.5 size-2 rounded-full', e.tone === 'ice' ? 'bg-ice' : e.tone === 'amber' ? 'bg-amber' : 'bg-violet')}
                  />
                  <div className="font-mono text-[11px] text-silver">
                    {fmtDateTime(e.at)} · {e.kind}
                  </div>
                  <p className="text-sm text-star">{e.text}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  )
}
