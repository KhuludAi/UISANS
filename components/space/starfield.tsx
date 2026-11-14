'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Star {
  x: number
  y: number
  r: number
  a: number
  tw: number
  layer: number
}

const LAYERS = [
  { count: 260, size: [0.25, 0.8], drift: 0.004, depth: 4, alpha: 0.45 },
  { count: 110, size: [0.5, 1.2], drift: 0.009, depth: 10, alpha: 0.7 },
  { count: 34, size: [0.9, 1.7], drift: 0.016, depth: 22, alpha: 0.95 },
]

export function Starfield({
  density = 1,
  intensity = 1,
  parallax = true,
  className,
}: {
  density?: number
  intensity?: number
  parallax?: boolean
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let w = 0
    let h = 0
    let stars: Star[] = []
    let raf = 0
    const mouse = { x: 0, y: 0, cx: 0, cy: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const area = (w * h) / (1440 * 900)
      stars = LAYERS.flatMap((L, layer) =>
        Array.from({ length: Math.round(L.count * density * Math.max(area, 0.35)) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: L.size[0] + Math.random() * (L.size[1] - L.size[0]),
          a: L.alpha * (0.5 + Math.random() * 0.5),
          tw: Math.random() * Math.PI * 2,
          layer,
        })),
      )
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      mouse.cx += (mouse.x - mouse.cx) * 0.04
      mouse.cy += (mouse.y - mouse.cy) * 0.04
      for (const s of stars) {
        const L = LAYERS[s.layer]
        const x = (((s.x + t * L.drift * 0.06 + mouse.cx * L.depth) % w) + w) % w
        const y = s.y + mouse.cy * L.depth
        const twinkle = reduce ? 1 : 0.75 + Math.sin(t * 0.0012 + s.tw) * 0.25
        ctx.globalAlpha = s.a * twinkle * intensity
        ctx.fillStyle = s.layer === 2 && s.tw > 5.4 ? '#6adcf5' : '#eaf6ff'
        ctx.beginPath()
        ctx.arc(x, y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      if (!reduce) raf = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      if (!parallax || reduce) return
      mouse.x = (e.clientX / window.innerWidth - 0.5) * -1
      mouse.y = (e.clientY / window.innerHeight - 0.5) * -1
    }

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [density, intensity, parallax, reduce])

  return <canvas ref={ref} aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} />
}
