import { useState } from 'react'
import { useAuthState } from './context.js'
import { useInterview } from '../interview/useInterview.js'
import { Button, ButtonLink } from '../components/ui.jsx'

export default function AccountControls() {
  const auth = useAuthState()
  const { session, busy } = useInterview()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)
  const unsaved = session?.status === 'active' && session.questions.some(q => (session.answers[q.id] || '') !== (session.savedAnswers?.[q.id] || ''))
  async function signOut() {
    setLeaving(true); setError('')
    try { await auth.signOut() }
    catch { setError('Could not sign out. Please retry.') }
    finally { setLeaving(false) }
  }
  if (!auth.configured) return <ButtonLink to="/sign-in" variant="secondary">Sign in</ButtonLink>
  if (!auth.isLoaded) return <span role="status">Loading account…</span>
  if (!auth.isSignedIn) return <><ButtonLink to="/sign-in" variant="secondary">Sign in</ButtonLink><ButtonLink to="/sign-up">Create account</ButtonLink></>
  return <div className="account-controls">
    <span className="small">Signed in</span>
    <Button variant="secondary" disabled={busy || leaving} onClick={() => unsaved ? setConfirm(true) : signOut()}>{leaving ? 'Signing out…' : 'Sign out'}</Button>
    {confirm && <div className="signout-confirm" role="group" aria-label="Confirm sign out"><p>Signing out discards unsaved edits. Saved answers remain in your history.</p><Button disabled={leaving} onClick={signOut}>Discard edits and sign out</Button><Button variant="secondary" disabled={leaving} onClick={() => setConfirm(false)}>Keep editing</Button></div>}
    {error && <p role="alert">{error}</p>}
  </div>
}
