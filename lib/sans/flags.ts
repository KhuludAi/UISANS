import type { FlagCode, MonitoringFlag } from './types'

export type Severity = 'caution' | 'advisory' | 'info'

export interface FlagInfo {
  code: FlagCode
  label: string
  description: string
  message: string
  action: string
  severity: Severity
}

export const FLAG_INFO: Record<MonitoringFlag, FlagInfo> = {
  MISSING_MEASUREMENT: {
    code: 'MISSING_MEASUREMENT',
    label: 'Missing measurement',
    description: 'The submission did not include an RNFL thickness value.',
    message: 'RNFL measurement missing. New scan required.',
    action: 'Repeat the OCT scan and confirm the RNFL value was exported from the device.',
    severity: 'caution',
  },
  INVALID_SCAN_QUALITY: {
    code: 'INVALID_SCAN_QUALITY',
    label: 'Invalid scan quality',
    description: 'The reported scan quality is outside the supported 0–1 range or not a number.',
    message: 'Scan quality value is invalid. Verify the device output.',
    action: 'Check the quality index reported by the OCT device before resubmitting.',
    severity: 'caution',
  },
  LOW_SCAN_QUALITY: {
    code: 'LOW_SCAN_QUALITY',
    label: 'Low scan quality',
    description: 'Scan quality is below the supported threshold, so it is excluded from the filtered estimate.',
    message: 'Low scan quality detected. Repeat the scan.',
    action: 'Re-acquire the scan: check fixation, pupil alignment and signal strength.',
    severity: 'advisory',
  },
  OUT_OF_RANGE: {
    code: 'OUT_OF_RANGE',
    label: 'Out of supported range',
    description: 'The RNFL value falls outside the range the monitoring pipeline supports.',
    message: 'Measurement outside supported range. Verify the scan.',
    action: 'Verify segmentation and units (µm) on the source scan.',
    severity: 'caution',
  },
  OUT_OF_ORDER: {
    code: 'OUT_OF_ORDER',
    label: 'Out-of-order timestamp',
    description:
      'The timestamp precedes the most recent measurement for this eye. The API rejects these with HTTP 409 and does not persist them.',
    message: 'Out-of-order measurement. Check the timestamp.',
    action: 'Confirm the device clock and timestamp time zone (UTC).',
    severity: 'advisory',
  },
  LONG_VALID_SCAN_GAP: {
    code: 'LONG_VALID_SCAN_GAP',
    label: 'Long gap since valid scan',
    description: 'An extended interval has passed since the last valid scan for this eye.',
    message: 'Extended gap since the last valid scan.',
    action: 'Schedule a scan to refresh the estimate and reduce its uncertainty.',
    severity: 'info',
  },
}

export function flagInfo(code: FlagCode): FlagInfo {
  return (
    FLAG_INFO[code as MonitoringFlag] ?? {
      code,
      label: code,
      description: 'Flag returned by the backend without a local description.',
      message: `Backend flag: ${code}`,
      action: 'Review the backend documentation for this flag.',
      severity: 'info',
    }
  )
}

export const BASELINE_MISSING_MESSAGE = 'Baseline not established. Initial OCT scan required.'
export const RECORDED_MESSAGE = 'OCT measurement successfully recorded.'
