import { Pill, type Tone } from '@/components/kit/primitives'
import { flagInfo, type Severity } from '@/lib/sans/flags'
import type { FlagCode } from '@/lib/sans/types'

export const severityTone: Record<Severity, Tone> = { caution: 'alert', advisory: 'warn', info: 'info' }

export function FlagBadge({ code }: { code: FlagCode }) {
  const info = flagInfo(code)
  return (
    <span title={`${info.code}: ${info.description}`}>
      <Pill tone={severityTone[info.severity]}>{info.label}</Pill>
    </span>
  )
}

export function FlagList({ flags, empty = 'No flags' }: { flags: FlagCode[]; empty?: string }) {
  if (!flags.length) return <span className="text-xs text-silver/70">{empty}</span>
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <FlagBadge key={f} code={f} />
      ))}
    </div>
  )
}
