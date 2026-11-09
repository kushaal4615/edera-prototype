import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './styles/globals.css'
import { PrototypeViewer } from './viewer/PrototypeViewer'
import { assertReachability } from './lib/reachability'
import { startTracking } from './lib/tracker'

if (import.meta.env.DEV) assertReachability()
startTracking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <PrototypeViewer />
    </MotionConfig>
  </StrictMode>,
)
