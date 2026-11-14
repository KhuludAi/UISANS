'use client'

import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '@/components/kit/primitives'
import { fmtDate, fmtDateTime, fmtNum } from '@/lib/format'
import { flagInfo } from '@/lib/sans/flags'
import type { EyeStatus, HistoryEntry } from '@/lib/sans/types'

interface Point {
  t: number
  estimate: number | null
  band: [number, number] | null
  accepted: number | null
  rejected: number | null
  entry: HistoryEntry
}

function toPoints(history: HistoryEntry[]): Point[] {
  return history
    .map((h) => {
      const t = Date.parse(h.timestamp)
      const est = h.estimatedRnflUm
      const sd = h.uncertaintyUm
      return {
        t,
        estimate: est,
        band: est !== null && sd !== null ? ([est - 2 * sd, est + 2 * sd] as [number, number]) : null,
        accepted: h.accepted ? h.rawRnflUm : null,
        rejected: !h.accepted ? h.rawRnflUm : null,
        entry: h,
      }
    })
    .filter((p) => !Number.isNaN(p.t))
    .sort((a, b) => a.t - b.t)
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const h = p.entry
  return (
    <div className="min-w-56 border border-ice/30 bg-void/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <div className="font-mono text-silver">{fmtDateTime(h.timestamp)}</div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono">
        <dt className="text-silver">Raw</dt>
        <dd className="text-right text-star">{fmtNum(h.rawRnflUm)} µm</dd>
        <dt className="text-silver">Filtered</dt>
        <dd className="text-right text-ice">{fmtNum(h.estimatedRnflUm)} µm</dd>
        <dt className="text-silver">±1σ</dt>
        <dd className="text-right text-violet">{fmtNum(h.uncertaintyUm)} µm</dd>
        <dt className="text-silver">Δ base</dt>
        <dd className="text-right text-star">{fmtNum(h.changeFromBaselineUm)} µm</dd>
      </dl>
      <div className={`mt-2 border-t border-border pt-2 ${h.accepted ? 'text-ice' : 'text-amber'}`}>
        {h.accepted ? 'Accepted into estimate' : 'Excluded from estimate'}
      </div>
      {h.flags.length > 0 && <div className="mt-1 text-amber">{h.flags.map((f) => flagInfo(f).label).join(' · ')}</div>}
    </div>
  )
}

export function RnflChart({ status, color = '#6adcf5', height = 300 }: { status?: EyeStatus; color?: string; height?: number }) {
  const points = useMemo(() => toPoints(status?.history ?? []), [status])

  if (!status || points.length === 0) {
    return <EmptyState title="No measurements recorded for this eye." description="Submit an OCT measurement to begin the longitudinal record." />
  }

  const values = points.flatMap((p) => [p.accepted, p.rejected, ...(p.band ?? [])]).filter((v): v is number => v !== null)
  if (status.baselineRnflUm !== null) values.push(status.baselineRnflUm)
  const min = Math.floor(Math.min(...values) - 3)
  const max = Math.ceil(Math.max(...values) + 3)

  return (
    <figure className="flex flex-col gap-3">
      <div style={{ height }} className="w-full" role="img" aria-label={`RNFL history chart with ${points.length} measurements`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id={`band-${status.eye}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a397ff" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#a397ff" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgb(143 166 190 / 0.12)" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={fmtDate}
              tick={{ fill: '#8fa6be', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              stroke="rgb(143 166 190 / 0.25)"
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              domain={[min, max]}
              tick={{ fill: '#8fa6be', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              stroke="rgb(143 166 190 / 0.25)"
              tickLine={false}
              width={48}
              unit=""
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(106 220 245 / 0.35)', strokeDasharray: '3 3' }} />
            <Area dataKey="band" stroke="none" fill={`url(#band-${status.eye})`} connectNulls isAnimationActive animationDuration={900} />
            {status.baselineRnflUm !== null && (
              <ReferenceLine
                y={status.baselineRnflUm}
                stroke="#eaf6ff"
                strokeOpacity={0.45}
                strokeDasharray="6 4"
                label={{ value: 'baseline', position: 'insideTopLeft', fill: '#8fa6be', fontSize: 10 }}
              />
            )}
            <Line
              dataKey="estimate"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#030712' }}
              connectNulls
              isAnimationActive
              animationDuration={1100}
            />
            <Scatter dataKey="accepted" fill="#eaf6ff" shape="circle" isAnimationActive={false} />
            <Scatter dataKey="rejected" fill="#ffb547" shape="diamond" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-silver">
        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-4" style={{ background: color }} />Filtered estimate</span>
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-4 bg-violet/30" />±2σ uncertainty</span>
        <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-star" />Accepted raw scan</span>
        <span className="inline-flex items-center gap-2"><span className="size-1.5 rotate-45 bg-amber" />Excluded raw scan</span>
        <span className="inline-flex items-center gap-2"><span className="w-4 border-t border-dashed border-star/50" />Baseline</span>
      </figcaption>
    </figure>
  )
}
