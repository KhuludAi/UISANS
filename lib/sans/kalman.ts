export interface KalmanState {
  x: number
  p: number
}

export interface KalmanParams {
  /** Measurement noise variance (µm²) */
  r: number
  /** Process noise variance per day (µm²/day) */
  qPerDay: number
}

export function kalmanInit(z: number, params: KalmanParams): KalmanState {
  return { x: z, p: params.r }
}

export function kalmanPredict(state: KalmanState, dtDays: number, params: KalmanParams): KalmanState {
  return { x: state.x, p: state.p + params.qPerDay * Math.max(dtDays, 0) }
}

export function kalmanUpdate(state: KalmanState, z: number, params: KalmanParams): KalmanState & { gain: number } {
  const gain = state.p / (state.p + params.r)
  return { x: state.x + gain * (z - state.x), p: (1 - gain) * state.p, gain }
}

export const DAY_MS = 86_400_000
