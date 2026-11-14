'use client'

import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { Action, ErrorState, Note, Segmented, SourceTag } from '@/components/kit/primitives'
import { toLocalInputValue } from '@/lib/format'
import { ApiError } from '@/lib/sans/errors'
import { useAstronautId, useDataSource, useSubmitMeasurement } from '@/lib/sans/hooks'
import { EYE_META, type Eye, type MeasurementResult } from '@/lib/sans/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { FlagList } from './flag-badge'

type Errors = Partial<Record<'timestamp' | 'rnfl' | 'quality' | 'device', string>>

function validate(d: { timestamp: string; rnfl: string; quality: string; device: string }, missing: boolean): Errors {
  const e: Errors = {}
  if (!d.timestamp || Number.isNaN(Date.parse(`${d.timestamp}:00Z`))) e.timestamp = 'Enter a valid UTC date and time.'
  if (!missing) {
    if (d.rnfl.trim() === '') e.rnfl = 'Enter an RNFL value, or mark the measurement as missing.'
    else if (!Number.isFinite(Number(d.rnfl))) e.rnfl = 'RNFL must be a number in micrometers.'
  }
  if (d.quality.trim() === '' || !Number.isFinite(Number(d.quality))) e.quality = 'Quality must be a number (device scale, typically 0–1).'
  if (!d.device.trim()) e.device = 'Device is required.'
  return e
}

const inputCls = (err?: string) =>
  cn(
    'h-10 w-full border bg-void px-3 font-mono text-sm text-star outline-none transition-colors placeholder:text-silver/50 focus:border-ice',
    err ? 'border-amber/70' : 'border-input',
  )

export function MeasurementForm({ defaultEye, onSubmitted }: { defaultEye?: Eye; onSubmitted?: (r: MeasurementResult) => void }) {
  const astronautId = useAstronautId()
  const source = useDataSource()
  const draft = useAppStore((s) => s.draft)
  const setDraft = useAppStore((s) => s.setDraft)
  const resetDraft = useAppStore((s) => s.resetDraft)
  const submit = useSubmitMeasurement()
  const [missing, setMissing] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<MeasurementResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const uid = useId()

  const eye = draft.eye ?? defaultEye ?? 'R'

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs = validate(draft, missing)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const r = await submit({
        astronaut_id: astronautId,
        eye,
        timestamp: new Date(`${draft.timestamp}:00Z`).toISOString(),
        rnfl_um: missing ? null : Number(draft.rnfl),
        quality: Number(draft.quality),
        device: draft.device.trim(),
      })
      setResult(r)
      onSubmitted?.(r)
      resetDraft()
      setMissing(false)
    } catch (e) {
      setError(e)
    } finally {
      setPending(false)
    }
  }

  const field = (name: keyof Errors) => ({
    id: `${uid}-${name}`,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${uid}-${name}-err` : undefined,
  })
  const Err = ({ name }: { name: keyof Errors }) =>
    errors[name] ? (
      <p id={`${uid}-${name}-err`} className="mt-1 text-xs text-amber">
        {errors[name]}
      </p>
    ) : null

  return (
    <Panel title="Submit OCT measurement" actions={<SourceTag source={source} />}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-silver">
            Astronaut <span className="font-mono text-star">{astronautId}</span>
          </div>
          <Segmented
            label="Eye"
            value={eye}
            onChange={(v) => setDraft({ eye: v })}
            options={[
              { value: 'R', label: `${EYE_META.R.code} · Right` },
              { value: 'L', label: `${EYE_META.L.code} · Left` },
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor={`${uid}-timestamp`} className="label-mono text-[10px] text-silver">
                Timestamp (UTC)
              </label>
              <button
                type="button"
                onClick={() => setDraft({ timestamp: toLocalInputValue() })}
                className="inline-flex items-center gap-1 text-[11px] text-ice hover:underline"
              >
                <Clock className="size-3" aria-hidden /> Now
              </button>
            </div>
            <input
              type="datetime-local"
              value={draft.timestamp}
              onChange={(e) => setDraft({ timestamp: e.target.value })}
              className={cn(inputCls(errors.timestamp), 'mt-1.5 [color-scheme:dark]')}
              {...field('timestamp')}
            />
            <Err name="timestamp" />
          </div>
          <div>
            <label htmlFor={`${uid}-rnfl`} className="label-mono text-[10px] text-silver">
              RNFL thickness (µm)
            </label>
            <input
              inputMode="decimal"
              value={missing ? '' : draft.rnfl}
              disabled={missing}
              onChange={(e) => setDraft({ rnfl: e.target.value })}
              placeholder={missing ? 'Reported missing' : 'e.g. 105'}
              className={cn(inputCls(errors.rnfl), 'mt-1.5 disabled:opacity-50')}
              {...field('rnfl')}
            />
            <Err name="rnfl" />
            <label className="mt-2 flex items-center gap-2 text-xs text-silver">
              <input type="checkbox" checked={missing} onChange={(e) => setMissing(e.target.checked)} className="accent-amber" />
              Report as missing measurement
            </label>
          </div>
          <div>
            <label htmlFor={`${uid}-quality`} className="label-mono text-[10px] text-silver">
              Scan quality
            </label>
            <input
              inputMode="decimal"
              value={draft.quality}
              onChange={(e) => setDraft({ quality: e.target.value })}
              placeholder="0.00 – 1.00"
              className={cn(inputCls(errors.quality), 'mt-1.5')}
              {...field('quality')}
            />
            <Err name="quality" />
          </div>
          <div>
            <label htmlFor={`${uid}-device`} className="label-mono text-[10px] text-silver">
              Device
            </label>
            <input
              value={draft.device}
              onChange={(e) => setDraft({ device: e.target.value })}
              className={cn(inputCls(errors.device), 'mt-1.5')}
              {...field('device')}
            />
            <Err name="device" />
          </div>
        </div>

        <Note>
          Out-of-range and low-quality values are not blocked here: the backend records them, flags them, and excludes them
          from the filtered estimate.
        </Note>

        <div className="flex items-center gap-3">
          <Action type="submit" variant="primary" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? 'Submitting' : 'Submit measurement'}
          </Action>
        </div>

        <div aria-live="polite">
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn('flex flex-col gap-2 border px-4 py-3', result.accepted === false ? 'border-amber/40 bg-amber/5' : 'border-ice/40 bg-ice/5')}
              >
                <div className="flex items-center gap-2 text-sm text-star">
                  <CheckCircle2 className={cn('size-4', result.accepted === false ? 'text-amber' : 'text-ice')} aria-hidden />
                  {result.message ?? (result.accepted === false ? 'Measurement recorded and excluded from the estimate.' : 'Measurement recorded.')}
                </div>
                <FlagList flags={result.flags} empty="No flags raised." />
              </motion.div>
            )}
            {error !== null && (
              <motion.div key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {error instanceof ApiError && error.kind === 'conflict' ? (
                  <div role="alert" className="border border-amber/40 bg-amber/5 px-4 py-3 text-sm">
                    <p className="font-medium text-star">Rejected: duplicate or out-of-order timestamp (HTTP 409)</p>
                    <p className="mt-1 text-silver">{error.message}</p>
                    <p className="mt-1 text-silver">Each eye accepts only strictly later timestamps. The event was logged to Data Integrity.</p>
                  </div>
                ) : error instanceof ApiError && error.kind === 'validation' ? (
                  <div role="alert" className="border border-amber/40 bg-amber/5 px-4 py-3 text-sm">
                    <p className="font-medium text-star">Backend validation failed (HTTP 422)</p>
                    <ul className="mt-1 list-inside list-disc text-silver">
                      {(error.issues?.length ? error.issues : [{ field: '', message: error.message }]).map((i, n) => (
                        <li key={n}>
                          {i.field && <span className="font-mono text-star">{i.field}</span>} {i.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ErrorState error={error} compact />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Panel>
  )
}
