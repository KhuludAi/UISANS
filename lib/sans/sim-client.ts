import { ApiError, type ValidationIssue } from './errors'
import { DAY_MS, kalmanInit, kalmanPredict, kalmanUpdate, type KalmanParams } from './kalman'
import { BASELINE_MISSING_MESSAGE, RECORDED_MESSAGE, flagInfo } from './flags'
import type { Eye, EyeSchedule, EyeStatus, FlagCode, HistoryEntry, SansClient, SansSchedule, SansStatus } from './types'

/*
 * Browser-side SIMULATION engine for Demo Mode only. It mirrors the documented
 * contract of the FastAPI backend so the interface can be demonstrated offline,
 * but its thresholds are illustrative and are NOT the backend's validated values.
 * Records are stored in localStorage, fully separate from live data.
 */

const STORAGE_KEY = 'sansight.simulation.v1'

export const SIM_PARAMS = {
  kalman: { r: 9, qPerDay: 0.04 } satisfies KalmanParams,
  qualityMin: 0.7,
  rnflRange: [40, 200] as const,
  longGapDays: 30,
  reviewChangeUm: 5,
}

interface SimEye {
  baseline: number | null
  x: number | null
  p: number | null
  lastTs: string | null
  lastValidTs: string | null
  history: HistoryEntry[]
}

type SimDb = Record<string, Record<Eye, SimEye>>

const emptyEye = (): SimEye => ({ baseline: null, x: null, p: null, lastTs: null, lastValidTs: null, history: [] })

function load(): SimDb {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as SimDb
  } catch {
    return {}
  }
}

function save(db: SimDb) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

const latency = () => new Promise((r) => setTimeout(r, 180 + Math.random() * 220))

function getEye(db: SimDb, id: string, eye: Eye): SimEye {
  db[id] ??= { R: emptyEye(), L: emptyEye() }
  return db[id][eye]
}

function toStatus(e: SimEye, eye: Eye): EyeStatus {
  return {
    eye,
    baselineRnflUm: e.baseline,
    estimatedRnflUm: e.x,
    latestRawRnflUm: e.history.at(-1)?.rawRnflUm ?? null,
    changeFromBaselineUm: e.baseline !== null && e.x !== null ? e.x - e.baseline : null,
    uncertaintyUm: e.p !== null ? Math.sqrt(e.p) : null,
    lastValidScan: e.lastValidTs,
    history: e.history,
  }
}

function scheduleFor(e: SimEye, eye: Eye): EyeSchedule {
  const base = { eye, statusLabel: null as string | null, baselineMissing: false }
  if (e.baseline === null) {
    return { ...base, priority: 'high', priorityLabel: 'high', intervalDays: 0, reason: BASELINE_MISSING_MESSAGE, baselineMissing: true, statusLabel: 'awaiting baseline' }
  }
  const last = e.history.at(-1)
  if (last && !last.accepted) {
    const why = last.flags.map((f) => flagInfo(f).label.toLowerCase()).join(', ') || 'rejected scan'
    return { ...base, priority: 'high', priorityLabel: 'high', intervalDays: 1, reason: `Most recent scan was excluded from the estimate (${why}). Repeat the scan.`, statusLabel: 'repeat required' }
  }
  const sinceValid = e.lastValidTs ? (Date.now() - Date.parse(e.lastValidTs)) / DAY_MS : 0
  const change = e.x !== null ? e.x - e.baseline : 0
  const sigma = e.p !== null ? Math.sqrt(e.p) : 0
  if (sinceValid > SIM_PARAMS.longGapDays) {
    return { ...base, priority: 'elevated', priorityLabel: 'elevated', intervalDays: 0, reason: 'Extended gap since the last valid scan. A new scan will refresh the estimate.', statusLabel: 'stale estimate' }
  }
  if (Math.abs(change) >= SIM_PARAMS.reviewChangeUm) {
    return { ...base, priority: 'elevated', priorityLabel: 'elevated', intervalDays: 7, reason: `Filtered estimate has changed ${change.toFixed(1)} µm from baseline. Shorter interval to confirm the trend.`, statusLabel: 'trend under review' }
  }
  if (sigma > 2.4) {
    return { ...base, priority: 'elevated', priorityLabel: 'elevated', intervalDays: 14, reason: `Estimate uncertainty is ±${sigma.toFixed(1)} µm. Additional valid scans will narrow it.`, statusLabel: 'building confidence' }
  }
  return { ...base, priority: 'routine', priorityLabel: 'routine', intervalDays: 30, reason: 'Estimate is stable with low uncertainty. Routine interval.', statusLabel: 'stable' }
}

export const simClient: SansClient = {
  source: 'demo',
  async health() {
    await latency()
    return { ok: true, detail: 'Simulation engine (browser storage)', checkedAt: new Date().toISOString() }
  },
  async submitMeasurement(input) {
    await latency()
    const issues: ValidationIssue[] = []
    if (!input.astronaut_id?.trim()) issues.push({ field: 'astronaut_id', message: 'Field required' })
    if (input.eye !== 'R' && input.eye !== 'L') issues.push({ field: 'eye', message: "Input should be 'R' or 'L'" })
    if (Number.isNaN(Date.parse(input.timestamp))) issues.push({ field: 'timestamp', message: 'Input should be a valid datetime' })
    if (typeof input.quality !== 'number' || Number.isNaN(input.quality)) issues.push({ field: 'quality', message: 'Input should be a valid number' })
    if (issues.length) throw new ApiError('validation', 422, 'Validation failed.', issues)

    const db = load()
    const e = getEye(db, input.astronaut_id, input.eye)
    const ts = Date.parse(input.timestamp)
    if (e.lastTs && ts <= Date.parse(e.lastTs)) {
      throw new ApiError('conflict', 409, `OUT_OF_ORDER: timestamp must be later than the last recorded measurement for eye ${input.eye} (${e.lastTs}).`)
    }

    const flags: FlagCode[] = []
    let usable = true
    const z = input.rnfl_um
    if (z === null || z === undefined || Number.isNaN(z)) {
      flags.push('MISSING_MEASUREMENT')
      usable = false
    }
    if (input.quality < 0 || input.quality > 1) {
      flags.push('INVALID_SCAN_QUALITY')
      usable = false
    } else if (input.quality < SIM_PARAMS.qualityMin) {
      flags.push('LOW_SCAN_QUALITY')
      usable = false
    }
    if (z !== null && (z < SIM_PARAMS.rnflRange[0] || z > SIM_PARAMS.rnflRange[1])) {
      flags.push('OUT_OF_RANGE')
      usable = false
    }
    if (usable && e.lastValidTs && (ts - Date.parse(e.lastValidTs)) / DAY_MS > SIM_PARAMS.longGapDays) {
      flags.push('LONG_VALID_SCAN_GAP')
    }

    if (usable && z !== null) {
      if (e.x === null || e.p === null) {
        const init = kalmanInit(z, SIM_PARAMS.kalman)
        e.baseline = z
        e.x = init.x
        e.p = init.p
      } else {
        const dt = e.lastValidTs ? (ts - Date.parse(e.lastValidTs)) / DAY_MS : 0
        const next = kalmanUpdate(kalmanPredict({ x: e.x, p: e.p }, dt, SIM_PARAMS.kalman), z, SIM_PARAMS.kalman)
        e.x = next.x
        e.p = next.p
      }
      e.lastValidTs = input.timestamp
    }

    e.history.push({
      timestamp: input.timestamp,
      rawRnflUm: z ?? null,
      estimatedRnflUm: e.x,
      changeFromBaselineUm: e.baseline !== null && e.x !== null ? e.x - e.baseline : null,
      uncertaintyUm: e.p !== null ? Math.sqrt(e.p) : null,
      accepted: usable,
      flags,
      quality: input.quality,
    })
    e.lastTs = input.timestamp
    save(db)
    return { accepted: usable, flags, message: usable ? RECORDED_MESSAGE : 'Measurement recorded in history and excluded from the filtered estimate.' }
  },
  async getStatus(id): Promise<SansStatus> {
    await latency()
    const db = load()
    return { astronautId: id, eyes: { R: toStatus(getEye(db, id, 'R'), 'R'), L: toStatus(getEye(db, id, 'L'), 'L') } }
  },
  async getSchedule(id): Promise<SansSchedule> {
    await latency()
    const db = load()
    return { astronautId: id, eyes: { R: scheduleFor(getEye(db, id, 'R'), 'R'), L: scheduleFor(getEye(db, id, 'L'), 'L') } }
  },
  async getOverview(id) {
    const status = await simClient.getStatus(id)
    return { astronautId: id, status, vitalSigns: { status: 'placeholder', note: 'Vital signs integration pending.' } }
  },
}

export function resetSimulation() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function simulationRecordCount(): number {
  const db = load()
  return Object.values(db).reduce((n, a) => n + a.R.history.length + a.L.history.length, 0)
}

export function simulationLastTimestamp(id: string): number | null {
  const db = load()
  const a = db[id]
  if (!a) return null
  const ts = [a.R.lastTs, a.L.lastTs].filter(Boolean).map((t) => Date.parse(t!))
  return ts.length ? Math.max(...ts) : null
}
