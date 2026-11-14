'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { actionClass } from '@/components/kit/primitives'

const PILLARS = [
  {
    n: '01',
    title: 'The challenge',
    body: 'Astronauts on long-duration missions can develop SANS: optic disc edema, globe flattening and retinal nerve fiber layer (RNFL) thickening. Deep-space crews will not have a clinic, a specialist, or a reliable link to Earth.',
  },
  {
    n: '02',
    title: 'The innovation',
    body: 'Raw OCT values are noisy and sometimes wrong. SANSIGHT gates every scan through integrity checks, filters accepted scans with a per-eye Kalman filter, carries uncertainty forward, and adapts the next scan interval to what it actually knows.',
  },
  {
    n: '03',
    title: 'The practical value',
    body: 'Everything runs against a local backend aboard the spacecraft. Monitoring continues offline. The system surfaces trends for authorized medical review. It never diagnoses or prescribes.',
  },
]

const PIPELINE = ['OCT scan', 'Integrity gate', 'Kalman update', 'Uncertainty', 'Adaptive schedule', 'Human review']

export function Story() {
  return (
    <section className="relative border-t border-border bg-void px-6 py-24 md:px-10" aria-labelledby="story-title">
      <div className="sci-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,transparent)]" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <h2 id="story-title" className="sr-only">
          About SANSIGHT
        </h2>
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.12 }}
              className="bg-void p-8"
            >
              <div className="font-mono text-xs text-ice">{p.n}</div>
              <h3 className="mt-6 text-xl font-medium text-star">{p.title}</h3>
              <p className="mt-3 text-pretty leading-relaxed text-silver">{p.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-20">
          <div className="label-mono text-silver">Monitoring pipeline</div>
          <ol className="mt-6 flex flex-wrap items-center gap-y-4">
            {PIPELINE.map((s, i) => (
              <motion.li
                key={s}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center"
              >
                <span className={`border px-3 py-2 font-mono text-xs ${i === 5 ? 'border-violet/40 text-violet' : 'border-ice/30 text-star'}`}>{s}</span>
                {i < PIPELINE.length - 1 && <span aria-hidden className="mx-2 h-px w-6 bg-ice/40" />}
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-border pt-10 md:flex-row md:items-center">
          <p className="max-w-xl text-sm leading-relaxed text-silver">
            Research prototype for hackathon demonstration. Not a medical device. All clinical interpretation remains with
            authorized medical personnel.
          </p>
          <div className="flex gap-3">
            <Link href="/mission" className={actionClass('primary', 'md')}>
              Mission Control
            </Link>
            <Link href="/demo" className={actionClass('sim', 'md')}>
              Demo Mode
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
