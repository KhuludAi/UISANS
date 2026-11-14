'use client'

import { motion } from 'motion/react'
import { Panel } from '@/components/kit/panel'
import { ErrorState, Note, PageHeader, Pill, Readout, Skeleton, SourceTag } from '@/components/kit/primitives'
import { EyeGlyph, priorityTone } from '@/components/sans/eye-card'
import { fmtDateTime, fmtNum } from '@/lib/format'
import { useAstronautId, useDataSource, useSansStatus, useSchedule } from '@/lib/sans/hooks'
import { DAY_MS } from '@/lib/sans/kalman'
import { EYES, EYE_META } from '@/lib/sans/types'
import { cn } from '@/lib/utils'

const PRIORITY_STEPS = ['routine', 'elevated', 'high'] as const

export default function PlannerPage() {
  const id = useAstronautId()
  const source = useDataSource()
  const status = useSansStatus(id)
  const schedule = useSchedule(id)

  return (
    <>
      <PageHeader
        index="04"
        eyebrow="Adaptive Scan Planner"
        title="When to scan next, and why"
        description="Intervals and priorities come from the backend schedule. Shorter intervals are requested when the estimate is uncertain, changing, stale, or when the last scan was rejected."
      >
        <SourceTag source={source} />
      </PageHeader>

      {schedule.error && <ErrorState error={schedule.error} onRetry={() => schedule.mutate()} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {EYES.map((eye, i) => {
          const sc = schedule.data?.eyes[eye]
          const st = status.data?.eyes[eye]
          const due =
            sc?.intervalDays !== null && sc?.intervalDays !== undefined && st?.lastValidScan
              ? new Date(Date.parse(st.lastValidScan) + sc.intervalDays * DAY_MS).toISOString()
              : null
          const level = sc ? PRIORITY_STEPS.indexOf(sc.priority as (typeof PRIORITY_STEPS)[number]) : -1
          return (
            <motion.div key={eye} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Panel
                title={
                  <span className="flex items-center gap-3">
                    <EyeGlyph eye={eye} /> {EYE_META[eye].name}
                  </span>
                }
                actions={sc && <Pill tone={priorityTone[sc.priority]}>{sc.priorityLabel} priority</Pill>}
              >
                {!sc ? (
                  <Skeleton className="h-40" />
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      <Readout
                        label="Recommended interval"
                        value={sc.intervalDays === null ? '—' : sc.intervalDays === 0 ? 'Now' : sc.intervalDays}
                        unit={sc.intervalDays ? 'days' : undefined}
                        tone="ice"
                        size="lg"
                        className="col-span-2 md:col-span-1"
                      />
                      <Readout label="Uncertainty" value={`±${fmtNum(st?.uncertaintyUm)}`} unit="µm" tone="violet" />
                      <Readout label="Status" value={sc.statusLabel ?? '—'} size="sm" />
                    </div>

                    <div>
                      <div className="label-mono mb-2 text-[10px] text-silver">Priority level</div>
                      <div className="grid grid-cols-3 gap-1" role="img" aria-label={`Priority ${sc.priorityLabel}`}>
                        {PRIORITY_STEPS.map((p, n) => (
                          <div key={p} className="flex flex-col gap-1">
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: 0.2 + n * 0.1 }}
                              className={cn(
                                'h-1.5 origin-left',
                                n <= level ? (level === 2 ? 'bg-signal' : level === 1 ? 'bg-amber' : 'bg-ice') : 'bg-border',
                              )}
                            />
                            <span className="label-mono text-[9px] text-silver">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-l-2 border-ice/50 bg-atmos/15 px-4 py-3">
                      <div className="label-mono text-[10px] text-ice">Reason</div>
                      <p className="mt-1 text-sm leading-relaxed text-star">{sc.reason ?? 'No reason provided by the backend.'}</p>
                    </div>

                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                      <dt className="text-silver">Last valid scan</dt>
                      <dd className="font-mono text-star">{fmtDateTime(st?.lastValidScan)}</dd>
                      <dt className="text-silver">Next scan due</dt>
                      <dd className="font-mono text-star">
                        {sc.baselineMissing ? 'Baseline scan required now' : due ? fmtDateTime(due) : '—'}
                      </dd>
                    </dl>
                  </div>
                )}
              </Panel>
            </motion.div>
          )
        })}
      </div>

      <Note>
        The due date is derived in the interface as last valid scan + recommended interval. Scheduling never implies a
        diagnosis; it only expresses how much the system currently knows.
      </Note>
    </>
  )
}
