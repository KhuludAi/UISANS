'use client'

import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export function RetinaScan({ scanning = true, className, color = '#6adcf5' }: { scanning?: boolean; className?: string; color?: string }) {
  const reduce = useReducedMotion()
  const vessels = [
    'M100 100 C 70 80, 50 60, 22 52',
    'M100 100 C 72 112, 48 128, 20 150',
    'M100 100 C 130 82, 150 62, 178 46',
    'M100 100 C 132 116, 152 136, 180 158',
    'M100 100 C 92 70, 84 46, 80 18',
    'M100 100 C 110 132, 116 158, 120 184',
  ]
  return (
    <div className={cn('relative aspect-square', className)} aria-hidden>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id="fundus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#123c65" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#071a33" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#030712" stopOpacity="1" />
          </radialGradient>
          <clipPath id="eyeclip">
            <circle cx="100" cy="100" r="88" />
          </clipPath>
        </defs>
        <circle cx="100" cy="100" r="88" fill="url(#fundus)" stroke={color} strokeOpacity="0.35" />
        <g clipPath="url(#eyeclip)">
          {vessels.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              stroke={color}
              strokeOpacity={0.5}
              strokeWidth={1.2}
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: i * 0.1 }}
            />
          ))}
          <circle cx="100" cy="100" r="14" fill="none" stroke="#eaf6ff" strokeOpacity="0.7" />
          <circle cx="100" cy="100" r="6" fill="#eaf6ff" fillOpacity="0.25" />
          {[34, 56, 76].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={color} strokeOpacity="0.12" strokeDasharray="2 4" />
          ))}
          {scanning && !reduce && (
            <motion.rect
              x="0"
              width="200"
              height="3"
              fill={color}
              fillOpacity="0.7"
              initial={{ y: 12 }}
              animate={{ y: [12, 186, 12] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          )}
        </g>
        <path d="M100 4v10M100 186v10M4 100h10M186 100h10" stroke={color} strokeOpacity="0.6" />
      </svg>
    </div>
  )
}
