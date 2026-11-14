'use client'

import { Panel } from '@/components/kit/panel'
import { Note, PageHeader, Pill } from '@/components/kit/primitives'
import { useAppStore } from '@/lib/store'

const FIELDS = [
  { key: 'medications', label: 'Medications on board', placeholder: 'List available medications' },
  { key: 'equipment', label: 'Diagnostic equipment', placeholder: 'e.g. OCT, fundoscope, ultrasound' },
  { key: 'contraindications', label: 'Known contraindications', placeholder: 'Crew-specific contraindications' },
  { key: 'resupply', label: 'Resupply / return window', placeholder: 'e.g. none for 180 days' },
]

const TOPICS = ['Lower body negative pressure', 'Venoconstrictive thigh cuffs', 'Sleep posture and head-tilt', 'Nutritional / one-carbon metabolism research', 'Intracranial pressure research']

export default function EvidencePage() {
  const constraints = useAppStore((s) => s.constraints)
  const setConstraint = useAppStore((s) => s.setConstraint)

  return (
    <>
      <PageHeader
        index="10"
        eyebrow="Treatment Evidence & Constraints"
        title="What is known, and what is possible"
        description="Mission constraints captured here will bound any future guidance. The curated evidence library is not yet connected."
      >
        <Pill tone="warn">Integration pending</Pill>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Mission constraints" meta="Saved in this browser">
          <div className="flex flex-col gap-4">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`c-${f.key}`} className="label-mono text-[10px] text-silver">{f.label}</label>
                <textarea
                  id={`c-${f.key}`}
                  rows={2}
                  value={constraints[f.key] ?? ''}
                  onChange={(e) => setConstraint(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1.5 w-full border border-input bg-void px-3 py-2 text-sm text-star outline-none placeholder:text-silver/50 focus:border-ice"
                />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Evidence library">
          <ul className="flex flex-col gap-px bg-border">
            {TOPICS.map((t) => (
              <li key={t} className="flex items-center justify-between gap-4 bg-midnight px-4 py-3">
                <span className="text-sm text-star">{t}</span>
                <span className="label-mono text-[10px] text-silver">No curated sources loaded</span>
              </li>
            ))}
          </ul>
          <Note className="mt-4">
            Research topics are listed for structure only. No efficacy claims are made until vetted sources with citations are connected.
          </Note>
        </Panel>
      </div>
    </>
  )
}
