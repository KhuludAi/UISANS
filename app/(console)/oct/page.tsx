'use client'

import { ImageUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Panel } from '@/components/kit/panel'
import { Note, PageHeader, Pill } from '@/components/kit/primitives'
import { RetinaScan } from '@/components/sans/retina-scan'
import { config } from '@/lib/config'

export default function OctPage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  return (
    <>
      <PageHeader
        index="08"
        eyebrow="OCT AI Analysis"
        title="Image-level analysis"
        description="Planned: automated segmentation of OCT B-scans to extract RNFL thickness and morphology features as a second, independent signal."
      >
        <Pill tone="warn">Integration pending</Pill>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Panel title="Scan viewer">
          <div className="relative mx-auto max-w-xs">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={`Selected OCT image ${file?.name ?? ''}`} className="aspect-square w-full border border-border object-cover" />
            ) : (
              <RetinaScan />
            )}
          </div>
          <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-ice/40 px-4 py-4 text-sm text-ice hover:bg-ice/5">
            <ImageUp className="size-4" aria-hidden />
            {file ? file.name : 'Select an OCT image to preview'}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <p className="mt-2 text-center text-xs text-silver">Preview only. The image stays in your browser.</p>
        </Panel>
        <Panel title="Inference status">
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-silver">Endpoint</dt>
              <dd className="break-all font-mono text-star">{config.octApiUrl ?? 'Not configured (NEXT_PUBLIC_OCT_API_URL)'}</dd>
              <dt className="text-silver">Model</dt>
              <dd className="text-star">No validated model connected</dd>
              <dt className="text-silver">Output</dt>
              <dd className="text-star">None. No AI result is shown or estimated.</dd>
            </dl>
            <Note tone="warn">
              SANSIGHT will not fabricate segmentation or thickness values. Once an inference service and its contract are
              available, results will appear here with model version and confidence, and will still require human review.
            </Note>
          </div>
        </Panel>
      </div>
    </>
  )
}
