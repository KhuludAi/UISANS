import type {
  Eye,
  EyeSchedule,
  EyeStatus,
  FlagCode,
  HistoryEntry,
  MeasurementResult,
  SansSchedule,
  SansStatus,
  SchedulePriority,
} from './types'

/*
 * The live FastAPI response field names are tolerated across a few likely
 * spellings so the UI does not break if the backend shape is refined.
 * Confirm against the backend's OpenAPI schema (/docs) and tighten as needed.
 */

type Raw = Record<string, unknown>

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)

function pick(obj: Raw | undefined, keys: string[]): unknown {
  if (!obj) return undefined
  for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k]
  return undefined
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length ? v : null
}

function flags(v: unknown): FlagCode[] {
  if (Array.isArray(v)) return v.filter((f): f is string => typeof f === 'string').map((f) => f.toUpperCase())
  if (typeof v === 'string' && v) return [v.toUpperCase()]
  return []
}

const EYE_KEYS: Record<Eye, string[]> = {
  R: ['right_eye', 'R', 'OD', 'right', 'od'],
  L: ['left_eye', 'L', 'OS', 'left', 'os'],
}

function eyeBlock(raw: Raw, eye: Eye): Raw | undefined {
  const direct = pick(raw, EYE_KEYS[eye])
  if (isObj(direct)) return direct
  const nested = pick(raw, ['eyes', 'status', 'sans'])
  if (isObj(nested)) {
    const inner = pick(nested, EYE_KEYS[eye])
    if (isObj(inner)) return inner
  }
  return undefined
}

function historyEntry(raw: unknown): HistoryEntry | null {
  if (!isObj(raw)) return null
  const timestamp = str(pick(raw, ['timestamp', 'time', 'measured_at']))
  if (!timestamp) return null
  const entryFlags = flags(pick(raw, ['flags', 'quality_flags']))
  const acceptedRaw = pick(raw, ['accepted', 'is_accepted', 'valid', 'used_in_update'])
  return {
    timestamp,
    rawRnflUm: num(pick(raw, ['raw_rnfl_um', 'raw_rnfl', 'rnfl_um', 'measurement_um', 'measurement'])),
    estimatedRnflUm: num(pick(raw, ['estimated_rnfl_um', 'estimated_rnfl', 'estimate_um', 'estimate', 'filtered_rnfl_um'])),
    changeFromBaselineUm: num(pick(raw, ['change_from_baseline_um', 'change_from_baseline', 'delta_um', 'delta'])),
    uncertaintyUm: num(pick(raw, ['uncertainty_um', 'uncertainty', 'std_um', 'sigma'])),
    accepted: typeof acceptedRaw === 'boolean' ? acceptedRaw : entryFlags.length === 0,
    flags: entryFlags,
    quality: num(pick(raw, ['quality', 'scan_quality'])),
  }
}

export function normalizeEyeStatus(raw: Raw | undefined, eye: Eye): EyeStatus {
  const historyRaw = pick(raw, ['history', 'measurements', 'measurement_history'])
  const history = (Array.isArray(historyRaw) ? historyRaw : [])
    .map(historyEntry)
    .filter((e): e is HistoryEntry => e !== null)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))

  const baseline = num(pick(raw, ['baseline_rnfl_um', 'baseline_rnfl', 'baseline_um', 'baseline']))
  const estimate = num(pick(raw, ['estimated_rnfl_um', 'estimated_rnfl', 'estimate_um', 'estimate', 'filtered_rnfl_um']))
  const latest = history.at(-1)
  const lastValid = [...history].reverse().find((h) => h.accepted)
  const change =
    num(pick(raw, ['change_from_baseline_um', 'change_from_baseline', 'delta_um'])) ??
    (baseline !== null && estimate !== null ? estimate - baseline : null)

  return {
    eye,
    baselineRnflUm: baseline,
    estimatedRnflUm: estimate,
    latestRawRnflUm: num(pick(raw, ['latest_raw_rnfl_um', 'latest_rnfl_um', 'last_raw_rnfl_um'])) ?? latest?.rawRnflUm ?? null,
    changeFromBaselineUm: change,
    uncertaintyUm: num(pick(raw, ['uncertainty_um', 'uncertainty', 'std_um', 'sigma'])),
    lastValidScan:
      str(pick(raw, ['last_valid_scan', 'last_valid_scan_timestamp', 'last_valid_timestamp'])) ?? lastValid?.timestamp ?? null,
    history,
  }
}

export function normalizeStatus(raw: unknown, astronautId: string): SansStatus {
  const obj = isObj(raw) ? raw : {}
  return {
    astronautId: str(pick(obj, ['astronaut_id', 'astronautId'])) ?? astronautId,
    eyes: { R: normalizeEyeStatus(eyeBlock(obj, 'R'), 'R'), L: normalizeEyeStatus(eyeBlock(obj, 'L'), 'L') },
  }
}

function priority(v: unknown): SchedulePriority {
  if (typeof v === 'number') return v >= 3 ? 'high' : v === 2 ? 'elevated' : v <= 1 ? 'routine' : 'unknown'
  if (typeof v !== 'string') return 'unknown'
  const p = v.toLowerCase()
  if (['high', 'urgent', 'immediate', 'critical'].some((k) => p.includes(k))) return 'high'
  if (['elevated', 'medium', 'moderate', 'increased'].some((k) => p.includes(k))) return 'elevated'
  if (['routine', 'low', 'normal', 'standard'].some((k) => p.includes(k))) return 'routine'
  return 'unknown'
}

export function normalizeEyeSchedule(raw: Raw | undefined, eye: Eye): EyeSchedule {
  const pr = pick(raw, ['priority', 'scan_priority'])
  const reason = str(pick(raw, ['reason', 'explanation', 'rationale', 'recommendation']))
  const baselineRaw = pick(raw, ['baseline_missing', 'missing_baseline'])
  return {
    eye,
    priority: priority(pr),
    priorityLabel: pr !== undefined ? String(pr) : '—',
    intervalDays: num(pick(raw, ['interval_days', 'recommended_interval_days', 'next_scan_in_days', 'next_scan_days', 'interval'])),
    reason,
    statusLabel: str(pick(raw, ['status', 'monitoring_status', 'state'])),
    baselineMissing:
      typeof baselineRaw === 'boolean' ? baselineRaw : Boolean(reason && /baseline/i.test(reason) && /(no|not|missing)/i.test(reason)),
  }
}

export function normalizeSchedule(raw: unknown, astronautId: string): SansSchedule {
  const obj = isObj(raw) ? raw : {}
  return {
    astronautId: str(pick(obj, ['astronaut_id', 'astronautId'])) ?? astronautId,
    eyes: { R: normalizeEyeSchedule(eyeBlock(obj, 'R'), 'R'), L: normalizeEyeSchedule(eyeBlock(obj, 'L'), 'L') },
  }
}

export function normalizeMeasurementResult(raw: unknown): MeasurementResult {
  const obj = isObj(raw) ? raw : {}
  const acc = pick(obj, ['accepted', 'is_accepted', 'used_in_update', 'valid'])
  return {
    accepted: typeof acc === 'boolean' ? acc : null,
    flags: flags(pick(obj, ['flags', 'quality_flags'])),
    message: str(pick(obj, ['message', 'detail', 'status'])),
  }
}

export { isObj, pick }
