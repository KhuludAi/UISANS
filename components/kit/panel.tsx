import { cn } from '@/lib/utils'

interface PanelProps {
  title?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  as?: 'section' | 'div' | 'article'
}

function Ticks() {
  const base = 'pointer-events-none absolute size-2 border-ice/50'
  return (
    <>
      <span aria-hidden className={cn(base, '-left-px -top-px border-l border-t')} />
      <span aria-hidden className={cn(base, '-right-px -top-px border-r border-t')} />
      <span aria-hidden className={cn(base, '-bottom-px -left-px border-b border-l')} />
      <span aria-hidden className={cn(base, '-bottom-px -right-px border-b border-r')} />
    </>
  )
}

export function Panel({ title, meta, actions, children, className, bodyClassName, as: Tag = 'section' }: PanelProps) {
  return (
    <Tag className={cn('relative border border-border bg-midnight/70', className)}>
      <Ticks />
      {(title || actions || meta) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            {title && <h2 className="label-mono truncate text-silver">{title}</h2>}
            {meta}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </Tag>
  )
}
