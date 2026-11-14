'use client'

import { Panel } from '@/components/kit/panel'
import { EmptyState, ErrorState, Note, PageHeader, Pill, Skeleton, SourceTag } from '@/components/kit/primitives'
import { config } from '@/lib/config'
import { useAstronautId, useDataSource, useOverview } from '@/lib/sans/hooks'

export default function VitalsPage() {
  const id = useAstronautId()
  const source = useDataSource()
  const overview = useOverview(config.features.vitals ? id : null)

  return (
    <>
      <PageHeader
        index="12"
        eyebrow="Vital Signs"
        title="Physiological context"
        description="Optional module. Vital signs are read from the astronaut overview endpoint when the backend provides them."
      >
        <SourceTag source={source} />
        <Pill tone="muted">Optional</Pill>
      </PageHeader>

      {!config.features.vitals ? (
        <EmptyState title="Vital signs module disabled." description="Enable with NEXT_PUBLIC_FEATURE_VITALS." />
      ) : (
        <Panel title={`Overview payload · ${id}`} meta="vital_signs field, shown as returned">
          {overview.error ? (
            <ErrorState error={overview.error} onRetry={() => overview.mutate()} />
          ) : overview.isLoading ? (
            <Skeleton className="h-32" />
          ) : overview.data?.vitalSigns == null ? (
            <EmptyState title="No vital signs returned." />
          ) : (
            <pre className="overflow-x-auto border border-border bg-void p-4 font-mono text-xs text-star">
              {JSON.stringify(overview.data.vitalSigns, null, 2)}
            </pre>
          )}
        </Panel>
      )}
      <Note>Values are displayed verbatim. No vital-sign metrics are invented while the integration is a placeholder.</Note>
    </>
  )
}
