'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, FastForward } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { actionClass } from '@/components/kit/primitives'
import { Wordmark } from '@/components/shell/logo'
import { EarthFallback } from '@/components/space/earth-fallback'
import { Starfield } from '@/components/space/starfield'
import { useWebGL } from '@/hooks/use-webgl'

const EarthScene = dynamic(() => import('@/components/space/earth-scene'), { ssr: false })

const LINES = ['Long-duration spaceflight changes the eye.', 'Measurements drift. Signals degrade. Earth is far.', 'SANSIGHT watches what cannot be seen.']

export function Hero() {
  const reduce = useReducedMotion() ?? false
  const webgl = useWebGL()
  const [skip, setSkip] = useState(false)
  const [stage, setStage] = useState(0)
  const done = skip || reduce || stage >= LINES.length

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setStage((s) => s + 1), stage === 0 ? 900 : 1500)
    return () => clearTimeout(t)
  }, [stage, done])

  return (
    <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-void" aria-label="Introduction">
      <Starfield density={0.7} />
      <div className="absolute inset-0 lg:left-[28%]">
        {webgl === false ? <EarthFallback /> : webgl ? <EarthScene skip={skip} reduced={reduce} /> : null}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgb(3_7_18/0.92)_10%,transparent_60%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-void to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <Wordmark />
        <nav aria-label="Entry" className="flex items-center gap-2">
          {!done && (
            <button type="button" onClick={() => setSkip(true)} className={actionClass('ghost', 'sm')}>
              <FastForward className="size-3.5" aria-hidden /> Skip intro
            </button>
          )}
          <Link href="/mission" className={actionClass('outline', 'sm')}>
            Mission Control
          </Link>
        </nav>
      </header>

      <div className="relative z-10 flex flex-1 items-center px-6 pb-16 md:px-10">
        <div className="max-w-2xl">
          <div className="h-20 md:h-16" aria-live="polite">
            {!done &&
              LINES.slice(0, stage).map((l, i) => (
                <motion.p
                  key={l}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: i === stage - 1 ? 1 : 0.35, y: 0 }}
                  className="font-mono text-xs tracking-wider text-silver md:text-sm"
                >
                  {l}
                </motion.p>
              ))}
          </div>

          <motion.div initial={false} animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }} transition={{ duration: 1.1 }}>
            <div className="label-mono flex items-center gap-3 text-ice">
              <span aria-hidden className="h-px w-10 bg-ice/60" />
              SANS monitoring · research prototype
            </div>
            <h1 className="mt-5 text-balance text-6xl font-medium leading-[0.92] tracking-tight text-star md:text-8xl">
              SANSIGHT
            </h1>
            <p className="mt-4 text-2xl font-light tracking-tight text-ice md:text-3xl">Beyond the Visible.</p>
            <p className="mt-6 max-w-xl text-pretty leading-relaxed text-silver md:text-lg">
              Integrity-aware, local-first monitoring of Spaceflight-Associated Neuro-ocular Syndrome. Each eye is tracked
              independently with Kalman-filtered RNFL estimates, explicit uncertainty, and adaptive OCT scheduling, even
              when the link to Earth is gone.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/mission" className={actionClass('primary', 'lg')}>
                Enter Mission Control <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/demo" className={actionClass('sim', 'lg')}>
                Explore with simulated data
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
