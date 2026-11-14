import { EmptyState } from '@/components/kit/primitives'
import { fmtDateTime, fmtDelta, fmtNum } from '@/lib/format'
import type { Eye, HistoryEntry } from '@/lib/sans/types'
import { EYE_META } from '@/lib/sans/types'
import { cn } from '@/lib/utils'
import { FlagList } from './flag-badge'

export type HistoryRow = HistoryEntry & { eye?: Eye }

export function HistoryTable({ rows, showEye, caption, limit }: { rows: HistoryRow[]; showEye?: boolean; caption: string; limit?: number }) {
  const sorted = [...rows].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, limit)
  if (!sorted.length) return <EmptyState title="No measurement history." />
  const showQuality = sorted.some((r) => r.quality !== null)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="label-mono border-b border-border text-left text-[10px] text-silver">
            <th scope="col" className="py-2 pr-4 font-normal">Timestamp</th>
            {showEye && <th scope="col" className="py-2 pr-4 font-normal">Eye</th>}
            <th scope="col" className="py-2 pr-4 text-right font-normal">Raw µm</th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">Filtered µm</th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">±σ</th>
            <th scope="col" className="py-2 pr-4 text-right font-normal">Δ base</th>
            {showQuality && <th scope="col" className="py-2 pr-4 text-right font-normal">Quality</th>}
            <th scope="col" className="py-2 pr-4 font-normal">Status</th>
            <th scope="col" className="py-2 font-normal">Flags</th>
          </tr>
        </thead>
        <tbody className="font-mono tabular-nums">
          {sorted.map((r, i) => (
            <tr key={`${r.eye ?? ''}${r.timestamp}${i}`} className="border-b border-border/60 transition-colors hover:bg-atmos/20">
              <td className="whitespace-nowrap py-2 pr-4 text-xs text-silver">{fmtDateTime(r.timestamp)}</td>
              {showEye && <td className={cn('py-2 pr-4 text-xs', r.eye === 'R' ? 'text-ice' : 'text-violet')}>{r.eye ? EYE_META[r.eye].code : '—'}</td>}
              <td className="py-2 pr-4 text-right text-star">{fmtNum(r.rawRnflUm)}</td>
              <td className="py-2 pr-4 text-right text-ice">{fmtNum(r.estimatedRnflUm)}</td>
              <td className="py-2 pr-4 text-right text-violet">{fmtNum(r.uncertaintyUm)}</td>
              <td className="py-2 pr-4 text-right text-star">{fmtDelta(r.changeFromBaselineUm)}</td>
              {showQuality && <td className="py-2 pr-4 text-right text-silver">{fmtNum(r.quality, 2)}</td>}
              <td className={cn('py-2 pr-4 font-sans text-xs', r.accepted ? 'text-ice' : 'text-amber')}>{r.accepted ? 'Accepted' : 'Excluded'}</td>
              <td className="py-2 font-sans"><FlagList flags={r.flags} empty="—" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
