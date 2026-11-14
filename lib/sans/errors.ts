export type ApiErrorKind = 'network' | 'timeout' | 'conflict' | 'validation' | 'not_found' | 'http' | 'not_configured'

export interface ValidationIssue {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly issues: ValidationIssue[]

  constructor(kind: ApiErrorKind, status: number, message: string, issues: ValidationIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.issues = issues
  }
}

export function describeError(error: unknown): { title: string; detail: string } {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return { title: 'Local backend unavailable', detail: error.message }
      case 'timeout':
        return { title: 'Local backend did not respond', detail: error.message }
      case 'conflict':
        return { title: 'Out-of-order or duplicate measurement', detail: error.message }
      case 'validation':
        return {
          title: 'Submission rejected by validation',
          detail: error.issues.length ? error.issues.map((i) => `${i.field}: ${i.message}`).join(' · ') : error.message,
        }
      case 'not_found':
        return { title: 'No record found', detail: error.message }
      case 'not_configured':
        return { title: 'Integration not configured', detail: error.message }
      default:
        return { title: `Backend error (HTTP ${error.status})`, detail: error.message }
    }
  }
  return { title: 'Unexpected error', detail: error instanceof Error ? error.message : String(error) }
}
