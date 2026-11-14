'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { Panel } from '@/components/kit/panel'
import { ErrorState, PageHeader, Pill, Readout, Skeleton, SourceTag, actionClass } from '@/components/kit/primitives'
import { AlertList } from '@/components/sans/alert-list'
import { priorityTone } from '@/components/sans/eye-card'
import { config, SIMULATION_MISSION_ID } from '@/lib/config'
import { fmtDelta, fmtNum, fmtRelative } from '@/lib/format'
import { useAstronautId, useDataSource, useGroundStatus, useHealth, useRoster, useSansStatus, useSchedule } from '@/lib/sans/hooks'
import { useAlerts } from '@/lib/sans/use-alerts'
import { EYES, EYE_META } from '@/lib/sans/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function CrewRow({ id }: { id: string }) {
  const status = useSansStatus(id)
  const schedule = useSchedule(id)
  const current = useAstronautId()
  const setAstronautId = useAppStore((s) => s.setAstronautId)
  const removeFromRoster = useAppStore((s) => s.removeFromRoster)
  const roster = useRoster()

  return (
    <tr className={cn('border-b border-border/60', current === id && 'bg-atmos/20')}>
      <th scope="row" className="py-3 pr-4 text-left font-mono text-sm font-normal text-star">
        <button type="button" onClick={() => setAstronautId(id)} className="hover:text-ice">
          {id}
        </button>
      </th>
      {status.error ? (
        <td colSpan={4} className="py-3 pr-4">
          <ErrorState error={status.error} compact />
        </td>
      ) : (
        EYES.map((eye) => {
          const st = status.data?.eyes[eye]
          const sc = schedule.data?.eyes[eye]
          return (
            <td key={eye} className="py-3 pr-4" colSpan={2}>
              {!status.data ? (
                <Skeleton className="h-8 w-48" />
              ) : st?.baselineRnflUm === null ? (
                <span className="text-xs text-amber">Baseline not established</span>
              ) : (
                <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
                  <span className={eye === 'R' ? 'text-ice' : 'text-violet'}>{fmtNum(st?.estimatedRnflUm)}</span>
                  <span className="text-xs text-silver">±{fmtNum(st?.uncertaintyUm)}</span>
                  <span className="text-xs text-star">Δ {fmtDelta(st?.changeFromBaselineUm)}</span>
                  {sc && <Pill tone={priorityTone[sc.priority]}>{sc.priorityLabel}</Pill>}
                  <span className="text-[11px] text-silver">{fmtRelative(st?.lastValidScan)}</span>
                </div>
              )}
            </td>
          )
        })
      )}
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Link href="/astronaut" onClick={() => setAstronautId(id)} className={actionClass('ghost', 'sm')}>
            Open
          </Link>
          {roster.length > 1 && (
            <button type="button" onClick={() => removeFromRoster(id)} aria-label={`Remove ${id} from roster`} className="grid size-8 place-items-center text-silver hover:text-signal">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function MissionPage() {
  const source = useDataSource()
  const roster = useRoster()
  const id = useAstronautId()
  const health = useHealth()
  const ground = useGroundStatus()
  const { alerts } = useAlerts(id)
  const missionId = source === 'demo' ? SIMULATION_MISSION_ID : config.missionId

  return (
    <>
      <PageHeader
        index="01"
        eyebrow="Mission Control"
        title="Crew ocular health overview"
        description="Per-eye filtered RNFL estimates, uncertainty and scan priority for every tracked crew member. Values come directly from the configured data source."
      >
        <SourceTag source={source} />
      </PageHeader>

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Mission ID', value: missionId ?? 'Not configured', sub: missionId ? (source === 'demo' ? 'Simulation identifier' : 'From configuration') : 'Set NEXT_PUBLIC_MISSION_ID' },
          { label: 'Tracked crew', value: String(roster.length), sub: 'IDs tracked in this console' },
          {
            label: 'Local backend',
            value: health.error ? 'Unreachable' : health.data?.ok ? 'Online' : 'Checking',
            sub: source === 'demo' ? 'In-browser simulation' : config.sansApiUrl,
          },
          {
            label: 'Ground link',
            value: ground.state === 'not_configured' ? 'Not configured' : ground.state === 'connected' ? 'Linked' : ground.state === 'checking' ? 'Checking' : 'No link',
            sub: ground.simulated ? 'Simulated link' : 'Ground API',
          },
        ].map((k) => (
          <div key={k.label} className="bg-midnight/80 p-5">
            <Readout label={k.label} value={k.value} size="sm" sub={<span className="break-all">{k.sub}</span>} />
          </div>
        ))}
      </div>

      <Panel title="Crew roster" meta="Filtered RNFL µm · ±1σ · Δ from baseline · priority · last valid scan">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <caption className="sr-only">Crew roster with per-eye status</caption>
            <thead>
              <tr className="label-mono border-b border-border text-left text-[10px] text-silver">
                <th scope="col" className="py-2 pr-4 font-normal">Crew ID</th>
                {EYES.map((e) => (
                  <th key={e} scope="col" colSpan={2} className="py-2 pr-4 font-normal">
                    {EYE_META[e].name} ({EYE_META[e].code})
                  </th>
                ))}
                <th scope="col" className="py-2 font-normal"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => (
                <CrewRow key={r} id={r} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-silver">
          The backend has no crew-listing endpoint. Add IDs with the Crew ID control in the header.
        </p>
      </Panel>

      <Panel title={`Active alerts · ${id}`} actions={<Link href="/alerts" className={actionClass('ghost', 'sm')}>All alerts</Link>}>
        <AlertList alerts={alerts.slice(0, 6)} compact />
      </Panel>
    </>
  )
}
