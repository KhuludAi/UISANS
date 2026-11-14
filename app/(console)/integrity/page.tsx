'use client'

import { Panel } from '@/components/kit/panel'
import { EmptyState, ErrorState, PageHeader, Readout, SourceTag } from '@/components/kit/primitives'
import { FlagBadge } from '@/components/sans/flag-badge'
import { HistoryTable } from '@/components/sans/history-table'
import { fmtDateTime } from '@/lib/format'
import { FLAG_INFO } from '@/lib/sans/flags'
import { useAstronautId, useDataSource, useSansStatus } from '@/lib/sans/hooks'
import { EYES, EYE_META, KNOWN_FLAGS } from '@/lib/sans/types'
import { useSessionStore } from '@/lib/store'

export default function IntegrityPage() {
  const id = useAstronautId()
  const source = useDataSource()
  const status = useSansStatus(id)
  const conflicts = useSessionStore((s) => s.conflicts)

  const rows = EYES.flatMap((e) => (status.data?.eyes[e].history ?? []).map((h) => ({ ...h, eye: e })))
  const total = rows.length
  const accepted = rows.filter((r) => r.accepted).length
  const counts = Object.fromEntries(KNOWN_FLAGS.map((f) => [f, rows.filter((r) => r.flags.includes(f)).length]))
  const flagged = rows.filter((r) => !r.accepted || r.flags.length)

  return (
    <>
      <PageHeader
        index="05"
        eyebrow="Data Integrity Center"
        title="Every scan is checked before it is trusted"
        description="Integrity flags are returned by the backend. Rejected scans remain in the audit record and never move the filtered estimate."
      >
        <SourceTag source={source} />
      </PageHeader>

      {status.error && <ErrorState error={status.error} onRetry={() => status.mutate()} />}

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-midnight/80 p-5"><Readout label="Records" value={total} /></div>
        <div className="bg-midnight/80 p-5"><Readout label="Accepted" value={accepted} tone="ice" /></div>
        <div className="bg-midnight/80 p-5"><Readout label="Excluded" value={total - accepted} tone="amber" /></div>
        <div className="bg-midnight/80 p-5">
          <Readout label="Acceptance rate" value={total ? `${Math.round((accepted / total) * 100)}%` : '—'} />
        </div>
      </div>

      <Panel title="Integrity flag catalog" meta={`Counts for ${id}, both eyes`}>
        <ul className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
          {KNOWN_FLAGS.map((f) => (
            <li key={f} className="flex flex-col gap-2 bg-midnight p-4">
              <div className="flex items-center justify-between gap-2">
                <FlagBadge code={f} />
                <span className="font-mono text-2xl text-star">{counts[f]}</span>
              </div>
              <code className="font-mono text-[11px] text-silver">{f}</code>
              <p className="text-sm text-silver">{FLAG_INFO[f].description}</p>
              <p className="text-xs text-star/80">Action: {FLAG_INFO[f].action}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Rejected submissions (HTTP 409)" meta="Duplicate or out-of-order timestamps · this session only">
        {conflicts.length === 0 ? (
          <EmptyState title="No timestamp conflicts this session." description="The backend has no audit-event endpoint yet, so 409 rejections are logged here for the current session." />
        ) : (
          <ul className="flex flex-col gap-2">
            {conflicts.map((c, i) => (
              <li key={i} className="border border-l-2 border-border border-l-amber bg-midnight/60 px-3 py-2 text-sm">
                <div className="font-mono text-xs text-silver">
                  {fmtDateTime(c.at)} · {c.astronautId} · {EYE_META[c.eye].code} · submitted {fmtDateTime(c.timestamp)} · {c.source}
                </div>
                <p className="mt-1 text-star">{c.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Flagged records" meta={`${flagged.length} records`}>
        <HistoryTable rows={flagged} showEye caption="Flagged measurement records" />
      </Panel>
    </>
  )
}
