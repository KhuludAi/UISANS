'use client'

import { useSyncExternalStore } from 'react'

let cached: boolean | null = null

function detect(): boolean {
  if (cached !== null) return cached
  try {
    const c = document.createElement('canvas')
    cached = Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}

const noop = () => () => {}

/** null while server-rendering, then true/false once the client has checked. */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(noop, detect, () => null)
}
