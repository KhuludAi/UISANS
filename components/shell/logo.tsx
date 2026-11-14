import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-7', className)} fill="none">
      <ellipse cx="16" cy="16" rx="14" ry="8.5" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      <path d="M2 16h4M26 16h4" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" />
      <circle cx="27.5" cy="11" r="1.2" fill="#a397ff" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-ice', className)}>
      <LogoMark />
      <span className="font-mono text-sm font-medium tracking-[0.32em] text-star">SANSIGHT</span>
    </span>
  )
}
