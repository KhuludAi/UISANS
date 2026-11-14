'use client'

import { useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { Action, EmptyState, Note, PageHeader, Pill } from '@/components/kit/primitives'
import { config } from '@/lib/config'
import { fmtDateTime, fmtDelta, fmtNum } from '@/lib/format'
import { useAstronautId, useSansStatus, useSchedule } from '@/lib/sans/hooks'
import { EYES, EYE_META } from '@/lib/sans/types'
import { useSessionStore } from '@/lib/store'

const WORKFLOW = ['Monitoring data', 'Mission constraints', 'Curated evidence', 'Draft options', 'Medical review', 'Decision']

export default function GuidancePage() {
  const id = useAstronautId()
  const status = useSansStatus(id)
  const schedule = useSchedule(id)
  const decisions = useSessionStore((s) => s.decisions)
  const addDecision = useSessionStore((s) => s.addDecision)
  const [reviewer, setReviewer] = useState('')
  const [decision, setDecision] = useState('Acknowledged')
  const [note, setNote] = useState('')

  const record = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewer.trim()) return
    addDecision({ at: new Date().toISOString(), action: `Review packet ${id}`, reviewer: reviewer.trim(), status: decision, note: note.trim() })
    setNote('')
  }

  return (
    <>
      <PageHeader
        index="09"
        eyebrow="AI Care Guidance"
        title="Decision support, human decision"
        description="Planned: options grounded in curated evidence and mission constraints, drafted for authorized medical personnel. SANSIGHT never prescribes."
      >
        <Pill tone="warn">Integration pending</Pill>
      </PageHeader>

      <ol className="flex flex-wrap items-center gap-y-3">
        {WORKFLOW.map((s, i) => (
          <li key={s} className="flex items-center">
            <span className={`border px-3 py-1.5 font-mono text-xs ${i === 3 ? 'border-dashed border-amber/50 text-amber' : i >= 4 ? 'border-violet/40 text-violet' : 'border-ice/30 text-star'}`}>{s}</span>
            {i < WORKFLOW.length - 1 && <span aria-hidden className="mx-2 h-px w-5 bg-ice/40" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Review packet" meta="Deterministic summary of current data. Not AI output.">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {EYES.map((e) => {
              const st = status.data?.eyes[e]
              const sc = schedule.data?.eyes[e]
              return [
                <dt key={`${e}l`} className="text-silver">{EYE_META[e].code}</dt>,
                <dd key={`${e}v`} className="font-mono text-star">
                  {st?.baselineRnflUm === null
                    ? 'Baseline not established'
                    : `${fmtNum(st?.estimatedRnflUm)} µm ±${fmtNum(st?.uncertaintyUm)} · Δ ${fmtDelta(st?.changeFromBaselineUm)} · ${sc?.priorityLabel ?? '—'}`}
                </dd>,
              ]
            })}
          </dl>
          <div className="mt-4 border-t border-border pt-4 text-sm text-silver">
            Guidance service: <span className="font-mono text-star">{config.guidanceApiUrl ?? 'not configured'}</span>. No treatment options are generated.
          </div>
        </Panel>

        <Panel title="Record medical review" meta="Session only">
          <form onSubmit={record} className="flex flex-col gap-3">
            <label className="label-mono text-[10px] text-silver" htmlFor="rev">Reviewer</label>
            <input id="rev" required value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Flight surgeon name" className="h-10 border border-input bg-void px-3 text-sm text-star outline-none focus:border-ice" />
            <label className="label-mono text-[10px] text-silver" htmlFor="dec">Decision</label>
            <select id="dec" value={decision} onChange={(e) => setDecision(e.target.value)} className="h-10 border border-input bg-void px-3 text-sm text-star outline-none focus:border-ice">
              <option>Acknowledged</option>
              <option>Continue monitoring</option>
              <option>Escalate to ground medical</option>
              <option>Request additional scans</option>
            </select>
            <label className="label-mono text-[10px] text-silver" htmlFor="note">Note</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="border border-input bg-void px-3 py-2 text-sm text-star outline-none focus:border-ice" />
            <Action type="submit" variant="primary" size="sm" disabled={!reviewer.trim()}>Record decision</Action>
          </form>
        </Panel>
      </div>

      <Panel title="Decision log">
        {decisions.length === 0 ? (
          <EmptyState title="No decisions recorded this session." />
        ) : (
          <ul className="flex flex-col gap-2">
            {decisions.map((d, i) => (
              <li key={i} className="border border-l-2 border-border border-l-violet bg-midnight/60 px-3 py-2 text-sm">
                <div className="font-mono text-xs text-silver">{fmtDateTime(d.at)} · {d.reviewer}</div>
                <p className="text-star">{d.status}{d.note ? ` · ${d.note}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Note>Decisions are not persisted: the backend has no audit endpoint yet.</Note>
    </>
  )
}
