import { config } from '@/lib/config'
import { ApiError, type ValidationIssue } from './errors'
import { isObj, normalizeMeasurementResult, normalizeSchedule, normalizeStatus, pick } from './normalize'
import type { SansClient } from './types'

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function detailText(body: unknown): string | null {
  if (!isObj(body)) return null
  const d = pick(body, ['detail', 'message', 'error'])
  if (typeof d === 'string') return d
  if (isObj(d)) return JSON.stringify(d)
  return null
}

function validationIssues(body: unknown): ValidationIssue[] {
  if (!isObj(body) || !Array.isArray(body.detail)) return []
  return body.detail.map((d) => {
    const item = isObj(d) ? d : {}
    const loc = Array.isArray(item.loc) ? item.loc.filter((l) => l !== 'body').join('.') : 'request'
    return { field: loc || 'request', message: typeof item.msg === 'string' ? item.msg : 'Invalid value' }
  })
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const url = `${config.sansApiUrl}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
      signal: AbortSignal.timeout(config.requestTimeoutMs),
      cache: 'no-store',
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new ApiError('timeout', 0, `No response from ${config.sansApiUrl} within ${config.requestTimeoutMs / 1000}s.`)
    }
    throw new ApiError('network', 0, `Could not reach the local SANS backend at ${config.sansApiUrl}.`)
  }

  if (res.ok) return safeJson(res)

  const body = await safeJson(res)
  if (res.status === 409) {
    throw new ApiError('conflict', 409, detailText(body) ?? 'Out-of-order or duplicate measurement. Check the timestamp.')
  }
  if (res.status === 422) {
    const issues = validationIssues(body)
    throw new ApiError('validation', 422, detailText(body) && !issues.length ? detailText(body)! : 'Validation failed.', issues)
  }
  if (res.status === 404) {
    throw new ApiError('not_found', 404, detailText(body) ?? 'Resource not found.')
  }
  throw new ApiError('http', res.status, detailText(body) ?? res.statusText ?? 'Request failed.')
}

const enc = encodeURIComponent

export const liveClient: SansClient = {
  source: 'live',
  async health() {
    const body = await request('/health')
    const status = isObj(body) ? pick(body, ['status', 'ok']) : null
    return {
      ok: status === undefined || status === null || status === true || status === 'ok' || status === 'healthy',
      detail: typeof status === 'string' ? status : null,
      checkedAt: new Date().toISOString(),
    }
  },
  async submitMeasurement(input) {
    return normalizeMeasurementResult(await request('/sans/measurement', { method: 'POST', body: JSON.stringify(input) }))
  },
  async getStatus(id) {
    return normalizeStatus(await request(`/sans/status/${enc(id)}`), id)
  },
  async getSchedule(id) {
    return normalizeSchedule(await request(`/sans/schedule/${enc(id)}`), id)
  },
  async getOverview(id) {
    const body = await request(`/astronaut/${enc(id)}/overview`)
    const obj = isObj(body) ? body : {}
    const sans = pick(obj, ['sans', 'sans_status', 'ocular', 'monitoring'])
    return {
      astronautId: id,
      status: sans ? normalizeStatus(sans, id) : null,
      vitalSigns: pick(obj, ['vital_signs', 'vitals', 'vitalSigns']) ?? null,
    }
  },
}
