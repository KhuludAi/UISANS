'use client'

import { RefreshCw, Satellite, Server } from 'lucide-react'
import { useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { Action, Note, PageHeader, Pill, Readout, SourceTag } from '@/components/kit/primitives'
import { config } from '@/lib/config'
import { fmtDateTime } from '@/lib/format'
import { useAstronautId, useDataSource, useGroundStatus, useHealth, useSansStatus } from '@/lib/sans/hooks'
import { EYES } from '@/lib/sans/types'
import { useAppStore } from '@/lib/store'

const PLANNED = [
  'Durable outbound queue of measurements awaiting ground sync',
  'Idempotent sync keyed by astronaut, eye and timestamp',
  'Conflict reconciliation when ground and local records diverge',
  'Compressed delta bundles for constrained links',
]

export default function OfflinePage() {
  const source = useDataSource()
  const id = useAstronautId()
  const health = useHealth()
  const ground = useGroundStatus()
  const status = useSansStatus(id)
  const groundLinkSim = useAppStore((s) => s.groundLinkSim)
  const setGroundLinkSim = useAppStore((s) => s.setGroundLinkSim)
  const synced = useAppStore((s) => s.simSyncedKeys)
  const lastSync = useAppStore((s) => s.simLastSyncAt)
  const markSimSynced = useAppStore((s) => s.markSimSynced)
  const [syncing, setSyncing] = useState(false)

  const keys = EYES.flatMap((e) => (status.data?.eyes[e].history ?? []).map((h) => `${id}:${e}:${h.timestamp}`))
  const pending = keys.filter((k) => !synced.includes(k))

  const runSync = async () => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 900))
    markSimSynced(pending, new Date().toISOString())
    setSyncing(false)
  }

  return (
    <>
      <PageHeader
        index="07"
        eyebrow="Offline & Sync"
        title="Monitoring does not wait for Earth"
        description="SANSIGHT talks to a local backend aboard the spacecraft. Loss of the ground link never interrupts recording, filtering or scheduling."
      >
        <SourceTag source={source} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><Server className="size-4 text-ice" aria-hidden />Local backend</span>}>
          <div className="grid grid-cols-2 gap-4">
            <Readout label="State" value={health.error ? 'Unreachable' : health.data?.ok ? 'Online' : 'Checking'} tone={health.error ? 'signal' : 'ice'} />
            <Readout label="Last check" value={fmtDateTime(health.data?.checkedAt)} size="sm" />
          </div>
          <p className="mt-4 break-all font-mono text-xs text-silver">{source === 'demo' ? 'In-browser simulation engine' : config.sansApiUrl}</p>
        </Panel>
        <Panel
          title={<span className="flex items-center gap-2"><Satellite className="size-4 text-violet" aria-hidden />Ground link</span>}
          actions={<Pill tone={ground.state === 'connected' ? (ground.simulated ? 'sim' : 'ok') : 'warn'}>{ground.state.replace('_', ' ')}</Pill>}
        >
          {source === 'live' && !config.groundApiUrl ? (
            <p className="text-sm leading-relaxed text-silver">
              No ground API is configured (<code className="font-mono text-star">NEXT_PUBLIC_GROUND_API_URL</code>). Ground synchronization
              is not available in live mode. Local monitoring is unaffected.
            </p>
          ) : source === 'demo' ? (
            <div className="flex flex-col gap-4">
              <label className="flex items-center justify-between gap-4 text-sm text-star">
                Simulated ground link
                <input type="checkbox" role="switch" checked={groundLinkSim} onChange={(e) => setGroundLinkSim(e.target.checked)} className="size-4 accent-violet" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Readout label="Awaiting sync" value={pending.length} tone={pending.length ? 'amber' : 'ice'} />
                <Readout label="Last sync" value={fmtDateTime(lastSync)} size="sm" />
              </div>
              <Action variant="sim" size="sm" onClick={runSync} disabled={!groundLinkSim || !pending.length || syncing}>
                <RefreshCw className={syncing ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
                {syncing ? 'Syncing' : groundLinkSim ? 'Sync simulated records' : 'Link down: queued locally'}
              </Action>
            </div>
          ) : (
            <p className="text-sm text-silver">Ground API configured at <span className="break-all font-mono text-star">{config.groundApiUrl}</span>. Sync protocol pending.</p>
          )}
        </Panel>
      </div>

      <Panel title="Planned synchronization capabilities" actions={<Pill tone="warn">Integration pending</Pill>}>
        <ul className="grid gap-px bg-border md:grid-cols-2">
          {PLANNED.map((p) => (
            <li key={p} className="bg-midnight p-4 text-sm text-silver">{p}</li>
          ))}
        </ul>
      </Panel>
      {source === 'demo' && <Note tone="sim">The sync shown here is simulated. No data leaves this browser.</Note>}
    </>
  )
}
