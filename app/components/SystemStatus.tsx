'use client'

import {useEffect, useState} from 'react'
import RuntimeHealthPanel from './RuntimeHealthPanel'

type Overall = 'checking' | 'healthy' | 'degraded' | 'unreachable'

type LiveState = 'connecting' | 'connected' | 'reconnecting' | 'offline'

// Compact top-bar status. It only reports a problem after a check has
// actually failed; before /api/health answers it says "Checking".
export default function SystemStatus({
  liveState,
  onManualScan,
}: {
  liveState: LiveState
  onManualScan: () => void
}) {
  const [overall, setOverall] = useState<Overall>('checking')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/health', {cache: 'no-store'})
      .then(async (response) => {
        const payload = await response.json().catch(() => null)
        if (cancelled) return
        if (!response.ok || !payload) setOverall('unreachable')
        else setOverall(payload.overall === 'healthy' ? 'healthy' : 'degraded')
      })
      .catch(() => {
        if (!cancelled) setOverall('unreachable')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Live sync has its own badge next to this control, so this reports dependency health only.
  const tone =
    overall === 'checking' ? 'checking'
      : overall === 'healthy' ? 'healthy'
        : 'degraded'
  const label =
    overall === 'checking' ? 'Checking systems…'
      : overall === 'unreachable' ? 'Health check unreachable'
        : overall === 'degraded' ? 'Dependencies degraded'
          : 'All systems healthy'

  return (
    <div className="systemStatus">
      <button
        type="button"
        className={`systemStatusButton systemStatusButton--${tone}`}
        aria-expanded={open}
        aria-controls="system-status-drawer"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="systemStatusDot" aria-hidden="true" />
        {label}
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div id="system-status-drawer" className="systemStatusDrawer">
          <RuntimeHealthPanel liveState={liveState} onManualScan={onManualScan} />
        </div>
      )}
    </div>
  )
}
