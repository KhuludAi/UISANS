'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Menu, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Pill, Segmented } from '@/components/kit/primitives'
import { config } from '@/lib/config'
import { useAstronautId, useDataSource, useGroundStatus, useHealth, useRoster } from '@/lib/sans/hooks'
import { useAppStore } from '@/lib/store'
import { Wordmark } from './logo'
import { SidebarNav } from './sidebar'

function ConnectionPills() {
  const source = useDataSource()
  const health = useHealth()
  const ground = useGroundStatus()
  const local = health.error ? 'down' : health.data?.ok ? 'up' : health.isLoading ? 'checking' : 'down'
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
      <Pill
        tone={local === 'up' ? (source === 'demo' ? 'sim' : 'ok') : local === 'checking' ? 'muted' : 'alert'}
        pulse={local === 'checking'}
      >
        <span title={source === 'live' ? config.sansApiUrl : 'In-browser simulation engine'}>
          {source === 'demo' ? 'Sim engine' : 'Local'} · {local === 'up' ? 'online' : local === 'checking' ? 'checking' : 'offline'}
        </span>
      </Pill>
      <Pill
        tone={ground.state === 'connected' ? (ground.simulated ? 'sim' : 'ok') : ground.state === 'disconnected' ? 'warn' : 'muted'}
      >
        Ground ·{' '}
        {ground.state === 'not_configured' ? 'not configured' : ground.state === 'checking' ? 'checking' : ground.state === 'connected' ? 'linked' : 'no link'}
      </Pill>
    </div>
  )
}

function AstronautPicker() {
  const id = useAstronautId()
  const roster = useRoster()
  const setAstronautId = useAppStore((s) => s.setAstronautId)
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = value.trim()
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(v)) return
    setAstronautId(v)
    setValue('')
    setAdding(false)
  }

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor="astronaut-select" className="label-mono text-[10px] text-silver">
        Crew ID
      </label>
      {adding ? (
        <form onSubmit={submit} className="flex items-center gap-1">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. TEST002"
            aria-label="New astronaut ID"
            pattern="[A-Za-z0-9_\-]{1,40}"
            className="h-8 w-28 border border-input bg-void px-2 font-mono text-xs text-star outline-none focus:border-ice"
          />
          <button type="submit" className="label-mono h-8 border border-ice/40 px-2 text-[10px] text-ice hover:bg-ice/10">
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} aria-label="Cancel" className="grid size-8 place-items-center text-silver hover:text-star">
            <X className="size-3.5" />
          </button>
        </form>
      ) : (
        <>
          <select
            id="astronaut-select"
            value={id}
            onChange={(e) => setAstronautId(e.target.value)}
            className="h-8 border border-input bg-void px-2 font-mono text-xs text-star outline-none focus:border-ice"
          >
            {roster.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add astronaut ID"
            className="grid size-8 place-items-center border border-input text-silver hover:border-ice hover:text-ice"
          >
            <Plus className="size-3.5" />
          </button>
        </>
      )}
    </div>
  )
}

export function Topbar() {
  const source = useDataSource()
  const setDataSource = useAppStore((s) => s.setDataSource)
  const viewMode = useAppStore((s) => s.viewMode)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {source === 'demo' && (
        <div className="label-mono flex items-center justify-center gap-2 bg-violet/15 px-4 py-1.5 text-center text-[10px] text-violet">
          <span className="size-1.5 rounded-full bg-violet" aria-hidden />
          Demo mode · all values on screen are simulated and stored only in this browser
        </div>
      )}
      <div className="sticky top-0 z-30 border-b border-border bg-void/80 backdrop-blur-md">
        <div className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="grid size-9 place-items-center border border-border text-silver hover:text-star lg:hidden"
          >
            <Menu className="size-4" />
          </button>
          <Link href="/" className="lg:hidden" aria-label="SANSIGHT home">
            <Wordmark />
          </Link>
          <div className="hidden md:block">
            <ConnectionPills />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Segmented
              label="Data source"
              value={source}
              onChange={setDataSource}
              options={[
                { value: 'live', label: 'Live' },
                { value: 'demo', label: 'Demo' },
              ]}
            />
            <Segmented
              label="View mode"
              value={viewMode}
              onChange={setViewMode}
              className="hidden sm:inline-flex"
              options={[
                { value: 'mission', label: 'Mission' },
                { value: 'astronaut', label: 'Crew' },
              ]}
            />
            <AstronautPicker />
          </div>
        </div>
        <div className="border-t border-border px-4 py-2 md:hidden">
          <ConnectionPills />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-void/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-sidebar"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <Wordmark />
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center text-silver">
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-5">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
