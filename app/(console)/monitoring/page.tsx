'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { Action, ErrorState, PageHeader, Segmented, SourceTag } from '@/components/kit/primitives'
import { EyeCard } from '@/components/sans/eye-card'
import { HistoryTable } from '@/components/sans/history-table'
import { MeasurementForm } from '@/components/sans/measurement-form'
import { RnflChart } from '@/components/sans/rnfl-chart'
import { useAstronautId, useDataSource, useRefreshAstronaut, useSansStatus, useSchedule } from '@/lib/sans/hooks'
import { EYES, EYE_META, type Eye } from '@/lib/sans/types'

export default function MonitoringPage() {
  const id = useAstronautId()
  const source = useDataSource()
  const status = useSansStatus(id)
  const schedule = useSchedule(id)
  const refresh = useRefreshAstronaut()
  const [focus, setFocus] = useState<Eye | 'both'>('both')
  const eyes = focus === 'both' ? EYES : [focus]

  const rows = eyes.flatMap((e) => (status.data?.eyes[e].history ?? []).map((h) => ({ ...h, eye: e })))

  return (
    <>
      <PageHeader
        index="03"
        eyebrow="SANS Eye Monitoring"
        title="RNFL thickness, filtered"
        description="Each eye is tracked independently. Accepted scans update a Kalman-filtered estimate; flagged scans stay in the record but are excluded from it."
      >
        <SourceTag source={source} />
        <Segmented
          label="Eye focus"
          value={focus}
          onChange={setFocus}
          options={[
            { value: 'both', label: 'Both' },
            { value: 'R', label: 'OD' },
            { value: 'L', label: 'OS' },
          ]}
        />
        <Action variant="ghost" size="sm" onClick={() => refresh(id)} aria-label="Refresh data">
          <RefreshCw className="size-3.5" aria-hidden /> Refresh
        </Action>
      </PageHeader>

      {status.error && <ErrorState error={status.error} onRetry={() => status.mutate()} />}

      <div className={focus === 'both' ? 'grid gap-6 xl:grid-cols-2' : 'grid gap-6'}>
        {eyes.map((e) => (
          <div key={e} className="flex flex-col gap-6">
            <EyeCard eye={e} status={status.data?.eyes[e]} schedule={schedule.data?.eyes[e]} loading={status.isLoading} />
            <Panel title={`${EYE_META[e].name} · trend`}>
              <RnflChart status={status.data?.eyes[e]} color={e === 'R' ? '#6adcf5' : '#a397ff'} height={focus === 'both' ? 260 : 340} />
            </Panel>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <Panel title="Measurement history" meta={`${rows.length} records`}>
          <HistoryTable rows={rows} showEye={focus === 'both'} caption={`Measurement history for ${id}`} />
        </Panel>
        <div>
          <MeasurementForm onSubmitted={() => refresh(id)} />
        </div>
      </div>
    </>
  )
}
