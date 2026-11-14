export const DASH = '—'

export function fmtNum(v: number | null | undefined, digits = 1): string {
  return v === null || v === undefined || Number.isNaN(v) ? DASH : v.toFixed(digits)
}

export function fmtDelta(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return DASH
  const s = v.toFixed(digits)
  return v > 0 ? `+${s}` : s
}

const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})
const dateFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', day: '2-digit', timeZone: 'UTC' })

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return DASH
  const t = Date.parse(iso)
  return Number.isNaN(t) ? iso : `${dateTimeFmt.format(t)} UTC`
}

export function fmtDate(ms: number): string {
  return dateFmt.format(ms)
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return DASH
  const diff = Date.now() - Date.parse(iso)
  if (Number.isNaN(diff)) return DASH
  const abs = Math.abs(diff)
  const future = diff < 0
  const units: [number, string][] = [
    [86_400_000, 'd'],
    [3_600_000, 'h'],
    [60_000, 'm'],
  ]
  for (const [ms, label] of units) {
    if (abs >= ms) return future ? `in ${Math.floor(abs / ms)}${label}` : `${Math.floor(abs / ms)}${label} ago`
  }
  return 'just now'
}

export function toLocalInputValue(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}
