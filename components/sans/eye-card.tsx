'use client'

import { motion } from 'motion/react'
import { Panel } from '@/components/kit/panel'
import { Pill, Readout, Skeleton, type Tone } from '@/components/kit/primitives'
import { fmtDateTime, fmtDelta, fmtNum, fmtRelative } from '@/lib/format'
import { BASELINE_MISSING_MESSAGE } from '@/lib/sans/flags'
import { EYE_META, type Eye, type EyeSchedule, type EyeStatus, type SchedulePriority } from '@/lib/sans/types'
import { cn } from '@/lib/utils'
import { FlagList } from './flag-badge'

export const priorityTone: Record<SchedulePriority, Tone> = { routine: 'ok', elevated: 'warn', high: 'alert', unknown: 'muted' }

export function EyeGlyph({ eye, className }: { eye: Eye; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-9 place-items-center rounded-full border font-mono text-xs',
        eye === 'R' ? 'border-ice/50 text-ice' : 'border-violet/50 text-violet',
        className,
      )}
    >
      {EYE_META[eye].code}
    </span>
  )
}

export function EyeCard({
  eye,
  status,
  schedule,
  loading,
  selected,
  onSelect,
}: {
  eye: Eye
  status?: EyeStatus
  schedule?: EyeSchedule
  loading?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const meta = EYE_META[eye]
  const latest = status?.history.at(-1)
  const noBaseline = status && status.baselineRnflUm === null

  return (
    <Panel
      as="article"
      className={cn('transition-colors', selected && 'border-ice/50 shadow-[0_0_40px_-12px_rgb(106_220_245/0.45)]')}
      title={
        <span className="flex items-center gap-3">
          <EyeGlyph eye={eye} />
          <span>
            {meta.name} · {meta.letter}
          </span>
        </span>
      }
      actions={
        <>
          {schedule && <Pill tone={priorityTone[schedule.priority]}>{schedule.priorityLabel}</Pill>}
          {onSelect && (
            <button
              type="button"
              onClick={onSelect}
              aria-pressed={selected}
              className="label-mono border border-border px-2 py-1 text-[10px] text-silver hover:border-ice hover:text-ice"
            >
              {selected ? 'Focused' : 'Focus'}
            </button>
          )}
        </>
      }
    >
      {loading && !status ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : noBaseline ? (
        <div className="flex flex-col gap-2 py-2">
          <p className="text-lg text-star">{BASELINE_MISSING_MESSAGE}</p>
          <p className="text-sm text-silver">
            No accepted scan exists for this eye yet. The first accepted OCT measurement establishes the baseline.
          </p>
          {latest && <FlagList flags={latest.flags} />}
        </div>
      ) : (
        <motion.div layout className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
            <Readout label="Filtered RNFL" value={fmtNum(status?.estimatedRnflUm)} unit="µm" tone="ice" size="lg" className="col-span-2" />
            <Readout label="Uncertainty" value={`±${fmtNum(status?.uncertaintyUm)}`} unit="µm" tone="violet" />
            <Readout
              label="Δ Baseline"
              value={fmtDelta(status?.changeFromBaselineUm)}
              unit="µm"
              tone={status?.changeFromBaselineUm !== null && Math.abs(status?.changeFromBaselineUm ?? 0) >= 5 ? 'amber' : undefined}
            />
            <Readout label="Baseline" value={fmtNum(status?.baselineRnflUm)} unit="µm" size="sm" />
            <Readout label="Latest raw" value={fmtNum(status?.latestRawRnflUm)} unit="µm" size="sm" />
            <Readout label="Last valid scan" value={fmtRelative(status?.lastValidScan)} size="sm" sub={fmtDateTime(status?.lastValidScan)} className="col-span-2" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <span className="label-mono text-[10px] text-silver">Latest flags</span>
              <FlagList flags={latest?.flags ?? []} empty={latest ? 'None' : 'No scans'} />
            </div>
            {schedule && (
              <span className="text-xs text-silver">
                Next scan:{' '}
                <span className="font-mono text-star">
                  {schedule.intervalDays === null ? '—' : schedule.intervalDays === 0 ? 'now' : `${schedule.intervalDays} d`}
                </span>
              </span>
            )}
          </div>
        </motion.div>
      )}
    </Panel>
  )
}
