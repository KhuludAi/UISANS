'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Wordmark } from './logo'
import { NAV_GROUPS, STATUS_LABEL } from './nav'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Primary" className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="label-mono px-3 pb-2 text-[10px] text-silver/70">{group.label}</div>
          <ul className="flex flex-col">
            {group.items.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ice',
                      active ? 'text-star' : 'text-silver hover:text-star',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 border-l-2 border-ice bg-gradient-to-r from-ice/15 to-transparent"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                    <Icon className={cn('relative size-4 shrink-0', active ? 'text-ice' : 'text-silver/70 group-hover:text-ice')} aria-hidden />
                    <span className="relative flex-1 truncate">{item.label}</span>
                    {item.status !== 'live' && (
                      <span
                        title={STATUS_LABEL[item.status]}
                        className={cn(
                          'relative size-1.5 rounded-full',
                          item.status === 'pending' && 'bg-amber/80',
                          item.status === 'optional' && 'bg-silver/60',
                          item.status === 'sim' && 'bg-violet',
                        )}
                      >
                        <span className="sr-only">{STATUS_LABEL[item.status]}</span>
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/" className="outline-none focus-visible:ring-1 focus-visible:ring-ice" aria-label="SANSIGHT home">
          <Wordmark />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-5">
        <SidebarNav />
      </div>
      <div className="border-t border-sidebar-border px-5 py-4 text-[11px] leading-relaxed text-silver">
        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-amber/80" />Pending</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-violet" />Simulation</span>
        </div>
        Research prototype. Not a medical device. Does not provide diagnosis.
      </div>
    </aside>
  )
}
