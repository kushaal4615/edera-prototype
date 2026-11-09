import { useLayoutEffect, useState } from 'react'

/* One source of truth for which viewer shell renders.
   phone   = viewport under 768px wide, or a landscape phone (short + touch)
   desktop = everything else: the framed viewer, unchanged
   ?view=phone / ?view=desktop overrides it (testing, or a big phone that wants frames). */

export type ViewerMode = 'desktop' | 'phone'

const PHONE_QUERY = '(max-width: 767px), (max-height: 500px) and (pointer: coarse)'

function override(): ViewerMode | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('view')
  return v === 'phone' || v === 'desktop' ? v : null
}

export function useViewerMode(): ViewerMode {
  const get = (): ViewerMode => override() ?? (typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches ? 'phone' : 'desktop')
  const [mode, setMode] = useState<ViewerMode>(get)
  useLayoutEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    const on = () => setMode(override() ?? (mq.matches ? 'phone' : 'desktop'))
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return mode
}
