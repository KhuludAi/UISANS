'use client'

import { Loader2, Play, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { Panel } from '@/components/kit/panel'
import { Action, Note, PageHeader, Pill, actionClass } from '@/components/kit/primitives'
import { RetinaScan } from '@/components/sans/retina-scan'
import { DAY_MS } from '@/lib/sans/kalman'
import { resetSimulation, simClient, SIM_PARAMS } from '@/lib/sans/sim-client'
import type { Eye, MeasurementInput } from '@/lib/sans/types'
import { useAppStore } from '@/lib/store'

type Scenario = 'stable' | 'trend' | 'integrity'

const SCENARIOS: { id: Scenario; astronaut: string; title: string; body: string }[] = [
  { id: 'stable', astronaut: 'SIM-002', title: 'Stable crew member', body: 'Both eyes stable around baseline with routine scan quality.' },
  { id: 'trend', astronaut: 'SIM-001', title: 'Gradual RNFL increase (OD)', body: 'Right eye drifts upward over four months; left eye stays stable. Schedule tightens.' },
  { id: 'integrity', astronaut: 'SIM-003', title: 'Integrity stress test', body: 'Low-quality, missing, out-of-range and long-gap scans to exercise every flag.' },
]

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function build(s: Scenario, id: string): MeasurementInput[] {
  const r = rng(s === 'stable' ? 7 : s === 'trend' ? 11 : 23)
  const noise = () => (r() - 0.5) * 4
  const out: MeasurementInput[] = []
  const start = Date.now() - 120 * DAY_MS
  const eyes: Eye[] = ['R', 'L']
  for (const eye of eyes) {
    const base = eye === 'R' ? 104 : 101
    for (let i = 0; i < 12; i++) {
      const t = start + i * 10 * DAY_MS + (eye === 'L' ? 3_600_000 : 0)
      let rnfl: number | null = base + noise()
      let quality = 0.82 + r() * 0.15
      if (s === 'trend' && eye === 'R') rnfl += i * 0.75
      if (s === 'integrity') {
        if (i === 3) quality = 0.45
        if (i === 5) rnfl = null
        if (i === 7) rnfl = 260
        if (i === 9 && eye === 'L') quality = 1.4
        if (i >= 10) {
          out.push({ astronaut_id: id, eye, timestamp: new Date(t + 40 * DAY_MS).toISOString(), rnfl_um: base + noise(), quality, device: 'OCT-SIM' })
          continue
        }
      }
      out.push({ astronaut_id: id, eye, timestamp: new Date(t).toISOString(), rnfl_um: rnfl === null ? null : Math.round(rnfl * 10) / 10, quality: Math.round(quality * 100) / 100, device: 'OCT-SIM' })
    }
  }
  return out
}

export default function DemoPage() {
  const { mutate } = useSWRConfig()
  const setDataSource = useAppStore((s) => s.setDataSource)
  const setAstronautId = useAppStore((s) => s.setAstronautId)
  const resetSimSync = useAppStore((s) => s.resetSimSync)
  const source = useAppStore((s) => s.dataSource)
  const [busy, setBusy] = useState<Scenario | 'reset' | null>(null)
  const [log, setLog] = useState<string | null>(null)

  const load = async (sc: (typeof SCENARIOS)[number]) => {
    setBusy(sc.id)
    setDataSource('demo')
    resetSimulation()
    resetSimSync()
    const inputs = build(sc.id, sc.astronaut)
    let flagged = 0
    for (const m of inputs) {
      const res = await simClient.submitMeasurement(m)
      if (!res.accepted) flagged++
    }
    setAstronautId(sc.astronaut)
    await mutate(() => true)
    setLog(`${sc.title}: ${inputs.length} simulated scans loaded for ${sc.astronaut}, ${flagged} excluded by integrity checks.`)
    setBusy(null)
  }

  const reset = async () => {
    setBusy('reset')
    resetSimulation()
    resetSimSync()
    await mutate(() => true)
    setLog('Simulation data cleared.')
    setBusy(null)
  }

  return (
    <>
      <PageHeader
        index="11"
        eyebrow="Demo Mode"
        title="Explore SANSIGHT with simulated data"
        description="Scenarios run through an in-browser simulation of the backend contract. Simulated data is clearly labeled and never mixed with live records."
      >
        <Pill tone="sim">Simulation</Pill>
        {source === 'live' && <Action variant="sim" size="sm" onClick={() => setDataSource('demo')}>Switch to demo source</Action>}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,300px)]">
        <div className="grid gap-4 md:grid-cols-3">
          {SCENARIOS.map((sc) => (
            <Panel key={sc.id} as="article" title={sc.title} className="flex flex-col">
              <p className="text-sm leading-relaxed text-silver">{sc.body}</p>
              <p className="mt-3 font-mono text-xs text-violet">{sc.astronaut}</p>
              <Action variant="sim" size="sm" className="mt-5 w-full" disabled={busy !== null} onClick={() => load(sc)}>
                {busy === sc.id ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
                {busy === sc.id ? 'Loading' : 'Load scenario'}
              </Action>
            </Panel>
          ))}
        </div>
        <Panel title="Simulator">
          <RetinaScan scanning={busy !== null} color="#a397ff" className="mx-auto max-w-[200px]" />
          <Action variant="ghost" size="sm" className="mt-4 w-full" onClick={reset} disabled={busy !== null}>
            <RotateCcw className="size-3.5" aria-hidden /> Reset simulation
          </Action>
        </Panel>
      </div>

      <div aria-live="polite">
        {log && (
          <div className="flex flex-wrap items-center justify-between gap-3 border border-violet/40 bg-violet/5 px-4 py-3">
            <p className="text-sm text-star">{log}</p>
            <div className="flex gap-2">
              <Link href="/monitoring" className={actionClass('outline', 'sm')}>View monitoring</Link>
              <Link href="/planner" className={actionClass('ghost', 'sm')}>View planner</Link>
            </div>
          </div>
        )}
      </div>

      <Panel title="Simulation parameters" meta="Illustrative only, not the backend's validated values">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex justify-between gap-4"><dt className="text-silver">Measurement noise R</dt><dd className="font-mono text-star">{SIM_PARAMS.kalman.r} µm²</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-silver">Process noise Q</dt><dd className="font-mono text-star">{SIM_PARAMS.kalman.qPerDay} µm²/day</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-silver">Min quality</dt><dd className="font-mono text-star">{SIM_PARAMS.qualityMin}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-silver">Plausible RNFL range</dt><dd className="font-mono text-star">{SIM_PARAMS.rnflRange.join('–')} µm</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-silver">Long gap</dt><dd className="font-mono text-star">{SIM_PARAMS.longGapDays} days</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-silver">Trend review</dt><dd className="font-mono text-star">±{SIM_PARAMS.reviewChangeUm} µm</dd></div>
        </dl>
      </Panel>
      <Note tone="sim">Switch the header data source back to Live to work with the real SANS backend.</Note>
    </>
  )
}
