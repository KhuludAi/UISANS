import { BASELINE_MISSING_MESSAGE, flagInfo, type Severity } from './flags'
import { EYES, EYE_META, type Eye, type SansSchedule, type SansStatus } from './types'
import type { GroundState } from './hooks'

export type AlertCategory =
  | 'Measurement quality'
  | 'Missing measurements'
  | 'RNFL trend review'
  | 'Scan scheduling'
  | 'Connection status'
  | 'Synchronization'
  | 'Clinical review'

export interface MonitoringAlert {
  id: string
  category: AlertCategory
  severity: Severity
  message: string
  timestamp: string | null
  astronautId: string | null
  eye: Eye | null
  source: string
}

/** Display threshold for surfacing a trend for human review. Configurable; not a clinical cut-off. */
export const TREND_REVIEW_THRESHOLD_UM = 5

interface DeriveInput {
  astronautId: string
  status?: SansStatus
  schedule?: SansSchedule
  backendReachable: boolean | null
  backendError?: string | null
  ground: GroundState
  sourceLabel: string
}

export function deriveAlerts(input: DeriveInput): MonitoringAlert[] {
  const out: MonitoringAlert[] = []
  const { astronautId, status, schedule, sourceLabel } = input

  if (input.backendReachable === false) {
    out.push({
      id: 'conn-local',
      category: 'Connection status',
      severity: 'caution',
      message: input.backendError ?? 'Local SANS backend unreachable. Measurements cannot be stored until it is available.',
      timestamp: new Date().toISOString(),
      astronautId: null,
      eye: null,
      source: 'Connection monitor',
    })
  }

  if (input.ground === 'disconnected') {
    out.push({
      id: 'conn-ground',
      category: 'Synchronization',
      severity: 'info',
      message: 'Ground link unavailable. Local monitoring continues; synchronization deferred.',
      timestamp: new Date().toISOString(),
      astronautId: null,
      eye: null,
      source: 'Ground link monitor',
    })
  }

  for (const eye of EYES) {
    const st = status?.eyes[eye]
    const sc = schedule?.eyes[eye]
    const code = EYE_META[eye].code
    if (st) {
      if (st.baselineRnflUm === null) {
        out.push({
          id: `${astronautId}-${eye}-baseline`,
          category: 'Scan scheduling',
          severity: 'advisory',
          message: `${code}: ${BASELINE_MISSING_MESSAGE}`,
          timestamp: null,
          astronautId,
          eye,
          source: sourceLabel,
        })
      }
      const latest = st.history.at(-1)
      if (latest) {
        for (const f of latest.flags) {
          const info = flagInfo(f)
          out.push({
            id: `${astronautId}-${eye}-${latest.timestamp}-${f}`,
            category: f === 'MISSING_MEASUREMENT' ? 'Missing measurements' : 'Measurement quality',
            severity: info.severity,
            message: `${code}: ${info.message}`,
            timestamp: latest.timestamp,
            astronautId,
            eye,
            source: sourceLabel,
          })
        }
      }
      if (st.changeFromBaselineUm !== null && Math.abs(st.changeFromBaselineUm) >= TREND_REVIEW_THRESHOLD_UM) {
        out.push({
          id: `${astronautId}-${eye}-trend`,
          category: 'RNFL trend review',
          severity: 'advisory',
          message: `${code}: filtered RNFL estimate differs from baseline by ${st.changeFromBaselineUm.toFixed(1)} µm. Flag for clinical review; this is not a diagnosis.`,
          timestamp: st.lastValidScan,
          astronautId,
          eye,
          source: sourceLabel,
        })
        out.push({
          id: `${astronautId}-${eye}-clinical`,
          category: 'Clinical review',
          severity: 'info',
          message: `${code}: authorized medical review recommended before any interpretation of the trend.`,
          timestamp: st.lastValidScan,
          astronautId,
          eye,
          source: 'Review policy',
        })
      }
    }
    if (sc && sc.priority === 'high' && sc.reason && !(st && st.baselineRnflUm === null)) {
      out.push({
        id: `${astronautId}-${eye}-sched`,
        category: 'Scan scheduling',
        severity: 'advisory',
        message: `${code}: ${sc.reason}`,
        timestamp: null,
        astronautId,
        eye,
        source: `${sourceLabel} · scheduler`,
      })
    }
  }

  const rank: Record<Severity, number> = { caution: 0, advisory: 1, info: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity])
}
