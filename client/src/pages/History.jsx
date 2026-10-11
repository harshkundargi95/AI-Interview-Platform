import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, EmptyState, PageHeading } from '../components/ui.jsx'
import { useAuthState } from '../auth/context.js'
import { useInterview } from '../interview/useInterview.js'
import { roleLabels, typeLabels } from '../interview/questions.js'

export default function History() {
  const { api: interviewApi } = useAuthState()
  const [page, setPage] = useState({ items: [], hasMore: false })
  const [skip, setSkip] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const { resumeInterview, discardInterview, session, busy, requestError } = useInterview()
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    interviewApi.history(skip).then(result => {
      if (active) { setPage(result); setLoading(false) }
    }).catch(error => { if (active) { setError(error.message); setLoading(false) } })
    return () => { active = false }
  }, [skip, refresh, interviewApi])
  function reload(nextSkip = skip) {
    setError(''); setLoading(true); setSkip(nextSkip); setRefresh(value => value + 1)
  }
  async function open(row) {
    if (await resumeInterview(row.id)) navigate(row.status === 'completed' ? '/feedback' : '/interview')
  }
  async function remove(id) {
    setDeleting(id); setError('')
    try {
      await interviewApi.remove(id)
      if (session?.id === id) discardInterview()
      setConfirmId(null); reload(0)
    } catch (error) { setError(error.message) }
    finally { setDeleting(null) }
  }
  return <>
    <PageHeading eyebrow="04 / Return" title="Your practice, in perspective.">Resume saved work or revisit your completed answers.</PageHeading>
    <p className="small-note">Your saved interviews. Only your signed-in account can access these records. No AI scores yet.</p>
    <div className="history-toolbar"><h2>Interview history</h2><Button variant="secondary" disabled={loading || busy || Boolean(deleting)} onClick={() => reload()}>Refresh history</Button></div>
    {loading && <p role="status">Loading saved interviews…</p>}
    {(error || requestError) && <p role="alert" className="form-error">{error || requestError}</p>}
    {!loading && !error && !page.items.length && <EmptyState title="Your first chapter is still ahead.">Start an interview to create your first saved record.</EmptyState>}
    {!loading && page.items.map(row => <Card className="history-item" key={row.id}>
      <div className="history-description">
        <span className="badge">{row.status === 'completed' ? 'Completed' : 'In progress'}</span>
        <h3>{roleLabels[row.preferences.role]}</h3>
        <p>{typeLabels[row.preferences.type]} · {row.savedAnswerCount} of {row.questionCount} answers saved</p>
        <p className="small-note">Created {new Date(row.createdAt).toLocaleString()}</p>
      </div>
      <div className="actions">
        <Button disabled={busy || Boolean(deleting)} onClick={() => open(row)}>{row.status === 'completed' ? 'Review answers' : 'Resume interview'}</Button>
        <Button variant="secondary" disabled={busy || Boolean(deleting)} onClick={() => setConfirmId(row.id)}>Delete interview</Button>
      </div>
      {confirmId === row.id && <div role="group" aria-label="Confirm deletion"><p>Delete this interview and all its saved answers? This cannot be undone.</p><div className="actions"><Button disabled={Boolean(deleting)} onClick={() => remove(row.id)}>{deleting ? 'Deleting…' : 'Confirm delete'}</Button><Button variant="secondary" disabled={Boolean(deleting)} onClick={() => setConfirmId(null)}>Cancel</Button></div></div>}
    </Card>)}
    <div className="actions"><Button variant="secondary" disabled={loading || busy || Boolean(deleting) || skip === 0} onClick={() => reload(Math.max(0, skip - 20))}>Previous page</Button><Button variant="secondary" disabled={loading || busy || Boolean(deleting) || !page.hasMore} onClick={() => reload(skip + 20)}>Next page</Button></div>
  </>
}
