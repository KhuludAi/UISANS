'use client'

import { useMemo } from 'react'
import { describeError } from './errors'
import { deriveAlerts } from './alerts'
import { useDataSource, useGroundStatus, useHealth, useSansStatus, useSchedule } from './hooks'

export function useAlerts(astronautId: string) {
  const source = useDataSource()
  const health = useHealth()
  const status = useSansStatus(astronautId)
  const schedule = useSchedule(astronautId)
  const ground = useGroundStatus()

  const alerts = useMemo(
    () =>
      deriveAlerts({
        astronautId,
        status: status.data,
        schedule: schedule.data,
        backendReachable: health.error ? false : health.data ? health.data.ok : null,
        backendError: health.error ? describeError(health.error).detail : null,
        ground: ground.state,
        sourceLabel: source === 'demo' ? 'Simulation engine' : 'SANS backend',
      }),
    [astronautId, status.data, schedule.data, health.data, health.error, ground.state, source],
  )
  return { alerts, isLoading: status.isLoading || schedule.isLoading }
}
