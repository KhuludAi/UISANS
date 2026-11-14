export const config = {
  sansApiUrl: (process.env.NEXT_PUBLIC_SANS_API_URL ?? 'http://127.0.0.1:8001').replace(/\/$/, ''),
  groundApiUrl: process.env.NEXT_PUBLIC_GROUND_API_URL?.replace(/\/$/, '') || null,
  octApiUrl: process.env.NEXT_PUBLIC_OCT_API_URL?.replace(/\/$/, '') || null,
  guidanceApiUrl: process.env.NEXT_PUBLIC_GUIDANCE_API_URL?.replace(/\/$/, '') || null,
  missionId: process.env.NEXT_PUBLIC_MISSION_ID || null,
  requestTimeoutMs: 8000,
  features: {
    vitals: process.env.NEXT_PUBLIC_FEATURE_VITALS !== 'false',
  },
} as const

export const SIMULATION_MISSION_ID = 'SIM-LDM-01'
