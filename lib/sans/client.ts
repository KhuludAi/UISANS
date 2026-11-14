import { liveClient } from './live-client'
import { simClient } from './sim-client'
import type { DataSource, SansClient } from './types'

export function getSansClient(source: DataSource): SansClient {
  return source === 'demo' ? simClient : liveClient
}
