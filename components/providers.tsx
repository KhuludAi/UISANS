'use client'

import { MotionConfig } from 'motion/react'
import { useEffect, useState } from 'react'
import { SWRConfig } from 'swr'
import { useAppStore } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    Promise.resolve(useAppStore.persist.rehydrate()).finally(() => setHydrated(true))
  }, [])

  return (
    <SWRConfig value={{ revalidateOnFocus: true, dedupingInterval: 2000 }}>
      <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}>
        <div data-hydrated={hydrated ? '' : undefined} className="contents">
          {children}
        </div>
      </MotionConfig>
    </SWRConfig>
  )
}
