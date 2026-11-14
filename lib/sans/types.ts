export type Eye = 'R' | 'L'
export const EYES: Eye[] = ['R', 'L']

export const EYE_META: Record<Eye, { code: 'OD' | 'OS'; name: string; letter: Eye }> = {
  R: { code: 'OD', name: 'Right eye', letter: 'R' },
  L: { code: 'OS', name: 'Left eye', letter: 'L' },
}

export const KNOWN_FLAGS = [
  'MISSING_MEASUREMENT',
  'INVALID_SCAN_QUALITY',
  'LOW_SCAN_QUALITY',
  'OUT_OF_RANGE',
  'OUT_OF_ORDER',
  'LONG_VALID_SCAN_GAP',
] as const

export type MonitoringFlag = (typeof KNOWN_FLAGS)[number]
export type FlagCode = MonitoringFlag | (string & {})

export type DataSource = 'live' | 'demo'

export interface MeasurementInput {
  astronaut_id: string
  eye: Eye
  timestamp: string
  rnfl_um: number | null
  quality: number
  device: string
}

export interface HistoryEntry {
  timestamp: string
  rawRnflUm: number | null
  estimatedRnflUm: number | null
  changeFromBaselineUm: number | null
  uncertaintyUm: number | null
  accepted: boolean
  flags: FlagCode[]
  /** Not returned by the current live backend history. Present only in simulation. */
  quality: number | null
}

export interface EyeStatus {
  eye: Eye
  baselineRnflUm: number | null
  estimatedRnflUm: number | null
  latestRawRnflUm: number | null
  changeFromBaselineUm: number | null
  uncertaintyUm: number | null
  lastValidScan: string | null
  history: HistoryEntry[]
}

export interface SansStatus {
  astronautId: string
  eyes: Record<Eye, EyeStatus>
}

export type SchedulePriority = 'routine' | 'elevated' | 'high' | 'unknown'

export interface EyeSchedule {
  eye: Eye
  priority: SchedulePriority
  priorityLabel: string
  intervalDays: number | null
  reason: string | null
  statusLabel: string | null
  baselineMissing: boolean
}

export interface SansSchedule {
  astronautId: string
  eyes: Record<Eye, EyeSchedule>
}

export interface MeasurementResult {
  accepted: boolean | null
  flags: FlagCode[]
  message: string | null
}

export interface AstronautOverview {
  astronautId: string
  status: SansStatus | null
  vitalSigns: unknown
}

export interface HealthResult {
  ok: boolean
  detail: string | null
  checkedAt: string
}

export interface SansClient {
  source: DataSource
  health(): Promise<HealthResult>
  submitMeasurement(input: MeasurementInput): Promise<MeasurementResult>
  getStatus(astronautId: string): Promise<SansStatus>
  getSchedule(astronautId: string): Promise<SansSchedule>
  getOverview(astronautId: string): Promise<AstronautOverview>
}
