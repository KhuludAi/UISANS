'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { ErrorState, PageHeader, SourceTag, actionClass } from '@/components/kit/primitives'
import { AlertList } from '@/components/sans/alert-list'
import { CrewVisual } from '@/components/sans/crew-visual'
import { EyeCard } from '@/components/sans/eye-card'
import { RnflChart } from '@/components/sans/rnfl-chart'
import { useAstronautId, useDataSource, useSansStatus, useSchedule } from '@/lib/sans/hooks'
import { useAlerts } from '@/lib/sans/use-alerts'
import { EYE_META, type Eye } from '@/lib/sans/types'
import { useAppStore } from '@/lib/store'

export default function AstronautPage() {
  const id = useAstronautId()
  const source = useDataSource()
  const viewMode = useAppStore((s) => s.viewMode)
  const status = useSansStatus(id)
  const schedule = useSchedule(id)
  const { alerts } = useAlerts(id)
  const [eye, setEye] = useState<Eye>('R')

  return (
    <>
      <PageHeader
        index="02"
        eyebrow={viewMode === 'astronaut' ? 'Crew view' : 'Astronaut detail'}
        title={`Astronaut ${id}`}
        description={
          viewMode === 'astronaut'
            ? 'Your eye monitoring summary. Any change is reviewed by authorized medical personnel. This view does not provide a diagnosis.'
            : 'Independent right- and left-eye monitoring. Select an eye to focus its trend.'
        }
      >
        <SourceTag source={source} />
        <Link href="/monitoring" className={actionClass('primary', 'sm')}>
          Record scan
        </Link>
      </PageHeader>

      {status.error && <ErrorState error={status.error} onRetry={() => status.mutate()} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
        <Panel title="Eye selector">
          <CrewVisual status={status.data} schedule={schedule.data} selected={eye} onSelect={setEye} />
        </Panel>
        <Panel title={`${EYE_META[eye].name} · RNFL trend`} meta="Filtered estimate with ±2σ uncertainty band">
          <RnflChart status={status.data?.eyes[eye]} color={eye === 'R' ? '#6adcf5' : '#a397ff'} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(['R', 'L'] as Eye[]).map((e) => (
          <EyeCard
            key={e}
            eye={e}
            status={status.data?.eyes[e]}
            schedule={schedule.data?.eyes[e]}
            loading={status.isLoading}
            selected={eye === e}
            onSelect={() => setEye(e)}
          />
        ))}
      </div>

      <Panel title="Alerts for this astronaut">
        <AlertList alerts={alerts} compact={viewMode === 'astronaut'} />
      </Panel>
    </>
  )
}
