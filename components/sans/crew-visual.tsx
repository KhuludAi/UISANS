'use client'

import { motion } from 'motion/react'
import { fmtDelta, fmtNum } from '@/lib/format'
import { EYE_META, type Eye, type SansSchedule, type SansStatus } from '@/lib/sans/types'
import { cn } from '@/lib/utils'

const ringColor = { routine: '#6adcf5', elevated: '#ffb547', high: '#ff6b5e', unknown: '#8fa6be' } as const

/**
 * Interactive astronaut visualization. Eyes are positioned anatomically:
 * the astronaut's right eye (OD) appears on the viewer's left.
 */
export function CrewVisual({
  status,
  schedule,
  selected,
  onSelect,
}: {
  status?: SansStatus
  schedule?: SansSchedule
  selected: Eye
  onSelect: (e: Eye) => void
}) {
  const eyes: { eye: Eye; cx: number }[] = [
    { eye: 'R', cx: 118 },
    { eye: 'L', cx: 202 },
  ]
  return (
    <div className="relative">
      <svg viewBox="0 0 320 300" className="mx-auto w-full max-w-sm" role="group" aria-label="Astronaut eye selector">
        <defs>
          <radialGradient id="visor" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#123c65" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <ellipse cx="160" cy="150" rx="150" ry="140" fill="none" stroke="#6adcf5" strokeOpacity="0.1" strokeDasharray="2 6" />
        <path d="M60 150 C 60 70, 260 70, 260 150 C 260 230, 220 268, 160 268 C 100 268, 60 230, 60 150 Z" fill="url(#visor)" stroke="#8fa6be" strokeOpacity="0.4" />
        <path d="M80 140 C 90 96, 230 96, 240 140" fill="none" stroke="#eaf6ff" strokeOpacity="0.15" strokeWidth="6" strokeLinecap="round" />
        <path d="M150 168 L 146 200 L 162 204" fill="none" stroke="#8fa6be" strokeOpacity="0.35" />
        {eyes.map(({ eye, cx }) => {
          const st = status?.eyes[eye]
          const pr = schedule?.eyes[eye]?.priority ?? 'unknown'
          const active = selected === eye
          return (
            <g
              key={eye}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`${EYE_META[eye].name}, filtered RNFL ${fmtNum(st?.estimatedRnflUm)} micrometers, priority ${pr}`}
              onClick={() => onSelect(eye)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(eye))}
              className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-star"
            >
              <circle cx={cx} cy="148" r="30" fill="transparent" stroke={ringColor[pr]} strokeOpacity={active ? 0.9 : 0.35} strokeWidth={active ? 2 : 1} />
              {active && (
                <motion.circle
                  cx={cx}
                  cy="148"
                  r="30"
                  fill="none"
                  stroke={ringColor[pr]}
                  initial={{ r: 30, opacity: 0.6 }}
                  animate={{ r: 44, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <ellipse cx={cx} cy="148" rx="20" ry="11" fill="#030712" stroke="#eaf6ff" strokeOpacity="0.5" />
              <circle cx={cx} cy="148" r="7" fill={eye === 'R' ? '#6adcf5' : '#a397ff'} fillOpacity={active ? 0.9 : 0.5} />
              <circle cx={cx + 2} cy="146" r="1.6" fill="#eaf6ff" />
              <text x={cx} y="198" textAnchor="middle" className="fill-silver font-mono text-[11px]">
                {EYE_META[eye].code}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-px border border-border bg-border text-center">
        {eyes.map(({ eye }) => {
          const st = status?.eyes[eye]
          return (
            <button
              key={eye}
              type="button"
              onClick={() => onSelect(eye)}
              aria-pressed={selected === eye}
              className={cn('bg-void px-3 py-2 transition-colors hover:bg-atmos/30', selected === eye && 'bg-atmos/40')}
            >
              <div className="label-mono text-[10px] text-silver">{EYE_META[eye].name}</div>
              <div className={cn('font-mono text-lg', eye === 'R' ? 'text-ice' : 'text-violet')}>{fmtNum(st?.estimatedRnflUm)} µm</div>
              <div className="font-mono text-[11px] text-silver">Δ {fmtDelta(st?.changeFromBaselineUm)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
