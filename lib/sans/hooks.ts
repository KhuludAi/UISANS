'use client'

import { useCallback } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { config } from '@/lib/config'
import { useAppStore, useSessionStore } from '@/lib/store'
import { getSansClient } from './client'
import { ApiError } from './errors'
import type { MeasurementInput } from './types'

export function useDataSource() {
  return useAppStore((s) => s.dataSource)
}

export function useAstronautId() {
  return useAppStore((s) => s.astronautIds[s.dataSource])
}

export function useRoster() {
  return useAppStore((s) => s.rosters[s.dataSource])
}

const swrOpts = { shouldRetryOnError: false, keepPreviousData: true } as const

export function useHealth() {
  const source = useDataSource()
  return useSWR(['health', source], () => getSansClient(source).health(), { ...swrOpts, refreshInterval: 15000 })
}

export function useSansStatus(id: string | null | undefined) {
  const source = useDataSource()
  return useSWR(id ? ['status', source, id] : null, () => getSansClient(source).getStatus(id!), {
    ...swrOpts,
    refreshInterval: source === 'live' ? 30000 : 0,
  })
}

export function useSchedule(id: string | null | undefined) {
  const source = useDataSource()
  return useSWR(id ? ['schedule', source, id] : null, () => getSansClient(source).getSchedule(id!), {
    ...swrOpts,
    refreshInterval: source === 'live' ? 30000 : 0,
  })
}

export function useOverview(id: string | null | undefined) {
  const source = useDataSource()
  return useSWR(id ? ['overview', source, id] : null, () => getSansClient(source).getOverview(id!), swrOpts)
}

export function useRefreshAstronaut() {
  const source = useDataSource()
  const { mutate } = useSWRConfig()
  return useCallback(
    (id: string) =>
      Promise.all([mutate(['status', source, id]), mutate(['schedule', source, id]), mutate(['overview', source, id])]),
    [mutate, source],
  )
}

export function useSubmitMeasurement() {
  const source = useDataSource()
  const refresh = useRefreshAstronaut()
  const addConflict = useSessionStore((s) => s.addConflict)
  return useCallback(
    async (input: MeasurementInput) => {
      try {
        const result = await getSansClient(source).submitMeasurement(input)
        await refresh(input.astronaut_id)
        return result
      } catch (e) {
        if (e instanceof ApiError && e.kind === 'conflict') {
          addConflict({
            at: new Date().toISOString(),
            source,
            astronautId: input.astronaut_id,
            eye: input.eye,
            timestamp: input.timestamp,
            detail: e.message,
          })
        }
        throw e
      }
    },
    [source, refresh, addConflict],
  )
}

export type GroundState = 'not_configured' | 'connected' | 'disconnected' | 'checking'

export function useGroundStatus(): { state: GroundState; simulated: boolean } {
  const source = useDataSource()
  const simUp = useAppStore((s) => s.groundLinkSim)
  const live = useSWR(
    source === 'live' && config.groundApiUrl ? ['ground', config.groundApiUrl] : null,
    async () => {
      const res = await fetch(`${config.groundApiUrl}/health`, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) throw new Error(String(res.status))
      return true
    },
    { ...swrOpts, refreshInterval: 20000 },
  )
  if (source === 'demo') return { state: simUp ? 'connected' : 'disconnected', simulated: true }
  if (!config.groundApiUrl) return { state: 'not_configured', simulated: false }
  if (live.isLoading) return { state: 'checking', simulated: false }
  return { state: live.data ? 'connected' : 'disconnected', simulated: false }
}
