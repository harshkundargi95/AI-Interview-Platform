import { useEffect, useRef } from 'react'
import { useBlocker } from 'react-router'
import { Button } from './ui.jsx'

export default function AbandonGuard({ enabled, onDiscard }) {
  const dialogRef = useRef(null)
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    enabled && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!enabled) return
    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [enabled])

  useEffect(() => {
    if (blocker.state === 'blocked') dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [blocker.state])

  return (
    <dialog ref={dialogRef} className="abandon-dialog" aria-labelledby="leave-title" aria-describedby="leave-description" onCancel={(event) => { event.preventDefault(); blocker.reset?.() }}>
      <h2 id="leave-title">Leave this interview?</h2>
      <p id="leave-description">Leaving discards unsaved edits. Previously saved answers remain in History. Choose Keep practicing, then Save progress to preserve your latest changes.</p>
      <div className="actions">
        <Button onClick={() => blocker.reset?.()}>Keep practicing</Button>
        <Button variant="secondary" onClick={() => { onDiscard(); blocker.proceed?.() }}>Discard and leave</Button>
      </div>
    </dialog>
  )
}

