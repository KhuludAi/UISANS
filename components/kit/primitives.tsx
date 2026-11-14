import { AlertTriangle, RotateCw } from 'lucide-react'
import Link from 'next/link'
import { describeError } from '@/lib/sans/errors'
import { cn } from '@/lib/utils'

export type Tone = 'ok' | 'warn' | 'alert' | 'muted' | 'sim' | 'info' | 'violet'

const toneClass: Record<Tone, string> = {
  ok: 'text-ice border-ice/30 bg-ice/5',
  info: 'text-star border-star/20 bg-star/5',
  warn: 'text-amber border-amber/35 bg-amber/5',
  alert: 'text-signal border-signal/40 bg-signal/5',
  muted: 'text-silver border-border bg-transparent',
  sim: 'text-violet border-violet/40 bg-violet/10',
  violet: 'text-violet border-violet/30 bg-violet/5',
}

const dotClass: Record<Tone, string> = {
  ok: 'bg-ice',
  info: 'bg-star',
  warn: 'bg-amber',
  alert: 'bg-signal',
  muted: 'bg-silver/60',
  sim: 'bg-violet',
  violet: 'bg-violet',
}

export function Pill({
  tone = 'muted',
  children,
  pulse,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  pulse?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'label-mono inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-0.5 text-[10px]',
        toneClass[tone],
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', dotClass[tone], pulse && 'animate-pulse-soft')} />
      {children}
    </span>
  )
}

export function Readout({
  label,
  value,
  unit,
  sub,
  tone,
  size = 'md',
  className,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  sub?: React.ReactNode
  tone?: 'ice' | 'amber' | 'violet' | 'signal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const color = tone === 'amber' ? 'text-amber' : tone === 'violet' ? 'text-violet' : tone === 'signal' ? 'text-signal' : tone === 'ice' ? 'text-ice' : 'text-star'
  const sz = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl'
  return (
    <div className={cn('min-w-0', className)}>
      <div className="label-mono text-[10px] text-silver">{label}</div>
      <div className={cn('mt-1 flex items-baseline gap-1 font-mono tabular-nums tracking-tight', sz, color)}>
        <span className="truncate">{value}</span>
        {unit && <span className="text-xs text-silver">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-xs text-silver">{sub}</div>}
    </div>
  )
}

export function PageHeader({
  index,
  eyebrow,
  title,
  description,
  children,
}: {
  index: string
  eyebrow: string
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="label-mono flex items-center gap-3 text-ice">
          <span className="text-silver">{index}</span>
          <span aria-hidden className="h-px w-8 bg-ice/40" />
          {eyebrow}
        </div>
        <h1 className="mt-3 text-balance text-3xl font-medium tracking-tight text-star md:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-silver">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse bg-atmos/30', className)} />
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-start gap-3 border border-dashed border-border px-5 py-8', className)}>
      <div className="label-mono text-silver">No data</div>
      <p className="text-lg text-star">{title}</p>
      {description && <p className="max-w-lg text-sm leading-relaxed text-silver">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  className,
  compact,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
  compact?: boolean
}) {
  const { title, detail } = describeError(error)
  return (
    <div role="alert" className={cn('flex flex-col gap-3 border border-amber/30 bg-amber/5 px-4 py-4', className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden />
        <div className="min-w-0">
          <p className="font-medium text-star">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-silver">{detail}</p>
          {!compact && (
            <p className="mt-2 text-sm leading-relaxed text-silver">
              No data is substituted for a failed request. Start the FastAPI service locally, or explore with{' '}
              <Link href="/demo" className="text-violet underline-offset-4 hover:underline">
                clearly labeled simulated data
              </Link>
              .
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <div>
          <Action variant="ghost" size="sm" onClick={onRetry}>
            <RotateCw className="size-3.5" aria-hidden /> Retry
          </Action>
        </div>
      )}
    </div>
  )
}

type ActionProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'sim'
  size?: 'sm' | 'md' | 'lg'
}

export function actionClass(variant: ActionProps['variant'] = 'outline', size: ActionProps['size'] = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ice focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:pointer-events-none disabled:opacity-40 active:translate-y-px',
    size === 'sm' && 'h-8 px-3 text-xs',
    size === 'md' && 'h-10 px-4 text-sm',
    size === 'lg' && 'h-12 px-6 text-sm tracking-wide',
    variant === 'primary' && 'bg-ice text-void hover:bg-star hover:shadow-[0_0_32px_-4px_rgb(106_220_245/0.6)]',
    variant === 'outline' && 'border border-ice/30 text-star hover:border-ice hover:bg-ice/10',
    variant === 'ghost' && 'text-silver hover:bg-atmos/40 hover:text-star',
    variant === 'sim' && 'border border-violet/40 bg-violet/10 text-violet hover:bg-violet/20',
  )
}

export function Action({ variant, size, className, ...props }: ActionProps) {
  return <button type="button" className={cn(actionClass(variant, size), className)} {...props} />
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode }[]
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex border border-border bg-void/60 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'label-mono px-3 py-1.5 text-[10px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ice',
            value === o.value ? 'bg-ice/15 text-ice' : 'text-silver hover:text-star',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SourceTag({ source }: { source: 'live' | 'demo' }) {
  return source === 'demo' ? <Pill tone="sim">Simulated data</Pill> : <Pill tone="ok">Live · local backend</Pill>
}

export function Note({ children, tone = 'muted', className }: { children: React.ReactNode; tone?: 'muted' | 'sim' | 'warn'; className?: string }) {
  return (
    <p
      className={cn(
        'border-l-2 py-1 pl-3 text-xs leading-relaxed',
        tone === 'sim' ? 'border-violet/60 text-violet' : tone === 'warn' ? 'border-amber/60 text-amber' : 'border-ice/30 text-silver',
        className,
      )}
    >
      {children}
    </p>
  )
}
