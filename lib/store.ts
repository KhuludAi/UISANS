'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DataSource, Eye } from '@/lib/sans/types'

export type ViewMode = 'astronaut' | 'mission'

export interface MeasurementDraft {
  eye: Eye
  timestamp: string
  rnfl: string
  quality: string
  device: string
}

const emptyDraft: MeasurementDraft = { eye: 'R', timestamp: '', rnfl: '', quality: '0.9', device: 'OCT' }

interface AppState {
  viewMode: ViewMode
  dataSource: DataSource
  astronautIds: Record<DataSource, string>
  rosters: Record<DataSource, string[]>
  draft: MeasurementDraft
  groundLinkSim: boolean
  simSyncedKeys: string[]
  simLastSyncAt: string | null
  constraints: Record<string, string>
  setViewMode: (m: ViewMode) => void
  setDataSource: (s: DataSource) => void
  setAstronautId: (id: string) => void
  addToRoster: (id: string) => void
  removeFromRoster: (id: string) => void
  setDraft: (d: Partial<MeasurementDraft>) => void
  resetDraft: () => void
  setGroundLinkSim: (up: boolean) => void
  markSimSynced: (keys: string[], at: string) => void
  resetSimSync: () => void
  setConstraint: (key: string, value: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      viewMode: 'mission',
      dataSource: 'live',
      astronautIds: { live: 'TEST001', demo: 'SIM-001' },
      rosters: { live: ['TEST001'], demo: ['SIM-001', 'SIM-002'] },
      draft: emptyDraft,
      groundLinkSim: true,
      simSyncedKeys: [],
      simLastSyncAt: null,
      constraints: {},
      setViewMode: (viewMode) => set({ viewMode }),
      setDataSource: (dataSource) => set({ dataSource }),
      setAstronautId: (id) =>
        set((s) => ({
          astronautIds: { ...s.astronautIds, [s.dataSource]: id },
          rosters: s.rosters[s.dataSource].includes(id)
            ? s.rosters
            : { ...s.rosters, [s.dataSource]: [...s.rosters[s.dataSource], id] },
        })),
      addToRoster: (id) =>
        set((s) =>
          s.rosters[s.dataSource].includes(id) ? s : { rosters: { ...s.rosters, [s.dataSource]: [...s.rosters[s.dataSource], id] } },
        ),
      removeFromRoster: (id) =>
        set((s) => {
          const next = s.rosters[s.dataSource].filter((r) => r !== id)
          return {
            rosters: { ...s.rosters, [s.dataSource]: next },
            astronautIds:
              s.astronautIds[s.dataSource] === id && next[0] ? { ...s.astronautIds, [s.dataSource]: next[0] } : s.astronautIds,
          }
        }),
      setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
      resetDraft: () => set((s) => ({ draft: { ...emptyDraft, eye: s.draft.eye, device: s.draft.device } })),
      setGroundLinkSim: (groundLinkSim) => set({ groundLinkSim }),
      markSimSynced: (keys, at) => set((s) => ({ simSyncedKeys: [...new Set([...s.simSyncedKeys, ...keys])], simLastSyncAt: at })),
      resetSimSync: () => set({ simSyncedKeys: [], simLastSyncAt: null, groundLinkSim: true }),
      setConstraint: (key, value) => set((s) => ({ constraints: { ...s.constraints, [key]: value } })),
    }),
    {
      name: 'sansight.ui.v1',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)

export interface ConflictEvent {
  at: string
  source: DataSource
  astronautId: string
  eye: Eye
  timestamp: string
  detail: string
}

export interface DecisionEvent {
  at: string
  action: string
  reviewer: string
  status: string
  note: string
}

interface SessionState {
  conflicts: ConflictEvent[]
  decisions: DecisionEvent[]
  addConflict: (c: ConflictEvent) => void
  addDecision: (d: DecisionEvent) => void
}

/** Session-only events. Intentionally not persisted: the backend has no audit-events endpoint yet. */
export const useSessionStore = create<SessionState>()((set) => ({
  conflicts: [],
  decisions: [],
  addConflict: (c) => set((s) => ({ conflicts: [c, ...s.conflicts].slice(0, 50) })),
  addDecision: (d) => set((s) => ({ decisions: [d, ...s.decisions] })),
}))
